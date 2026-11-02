// Read-only tenant scope for Draft G3C. Caller supplies email from verified server session.
const EMAIL=/^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ID=/^[A-Za-z0-9_-]{1,100}$/;
const fail=(status,code)=>({ok:false,status,code});
const kinds={
 agent:{model:'agent',select:{id:true,organizationId:true,name:true,model:true,isActive:true},roles:['VIEWER','OPERATOR','ADMIN','OWNER']},
 conversation:{model:'conversation',select:{id:true,organizationId:true,title:true,channel:true,status:true},roles:['VIEWER','OPERATOR','ADMIN','OWNER']},
 message:{model:'message',select:{id:true,conversationId:true,role:true,content:true,createdAt:true},roles:['OPERATOR','ADMIN','OWNER']}
};
export async function authorizeScopedRead({email,organizationId,resourceId,conversationId,kind,db}){
 const config=kinds[kind];
 if(!config)return fail(404,'NOT_FOUND');
 if(typeof email!=='string'||!EMAIL.test(email.trim().toLowerCase()))return fail(401,'UNAUTHENTICATED');
 if(!ID.test(organizationId||'')||!ID.test(resourceId||'')||(kind==='message'&&!ID.test(conversationId||'')))
   return fail(404,'NOT_FOUND');
 if(!db?.user?.findUnique||!db?.organizationMembership?.findUnique||!db?.[config.model]?.findFirst)
   return fail(503,'AUTHZ_STORAGE_UNAVAILABLE');
 try {
  const user=await db.user.findUnique({where:{email:email.trim().toLowerCase()},select:{id:true}});
  if(!user?.id)return fail(403,'ORG_MEMBERSHIP_REQUIRED');
  const membership=await db.organizationMembership.findUnique({
    where:{userId_organizationId:{userId:user.id,organizationId}},
    select:{userId:true,organizationId:true,status:true,role:true}
  });
  if(!membership||membership.userId!==user.id||membership.organizationId!==organizationId||membership.status!=='ACTIVE')
    return fail(403,'ORG_MEMBERSHIP_REQUIRED');
  if(!config.roles.includes(membership.role))return fail(403,'ROLE_FORBIDDEN');
  const where=kind==='message'
    ? {id:resourceId,conversationId,conversation:{organizationId}}
    : {id:resourceId,organizationId};
  const result=await db[config.model].findFirst({where,select:config.select});
  if(!result)return fail(404,'NOT_FOUND');
  if(kind!=='message'&&result.organizationId!==organizationId)return fail(404,'NOT_FOUND');
  if(kind==='message'&&result.conversationId!==conversationId)return fail(404,'NOT_FOUND');
  return {ok:true,status:200,code:'AUTHORIZED',resource:result};
 } catch {return fail(503,'AUTHZ_STORAGE_UNAVAILABLE');}
}
