import { supabase } from "./supabase.js";
import { requireUser } from "./auth-core.js";
import { code, showMessage } from "./utils.js";
const user = await requireUser();
const codeInput = document.getElementById("wishlistCode"); codeInput.value = code();
document.getElementById("newCodeBtn").addEventListener("click",()=>codeInput.value=code());
document.getElementById("createWishlistForm").addEventListener("submit", async e=>{e.preventDefault(); const personName=document.getElementById("personName").value.trim(); const wishlistCode=codeInput.value.trim().toUpperCase(); const {data,error}=await supabase.from("wishlists").insert({person_name:personName,wishlist_code:wishlistCode,created_by:user.id}).select().single(); if(error)return showMessage("adminMessage",error.message); await supabase.from("wishlist_members").insert({wishlist_id:data.id,user_id:user.id,can_view:true,can_edit:true}); showMessage("adminMessage","Gift recipient created."); e.target.reset(); codeInput.value=code();});
