import { supabase } from "./supabase.js";import { redirectLoggedIn, ensureProfile } from "./auth-core.js";import { showMessage } from "./utils.js";
await redirectLoggedIn();
document.getElementById("loginForm").addEventListener("submit",async e=>{e.preventDefault();const email=document.getElementById("email").value.trim();const password=document.getElementById("password").value;const{data,error}=await supabase.auth.signInWithPassword({email,password});if(error)return showMessage("message",error.message);await ensureProfile(data.user);window.location.href="home.html"});
