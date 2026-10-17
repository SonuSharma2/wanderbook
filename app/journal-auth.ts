import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { getChatGPTUser } from './chatgpt-auth';

// This is one owner's journal. Anonymous visitors only use explicit album shares.
export const JOURNAL_OWNER_ID='journal-owner';
async function equalSecret(first:string,second:string){
 const digest=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const [a,b]=await Promise.all([digest(first),digest(second)]);let difference=0;
 for(let index=0;index<a.length;index++)difference|=a[index]^b[index];
 return difference===0;
}
export async function getJournalUser(){
 const ownerEmail=env.JOURNAL_OWNER_EMAIL?.toLowerCase();
 if(!ownerEmail)return null;
 const authorization=(await headers()).get('authorization');
 if(env.JOURNAL_ADMIN_KEY&&authorization?.startsWith('Bearer ')&&await equalSecret(authorization.slice(7),env.JOURNAL_ADMIN_KEY))return {userId:JOURNAL_OWNER_ID,email:ownerEmail,displayName:'Journal owner',fullName:null};
 const user=await getChatGPTUser();
 return user?.email.toLowerCase()===ownerEmail?{...user,userId:JOURNAL_OWNER_ID}:null;
}
