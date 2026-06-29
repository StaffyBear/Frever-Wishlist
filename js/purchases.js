import { supabase } from "./supabase.js";import { requireUser } from "./auth-core.js";import { money } from "./utils.js";
const user=await requireUser();const list=document.getElementById("purchaseList");
const{data,error}=await supabase.from("purchases").select("*, gifts(name, cost), wishlists(person_name)").eq("buyer_id",user.id).order("purchased_at",{ascending:false});
if(error){list.innerHTML=`<div class="empty">${error.message}</div>`}else if(!data||!data.length){list.innerHTML=`<div class="empty">No purchases yet.</div>`}else{list.innerHTML=data.map(p=>`<article class="card"><h3>${p.gifts?.name||"Gift"}</h3><p class="small">For: ${p.wishlists?.person_name||"Unknown"} · Qty ${p.quantity||1} · ${money(p.price||p.gifts?.cost)}</p></article>`).join("")}
