// Order 033: read-only npm advisory classification. Never modifies package or lock files.
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

function audit(args){
  const result=spawnSync('npm',['audit','--json',...args],{encoding:'utf8',timeout:120000,
    env:{...process.env,npm_config_fund:'false'}});
  if(result.error)throw result.error;
  if(!result.stdout.trim())throw Error('npm audit did not return JSON');
  let doc;
  try{doc=JSON.parse(result.stdout)}catch{throw Error('npm audit output could not be parsed');}
  if(!doc.metadata?.vulnerabilities)throw Error('npm audit metadata.vulnerabilities missing');
  return doc;
}
function summary(doc){
  const v=doc.metadata.vulnerabilities;
  const entries=Object.entries(doc.vulnerabilities||{}).map(([name,a])=>({
    name,severity:a.severity,isDirect:a.isDirect,
    fixAvailable:a.fixAvailable,
    via:(a.via||[]).map(x=>typeof x==='string'?x:x.name).filter(Boolean)
  })).sort((a,b)=>a.name.localeCompare(b.name));
  return {total:v.total,critical:v.critical,high:v.high,moderate:v.moderate,low:v.low,entries};
}
const all=summary(audit([]));
const prod=summary(audit(['--omit=dev']));
console.log('N1B_ADVISORY_AUDIT',JSON.stringify({production:prod,fullTree:all}));
assert.equal(prod.total,0,'production dependency advisories cannot be silently accepted');
assert.equal(prod.high,0);
assert.equal(prod.critical,0);
assert.equal(all.critical,0);
assert.equal(all.high,0);
// Nonproduction advisories are explicitly tracked as pending, not waived.
if(all.total)console.log('N1B_DEV_REVIEW_REQUIRED',all.total,'nonproduction alerts; triage and owner approval pending');
