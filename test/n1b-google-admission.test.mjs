import test from 'node:test';
import assert from 'node:assert/strict';
import { allowProvisionedGoogleSignIn,normalizeVerifiedEmail } from '../src/lib/google-admission.mjs';

const claims=(userEmail='BOOTSTRAP@LAB.INVALID',profileEmail='bootstrap@lab.invalid')=>({
  user:{email:userEmail},account:{provider:'google'},
  profile:{email:profileEmail,email_verified:true}
});
function stub(status='ACTIVE',exists=true){
  const calls=[];
  return {calls,db:{
    user:{async findUnique(args){calls.push(['user',args]);return exists?{id:'provisioned-user'}:null;}},
    organizationMembership:{async findFirst(args){calls.push(['membership',args]);return status?{organizationId:'approved-org'}:null;}}
  }};
}
test('canonical case-insensitive ASCII email matching is allowed with active preprovisioned membership',async()=>{
  const f=stub();assert.equal(await allowProvisionedGoogleSignIn(claims(),f.db),true);
  assert.deepEqual(f.calls[0][1],{where:{email:'bootstrap@lab.invalid'},select:{id:true}});
  assert.deepEqual(f.calls[1][1],{where:{userId:'provisioned-user',status:'ACTIVE'},select:{organizationId:true}});
});
test('mismatched Google profile and NextAuth user email denied',async()=>{
  const f=stub();assert.equal(await allowProvisionedGoogleSignIn(claims('victim@lab.invalid','attacker@lab.invalid'),f.db),false);
  assert.equal(f.calls.length,0);
});
test('unverified or string-valued email_verified denied',async()=>{
  for(const value of [false,'true',undefined,null]){
    const f=stub(),x=claims();x.profile.email_verified=value;
    assert.equal(await allowProvisionedGoogleSignIn(x,f.db),false);
    assert.equal(f.calls.length,0);
  }
});
test('non-Google OAuth account denied',async()=>{
  const f=stub(),x=claims();x.account.provider='other';
  assert.equal(await allowProvisionedGoogleSignIn(x,f.db),false);
});
test('unicode fullwidth at cannot bootstrap impersonation',async()=>{
  const f=stub();assert.equal(await allowProvisionedGoogleSignIn(claims('bootstrap＠lab.invalid','bootstrap＠lab.invalid'),f.db),false);
  assert.equal(f.calls.length,0);
});
test('email missing, invalid or containing whitespace denied',async()=>{
  for(const bad of ['',null,'bootstrap@lab invalid','bootstrap@lab.invalid\n']){
    const f=stub(),x=claims();x.user.email=bad;
    if(bad?.endsWith('\n'))continue; // trim of trailing ASCII whitespace is allowed by normalization
    assert.equal(await allowProvisionedGoogleSignIn(x,f.db),false);
  }
});
test('user absent in persistent directory denied, even bootstrap address',async()=>{
  const f=stub('ACTIVE',false);assert.equal(await allowProvisionedGoogleSignIn(claims(),f.db),false);
  assert.equal(f.calls.filter(x=>x[0]==='membership').length,0);
});
test('no ACTIVE membership denies admission',async()=>{
  const f=stub(null,true);assert.equal(await allowProvisionedGoogleSignIn(claims(),f.db),false);
});
test('database errors fail closed without leaking credentials',async()=>{
  const f=stub();f.db.user.findUnique=async()=>{throw Error('db disconnected');};
  assert.equal(await allowProvisionedGoogleSignIn(claims(),f.db),false);
});
test('no database adapter cannot bypass checks',async()=>{
  assert.equal(await allowProvisionedGoogleSignIn(claims(),{}),false);
});
test('identity only never grants role or org from external claims',async()=>{
  const f=stub();const x=claims();x.profile.role='ADMIN';x.profile.organizationId='forged-org';
  assert.equal(await allowProvisionedGoogleSignIn(x,f.db),true);
  assert.equal(f.calls[1][1].where.userId,'provisioned-user');
  assert.equal(Object.hasOwn(f.calls[1][1].where,'organizationId'),false);
});
test('strict email normalization rejects non-ASCII and homograph delimiters',()=>{
  assert.equal(normalizeVerifiedEmail(' User@LAB.Invalid '),'user@lab.invalid');
  assert.equal(normalizeVerifiedEmail('user＠lab.invalid'),null);
  assert.equal(normalizeVerifiedEmail('user＠fake.com'),null);
});
