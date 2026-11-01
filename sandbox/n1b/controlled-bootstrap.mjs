// Order 039: explicit, idempotent, sandbox-only bootstrap helper.
// Not wired into OAuth signIn or any HTTP endpoint; NEVER runs on production databases.
function assertIsolated(env){
  if(env.N1B_ALLOW_EPHEMERAL_DB_TEST!=='yes')throw Error('BOOTSTRAP_LAB_ONLY');
  const u=new URL(env.DATABASE_URL||'postgresql://x:x@127.0.0.1:1/invalid');
  if(u.hostname!=='127.0.0.1'||u.pathname!=='/n1b_lab'||u.username!=='n1b_lab')
    throw Error('BOOTSTRAP_DISPOSABLE_POSTGRES_ONLY');
  const email=env.NEXOSAI_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const orgId=env.N1B_APPROVED_ORG_ID;
  if(!email?.endsWith('@lab.invalid') || !/^bootstrap-[a-z0-9]+$/.test(email.split('@')[0]) ||
     !/^bootstraporg[a-z0-9]+$/.test(orgId||''))throw Error('BOOTSTRAP_SYNTHETIC_IDENTITY_ONLY');
  return {email,orgId};
}
export async function provisionApprovedBootstrapLab(db,env){
  const {email,orgId}=assertIsolated(env);
  if(!db?.$transaction)throw Error('BOOTSTRAP_PRISMA_REQUIRED');
  return db.$transaction(async tx=>{
    const org=await tx.organization.findUnique({where:{id:orgId},select:{id:true}});
    if(!org)throw Error('BOOTSTRAP_ORGANIZATION_MUST_PREEXIST');
    let user=await tx.user.findUnique({where:{email},select:{id:true}});
    if(!user)user=await tx.user.create({data:{email},select:{id:true}});
    const where={userId_organizationId:{userId:user.id,organizationId:orgId}};
    const prior=await tx.organizationMembership.findUnique({where,select:{role:true,status:true}});
    if(prior){
      // No auto-activation, no auto-repair of revoked users, no implicit promotion.
      if(prior.status!=='ACTIVE'||prior.role!=='ADMIN')throw Error('BOOTSTRAP_EXISTING_POLICY_REQUIRES_MANUAL_REVIEW');
      return Object.freeze({userId:user.id,organizationId:orgId,created:false});
    }
    await tx.organizationMembership.create({data:{userId:user.id,organizationId:orgId,role:'ADMIN',status:'ACTIVE'}});
    return Object.freeze({userId:user.id,organizationId:orgId,created:true});
  });
}
