// Draft-only N1-B: tenant read access against an injected Prisma-compatible client.
// The caller MUST obtain email from a verified NextAuth server session, never from HTTP input.
const fail=(status,code)=>Object.freeze({ok:false,status,code});
const EMAIL=/^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ID=/^[A-Za-z0-9_-]{1,100}$/;

export async function authorizeNodeRead({email,organizationId,nodeId,db}){
  if(typeof email!=='string')return fail(401,'UNAUTHENTICATED');
  const canonical=email.trim().toLowerCase();
  if(!EMAIL.test(canonical))return fail(401,'UNAUTHENTICATED');
  if(!ID.test(organizationId||'')||!ID.test(nodeId||''))return fail(404,'NOT_FOUND');
  if(!db?.user?.findUnique||!db?.organizationMembership?.findUnique||!db?.node?.findFirst)
    return fail(503,'AUTHZ_STORAGE_UNAVAILABLE');

  try{
    const user=await db.user.findUnique({where:{email:canonical},select:{id:true}});
    if(!user?.id)return fail(403,'ORG_MEMBERSHIP_REQUIRED');
    const membership=await db.organizationMembership.findUnique({
      where:{userId_organizationId:{userId:user.id,organizationId}},
      select:{userId:true,organizationId:true,role:true,status:true}
    });
    if(!membership||membership.userId!==user.id||membership.organizationId!==organizationId||
       membership.status!=='ACTIVE'||!['ADMIN','OWNER','OPERATOR','VIEWER'].includes(membership.role))
      return fail(403,'ORG_MEMBERSHIP_REQUIRED');

    // MUST filter by organizationId inside the database query: never fetch by id alone.
    const node=await db.node.findFirst({
      where:{id:nodeId,organizationId},
      select:{id:true,organizationId:true,name:true,type:true,status:true,lastSeenAt:true}
    });
    if(!node||node.organizationId!==organizationId)return fail(404,'NOT_FOUND');
    return {ok:true,status:200,code:'AUTHORIZED',node};
  }catch{
    return fail(503,'AUTHZ_STORAGE_UNAVAILABLE');
  }
}
