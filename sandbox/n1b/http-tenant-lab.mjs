// Orders 031/032 — isolated HTTP authorization proof using genuine NextAuth JWT cryptography.
// NOT a production route, database adapter or deployment authorization.
import { createServer } from 'node:http';
import { getToken } from 'next-auth/jwt';
import { resolveTenantPrincipal, authorizeTenantResource, authorizeNestedResource } from './tenant-guards.mjs';

const SECRET = 'n1b-synthetic-isolated-jwt-signing-credentials-2026-0000';

export function createLabData() {
  return {
    memberships: new Map([
      ['user-a:org-a',{userId:'user-a',organizationId:'org-a',role:'VIEWER',status:'ACTIVE'}],
      ['admin-a:org-a',{userId:'admin-a',organizationId:'org-a',role:'ADMIN',status:'ACTIVE'}],
      ['user-b:org-b',{userId:'user-b',organizationId:'org-b',role:'OWNER',status:'ACTIVE'}],
      ['user-a:org-b',{userId:'user-a',organizationId:'org-b',role:'VIEWER',status:'SUSPENDED'}]
    ]),
    nodes: new Map([
      ['node-a',{id:'node-a',organizationId:'org-a'}],
      ['node-b',{id:'node-b',organizationId:'org-b'}]
    ]),
    conversations: new Map([
      ['conv-a',{id:'conv-a',organizationId:'org-a'}],
      ['conv-b',{id:'conv-b',organizationId:'org-b'}]
    ]),
    messages: new Map([
      ['msg-a',{id:'msg-a',parentId:'conv-a'}],
      ['msg-b',{id:'msg-b',parentId:'conv-b'}],
      ['msg-mismatch',{id:'msg-mismatch',parentId:'conv-b'}]
    ])
  };
}
function send(res,status,code){
  res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});
  res.end(JSON.stringify({ok:status===200,code}));
}
const READ=['ADMIN','OWNER','OPERATOR','VIEWER'];
const WRITE=['ADMIN','OWNER','OPERATOR'];

export function makeLabHandler(db=createLabData()) {
  return async function handle(req,res) {
    try {
      const path=new URL(req.url,'http://127.0.0.1').pathname;
      const match=path.match(/^\/v1\/orgs\/([a-z0-9-]+)\/(nodes|conversations)\/([a-z0-9-]+)(?:\/messages\/([a-z0-9-]+))?$/);
      if(!match)return send(res,404,'NOT_FOUND');
      const [,orgId,kind,id,messageId]=match;
      if(!['GET','PATCH'].includes(req.method))return send(res,405,'METHOD_NOT_ALLOWED');
      if(messageId && kind!=='conversations')return send(res,404,'NOT_FOUND');
      // NextAuth verifies JWT/JWE from the cookie. No user-id or role comes from request headers.
      const token=await getToken({req,secret:SECRET,secureCookie:false});
      if(!token || typeof token.sub!=='string' || !token.sub)return send(res,401,'UNAUTHENTICATED');
      const userId=token.sub;
      const membership=db.memberships.get(userId+':'+orgId);
      const principal=resolveTenantPrincipal({userId,selectedOrganizationId:orgId,membership});
      if(!principal.ok)return send(res,principal.status,principal.code);
      const allowed=req.method==='GET'?READ:WRITE;
      const parent=kind==='nodes'?db.nodes.get(id):db.conversations.get(id);
      // Prevent cross-tenant existence leaks even when role would not permit a mutation.
      if(!parent || parent.organizationId!==principal.organizationId)return send(res,404,'NOT_FOUND');
      const result=messageId
        ?authorizeNestedResource(principal,db.messages.get(messageId),parent,allowed)
        :authorizeTenantResource(principal,parent,allowed);
      if(!result.ok)return send(res,result.status,result.code);
      return send(res,200,'AUTHORIZED');
    }catch(e){
      // Fail closed; do not echo JWTs, cookie values or stack traces to clients.
      return send(res,401,'UNAUTHENTICATED');
    }
  };
}
export {SECRET};
export async function listenLab(db=createLabData()){
  const server=createServer(makeLabHandler(db));
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {base:'http://127.0.0.1:'+server.address().port,db,close:()=>new Promise(resolve=>server.close(resolve))};
}
