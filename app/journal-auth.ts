import { env } from 'cloudflare:workers';
import { getChatGPTUser } from './chatgpt-auth';

// This is one owner's journal. Anonymous visitors only use explicit album shares.
export const JOURNAL_OWNER_ID='journal-owner';
export async function getJournalUser(){
 const ownerEmail=env.JOURNAL_OWNER_EMAIL?.toLowerCase();
 if(!ownerEmail)return null;
 const user=await getChatGPTUser();
 return user?.email.toLowerCase()===ownerEmail?{...user,userId:JOURNAL_OWNER_ID}:null;
}
