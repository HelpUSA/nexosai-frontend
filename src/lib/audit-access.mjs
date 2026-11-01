// Sensitive audit log queries MUST be tenant-filtered and field-allowlisted.
const ID=/^[A-Za-z0-9_-]{1,100}$/;
export async function listTenantAuditLogs({organizationId,db}){
  if(typeof organizationId!=='string'||!ID.test(organizationId))return [];
  if(!db?.auditLog?.findMany)throw Error('N1B_AUDIT_STORAGE_UNAVAILABLE');
  try{
    return await db.auditLog.findMany({
      where:{organizationId},
      orderBy:{createdAt:'desc'},
      take:15,
      select:{
        id:true,action:true,severity:true,createdAt:true,details:true,
        user:{select:{email:true}},
        node:{select:{name:true}}
      }
    });
  }catch{throw Error('N1B_AUDIT_STORAGE_UNAVAILABLE');}
}
