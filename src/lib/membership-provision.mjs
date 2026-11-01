// Controlled provisioning only: no HTTP endpoint or self-service privilege assignment.
// Caller must verify upstream identity and obtain organizationId from approved server policy.
const EMAIL=/^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ID=/^[A-Za-z0-9_-]{1,100}$/;
export async function provisionSuspendedMembership({verifiedEmail,organizationId,db}){
  if(typeof verifiedEmail!=='string')return {ok:false,code:'VERIFIED_EMAIL_REQUIRED'};
  const email=verifiedEmail.trim().toLowerCase();
  if(!EMAIL.test(email)||!ID.test(organizationId||''))return {ok:false,code:'INVALID_IDENTITY_OR_ORG'};
  if(!db?.$transaction)return {ok:false,code:'STORAGE_UNAVAILABLE'};
  try{
    return await db.$transaction(async tx=>{
      const org=await tx.organization.findUnique({where:{id:organizationId},select:{id:true}});
      if(!org)return {ok:false,code:'ORG_NOT_FOUND'};
      const user=await tx.user.upsert({where:{email},update:{},create:{email},select:{id:true}});
      // A revoked or suspended membership is NEVER promoted by a login.
      const membership=await tx.organizationMembership.upsert({
        where:{userId_organizationId:{userId:user.id,organizationId}},
        update:{},
        create:{userId:user.id,organizationId,role:'VIEWER',status:'SUSPENDED'},
        select:{userId:true,organizationId:true,role:true,status:true}
      });
      return {ok:true,code:'PROVISIONED_WITHOUT_PRIVILEGE',membership};
    });
  }catch{
    return {ok:false,code:'STORAGE_UNAVAILABLE'};
  }
}
