import {createClient} from '@supabase/supabase-js';
const supabase=createClient('https://jiagacsorwpvbqvewgwz.supabase.co','sb_publishable_GG1XhYAJFL8IOa7eRI9gsg_4eYrdcD6',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:sessionStorage}});
async function cloudUser(){
 const {data:{session},error}=await supabase.auth.getSession();if(error)throw error;if(!session)return null;
 const u=session.user;let {data:v,error:ve}=await supabase.from('diary_vaults').select('*').eq('user_id',u.id).maybeSingle();if(ve)throw ve;
 if(!v){const m=u.user_metadata||{};if(!m.encrypted_vault||!m.display_name)throw Error('Vault setup is incomplete. Contact the app owner.');const r=await supabase.from('diary_vaults').insert({user_id:u.id,display_name:m.display_name,vault:m.encrypted_vault}).select().single();if(r.error)throw r.error;v=r.data;}
 return {id:u.id,email:u.email,name:v.display_name,vault:v.vault};
}
async function api(path,method='GET',body={}){
 if(path==='/api/session')return {user:await cloudUser()};
 if(path==='/api/register'){
  const {data,error}=await supabase.auth.signUp({email:body.email.trim(),password:body.password,options:{data:{display_name:body.name.trim(),encrypted_vault:body.vault},emailRedirectTo:location.origin+'/'} });
  if(error)throw error;
  if(!data.user || (data.user.identities && data.user.identities.length===0))throw Error('Account may already exist. Try signing in instead.');
  if(data.session)await cloudUser();
  return {awaitingVerification:!data.session};
 }
 if(path==='/api/login'){const {error}=await supabase.auth.signInWithPassword({email:body.email.trim(),password:body.password});if(error)throw error;return {ok:true};}
 if(path==='/api/logout'){const {error}=await supabase.auth.signOut();if(error)throw error;return {ok:true};}
 const u=await cloudUser();if(!u)throw Error('Please sign in again.');
 if(path==='/api/entries'&&method==='GET'){const {data,error}=await supabase.from('diary_entries').select('id,kind,iv,cipher,created,updated').order('updated',{ascending:false}).limit(300);if(error)throw error;return {entries:data};}
 if(path==='/api/entries'&&method==='POST'){
  const values={kind:body.kind,iv:body.iv,cipher:body.cipher,updated:new Date().toISOString()};let result;
  if(body.id)result=await supabase.from('diary_entries').update(values).eq('id',body.id).select('id').single();
  else result=await supabase.from('diary_entries').insert({...values,user_id:u.id}).select('id').single();
  if(result.error)throw result.error;return {id:result.data.id};
 }
 if(path==='/api/delete'){const {data,error}=await supabase.from('diary_entries').delete().eq('id',body.id).select('id').single();if(error)throw error;return {id:data.id};}
 if(path==='/api/vault'){const {error}=await supabase.from('diary_vaults').update({vault:body.vault}).eq('user_id',u.id);if(error)throw error;return {ok:true};}
 throw Error('Unsupported action');
}
