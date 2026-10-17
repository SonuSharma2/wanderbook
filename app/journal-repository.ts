import type { Entry } from './journal';

export interface JournalRepository{
 list:()=>Promise<Entry[]>;
 save:(entry:Entry)=>Promise<Entry>;
 remove:(id:string)=>Promise<void>;
}
