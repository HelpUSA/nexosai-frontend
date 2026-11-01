// Sandbox N1-B: Google's verified identity is necessary but never sufficient.
// Only a preprovisioned User with an ACTIVE OrganizationMembership may sign in.
// No automatic admin/organization creation, no email-defined role elevation.
const EMAIL=/^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function normalizeVerifiedEmail(value){
  if(typeof value!=='string')return null;
  const s=value.trim().toLowerCase();
  return EMAIL.test(s)?s:null;
}
export async function allowProvisionedGoogleSignIn({user,account,profile},db){
  const claimed=normalizeVerifiedEmail(user?.email);
  const verified=normalizeVerifiedEmail(profile?.email);
  if(account?.provider!=='google'||!claimed||!verified||
     claimed!==verified||profile?.email_verified!==true)return false;
  if(!db?.user?.findUnique||!db?.organizationMembership?.findFirst)return false;
  try{
    const record=await db.user.findUnique({where:{email:claimed},select:{id:true}});
    if(!record?.id)return false;
    const membership=await db.organizationMembership.findFirst({
      where:{userId:record.id,status:'ACTIVE'},
      select:{organizationId:true}
    });
    return Boolean(membership?.organizationId);
  }catch{return false;}
}
