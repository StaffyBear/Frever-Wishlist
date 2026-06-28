import { supabase } from "./supabase.js";

export async function currentUser(){
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireUser(){
  const user = await currentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

export async function redirectLoggedIn(){
  const user = await currentUser();
  if (user) window.location.href = "home.html";
}

export async function logout(){
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

export async function ensureProfile(user, displayName = null){
  if (!user) return;
  const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (data) return;
  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    display_name: displayName || user.email,
    role: "member"
  });
}
