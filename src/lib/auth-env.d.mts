export interface NexosAuthEnv {
  readonly secret: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly bootstrapEmail: string;
}
export function parseNexosAuthEnv(env: NodeJS.ProcessEnv): NexosAuthEnv;
