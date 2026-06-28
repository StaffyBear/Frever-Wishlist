import { supabase } from "./supabase.js";
import { requireLogin, redirectIfLoggedIn, setupLoginForm, setupRegisterForm, signOut } from "./auth.js";
import { showMessage, formatMoney, generateCode } from "./ui.js";

const page=document.body.dataset.page;
if("serviceWorker" in navigator){navigator.serviceWorker.register("./service-worker.js").catch(()=>{})}
if(page==="index")redirectIfLoggedIn();
if(page==="login"){redirectIfLoggedIn();setupLoginForm()}
if(page==="register"){redirectIfLoggedIn();setupRegisterForm()}
if(["dashboard","wishlists","wishlist","admin","purchases","profile"].includes(page)){requireLogin().then(user=>{if(!user)return;const el=document.querySelector("[data-user-email]");if(el)el.textContent=user.email})}
const logoutBtn=document.getElementById("logoutBtn");if(logoutBtn)logoutBtn.addEventListener("click",signOut);

async function loadWishlists(){
 const list=document.getElementById("wishlistList");if(!list)return;
 const{data,error}=await supabase.from("wishlists").select("*").order("created_at",{ascending:false});
 if(error){list.innerHTML=`<div class="card small-text">${error.message}</div>`;return}
 if(!data||data.length===0){list.innerHTML=`<div class="card small-text">No wishlists yet. Create one in Admin.</div>`;return}
 list.innerHTML=data.map(w=>`<a class="menu-tile" href="wishlist.html?id=${w.id}"><div class="menu-icon">🎁</div><div><h3>${w.person_name}</h3><p>Wishlist code: ${w.wishlist_code}</p></div></a>`).join("");
}

async function loadWishlistName(){
 const title=document.getElementById("wishlistTitle");if(!title)return;
 const id=new URLSearchParams(window.location.search).get("id");if(!id)return;
 const{data}=await supabase.from("wishlists").select("*").eq("id",id).single();
 if(data)title.textContent=`${data.person_name}'s Wishlist`;
}

async function loadGifts(){
 const list=document.getElementById("giftList");if(!list)return;
 const id=new URLSearchParams(window.location.search).get("id");
 let q=supabase.from("gifts").select("*").order("created_at",{ascending:false});
 if(id)q=q.eq("wishlist_id",id);
 const{data,error}=await q;
 if(error){list.innerHTML=`<div class="card small-text">${error.message}</div>`;return}
 if(!data||data.length===0){list.innerHTML=`<div class="card small-text">No gifts yet. Add gift ideas in Admin.</div>`;return}
 list.innerHTML=data.map(g=>`<article class="gift-card"><div class="gift-image">${g.image_url?`<img src="${g.image_url}" alt="">`:"🎁"}</div><div><h3>${g.name}</h3><p class="small-text">${formatMoney(g.cost)} · Qty ${g.quantity||1}</p>${g.gift_url?`<p class="small-text"><a href="${g.gift_url}" target="_blank" rel="noopener">Open gift link</a></p>`:""}<div class="meta"><span class="pill">${g.priority||"N/A"}</span><span class="pill ${(g.status||"Available").toLowerCase()}">${g.status||"Available"}</span></div></div></article>`).join("");
}

async function populateWishlistDropdown(){
 const dd=document.getElementById("giftWishlist");if(!dd)return;
 const{data,error}=await supabase.from("wishlists").select("*").order("person_name",{ascending:true});
 if(error){dd.innerHTML=`<option value="">Unable to load wishlists</option>`;return}
 if(!data||data.length===0){dd.innerHTML=`<option value="">Create a wishlist first</option>`;return}
 dd.innerHTML=`<option value="">Select a wishlist</option>`+data.map(w=>`<option value="${w.id}">${w.person_name} (${w.wishlist_code})</option>`).join("");
}

async function loadPurchases(){
 const list=document.getElementById("purchaseList");if(!list)return;
 const user=await requireLogin();if(!user)return;
 const{data,error}=await supabase.from("purchases").select("*, gifts(name, cost), wishlists(person_name)").eq("buyer_id",user.id).order("purchased_at",{ascending:false});
 if(error){list.innerHTML=`<div class="card small-text">${error.message}</div>`;return}
 if(!data||data.length===0){list.innerHTML=`<div class="card small-text">No purchases yet.</div>`;return}
 list.innerHTML=data.map(i=>`<article class="card"><h3>${i.gifts?.name||"Gift"}</h3><p class="small-text">For: ${i.wishlists?.person_name||"Unknown"} · Quantity: ${i.quantity||1} · ${formatMoney(i.price||i.gifts?.cost)}</p></article>`).join("");
}

function setupAdminForms(){
 const codeInput=document.getElementById("wishlistCode");const codeBtn=document.getElementById("generateCodeBtn");
 if(codeInput&&!codeInput.value)codeInput.value=generateCode();
 if(codeBtn)codeBtn.addEventListener("click",()=>codeInput.value=generateCode());

 const wishlistForm=document.getElementById("wishlistForm");
 if(wishlistForm)wishlistForm.addEventListener("submit",async e=>{
  e.preventDefault();const user=await requireLogin();if(!user)return;
  const personName=document.getElementById("wishlistPerson").value.trim();
  const code=document.getElementById("wishlistCode").value.trim().toUpperCase();
  const{data,error}=await supabase.from("wishlists").insert({person_name:personName,wishlist_code:code,created_by:user.id}).select().single();
  if(error){showMessage("adminMessage",error.message);return}
  await supabase.from("wishlist_members").insert({wishlist_id:data.id,user_id:user.id,can_view:true,can_edit:true});
  showMessage("adminMessage","Wishlist created.");wishlistForm.reset();document.getElementById("wishlistCode").value=generateCode();await populateWishlistDropdown();
 });

 const giftForm=document.getElementById("giftForm");
 if(giftForm)giftForm.addEventListener("submit",async e=>{
  e.preventDefault();const user=await requireLogin();if(!user)return;
  const wishlistId=document.getElementById("giftWishlist").value;
  if(!wishlistId){showMessage("adminMessage","Please select a wishlist.");return}
  const{error}=await supabase.from("gifts").insert({
   wishlist_id:wishlistId,
   name:document.getElementById("giftName").value.trim(),
   image_url:document.getElementById("giftImageUrl").value.trim()||null,
   gift_url:document.getElementById("giftUrl").value.trim()||null,
   cost:document.getElementById("giftCost").value||null,
   quantity:Number(document.getElementById("giftQuantity").value||1),
   priority:document.getElementById("giftPriority").value,
   status:"Available",
   notes:document.getElementById("giftNotes").value.trim(),
   created_by:user.id
  });
  showMessage("adminMessage",error?error.message:"Gift added.");if(!error)giftForm.reset();await populateWishlistDropdown();
 });
}

if(page==="wishlists")loadWishlists();
if(page==="wishlist"){loadWishlistName();loadGifts()}
if(page==="purchases")loadPurchases();
if(page==="admin"){setupAdminForms();populateWishlistDropdown()}
