import { supabase } from "./supabase.js";
import { requireLogin, redirectIfLoggedIn, setupLoginForm, setupRegisterForm, signOut } from "./auth.js";
import { showMessage, formatMoney, generateCode } from "./ui.js";

const page = document.body.dataset.page;
let currentWishlist = null;
let currentGifts = [];

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => {});
if (page === "index") redirectIfLoggedIn();
if (page === "login") { redirectIfLoggedIn(); setupLoginForm(); }
if (page === "register") { redirectIfLoggedIn(); setupRegisterForm(); }
if (["dashboard","wishlists","wishlist","admin","purchases","profile"].includes(page)) {
  requireLogin().then(user => { if (!user) return; const el=document.querySelector("[data-user-email]"); if(el) el.textContent=user.email; });
}
const logoutBtn=document.getElementById("logoutBtn"); if(logoutBtn) logoutBtn.addEventListener("click",signOut);

function wishlistCard(w){return `<a class="menu-tile" href="wishlist.html?id=${w.id}"><div class="menu-icon">🎁</div><div><h3>${w.person_name}</h3><p>Wishlist code: ${w.wishlist_code}</p></div></a>`;}

async function loadWishlists(){
  const myList=document.getElementById("myWishlistList"); const otherList=document.getElementById("otherWishlistList"); if(!myList&&!otherList)return;
  const user=await requireLogin(); if(!user)return;
  const {data,error}=await supabase.from("wishlists").select("*").order("created_at",{ascending:false});
  if(error){if(myList)myList.innerHTML=`<div class="card small-text">${error.message}</div>`; return;}
  const mine=(data||[]).filter(w=>w.created_by===user.id);
  const others=(data||[]).filter(w=>w.created_by!==user.id);
  if(myList)myList.innerHTML=mine.length?mine.map(wishlistCard).join(""):`<div class="empty-card">You have not created any wishlists yet.</div>`;
  if(otherList)otherList.innerHTML=others.length?others.map(wishlistCard).join(""):`<div class="empty-card">No other wishlists added yet.</div>`;
}

async function joinWishlistByCode(){
  const input=document.getElementById("joinWishlistCode"); if(!input)return;
  const user=await requireLogin(); if(!user)return;
  const code=input.value.trim().toUpperCase(); if(!code){showMessage("joinWishlistMessage","Enter a wishlist code.");return;}
  const {data:wishlist,error:findError}=await supabase.from("wishlists").select("*").eq("wishlist_code",code).single();
  if(findError||!wishlist){showMessage("joinWishlistMessage","No wishlist found with that code.");return;}
  const {error}=await supabase.from("wishlist_members").insert({wishlist_id:wishlist.id,user_id:user.id,can_view:true,can_edit:false});
  if(error && !error.message.includes("duplicate")){showMessage("joinWishlistMessage",error.message);return;}
  showMessage("joinWishlistMessage","Wishlist added."); input.value=""; await loadWishlists();
}
function setupJoinWishlist(){const btn=document.getElementById("joinWishlistBtn"); if(btn)btn.addEventListener("click",joinWishlistByCode);}

async function loadWishlistName(){
  const title=document.getElementById("wishlistTitle"); if(!title)return;
  const id=new URLSearchParams(window.location.search).get("id"); if(!id)return;
  const {data,error}=await supabase.from("wishlists").select("*").eq("id",id).single(); if(error)return;
  currentWishlist=data; title.textContent=`${data.person_name}'s Wishlist`;
  const a=document.getElementById("editWishlistId"), b=document.getElementById("editWishlistPerson"), c=document.getElementById("editWishlistCode");
  if(a)a.value=data.id; if(b)b.value=data.person_name||""; if(c)c.value=data.wishlist_code||"";
}

function applyGiftFiltersAndSort(gifts){
  const search=(document.getElementById("giftSearch")?.value||"").toLowerCase().trim(); const sort=document.getElementById("sortFilter")?.value||"newest";
  let filtered=[...gifts]; if(search)filtered=filtered.filter(g=>(g.name||"").toLowerCase().includes(search)||(g.notes||"").toLowerCase().includes(search));
  filtered.sort((a,b)=>{if(sort==="oldest")return new Date(a.created_at)-new Date(b.created_at); if(sort==="priceLow")return Number(a.cost||0)-Number(b.cost||0); if(sort==="priceHigh")return Number(b.cost||0)-Number(a.cost||0); if(sort==="nameAZ")return (a.name||"").localeCompare(b.name||""); return new Date(b.created_at)-new Date(a.created_at);}); return filtered;
}
function renderGifts(){
  const list=document.getElementById("giftList"); if(!list)return; const gifts=applyGiftFiltersAndSort(currentGifts);
  if(!gifts.length){list.innerHTML=`<div class="card small-text">No matching gifts.</div>`;return;}
  list.innerHTML=gifts.map(g=>`<article class="gift-card"><div class="gift-image">${g.image_url?`<img src="${g.image_url}" alt="">`:"🎁"}</div><div><h3>${g.name}</h3><p class="small-text">${formatMoney(g.cost)} · Qty ${g.quantity||1}</p><div class="gift-actions">${g.gift_url?`<a class="gift-link" href="${g.gift_url}" target="_blank" rel="noopener">Open gift link</a>`:""}<button class="edit-link" type="button" data-edit-gift="${g.id}">Edit</button><button class="delete-link" type="button" data-delete-gift="${g.id}">Delete</button></div><div class="meta"><span class="pill">${g.priority||"N/A"}</span><span class="pill ${(g.status||"Available").toLowerCase()}">${g.status||"Available"}</span></div></div></article>`).join("");
  document.querySelectorAll("[data-delete-gift]").forEach(btn=>btn.addEventListener("click",async()=>{if(!confirm("Delete this gift?"))return; const {error}=await supabase.from("gifts").delete().eq("id",btn.dataset.deleteGift); if(error){alert(error.message);return;} await loadGifts();}));
  document.querySelectorAll("[data-edit-gift]").forEach(btn=>btn.addEventListener("click",()=>openGiftEditor(btn.dataset.editGift)));
}
async function loadGifts(){
  const list=document.getElementById("giftList"); if(!list)return; const id=new URLSearchParams(window.location.search).get("id"); let q=supabase.from("gifts").select("*").order("created_at",{ascending:false}); if(id)q=q.eq("wishlist_id",id); const {data,error}=await q;
  if(error){list.innerHTML=`<div class="card small-text">${error.message}</div>`;return;} currentGifts=data||[]; if(!currentGifts.length){list.innerHTML=`<div class="card small-text">No gifts yet. Tap + to add one.</div>`;return;} renderGifts();
}
function setupGiftFilters(){["giftSearch","sortFilter"].forEach(id=>{const el=document.getElementById(id); if(el){el.addEventListener("input",renderGifts); el.addEventListener("change",renderGifts);}});}
function openGiftEditor(giftId){
  const gift=currentGifts.find(g=>g.id===giftId); if(!gift)return;
  document.getElementById("editGiftId").value=gift.id; document.getElementById("editGiftName").value=gift.name||""; document.getElementById("editGiftUrl").value=gift.gift_url||""; document.getElementById("editGiftImageUrl").value=gift.image_url||""; document.getElementById("editGiftCost").value=gift.cost??""; document.getElementById("editGiftQuantity").value=gift.quantity||1; document.getElementById("editGiftPriority").value=gift.priority||"N/A"; document.getElementById("editGiftStatus").value=gift.status||"Available"; document.getElementById("editGiftNotes").value=gift.notes||""; document.getElementById("giftModalBackdrop").classList.add("show");
}
function setupGiftEditor(){const closeBtn=document.getElementById("closeGiftModal"); const form=document.getElementById("editGiftForm"); if(closeBtn)closeBtn.addEventListener("click",()=>document.getElementById("giftModalBackdrop").classList.remove("show")); if(!form)return; form.addEventListener("submit",async e=>{e.preventDefault(); const giftId=document.getElementById("editGiftId").value; const updates={name:document.getElementById("editGiftName").value.trim(),gift_url:document.getElementById("editGiftUrl").value.trim()||null,image_url:document.getElementById("editGiftImageUrl").value.trim()||null,cost:document.getElementById("editGiftCost").value||null,quantity:Number(document.getElementById("editGiftQuantity").value||1),priority:document.getElementById("editGiftPriority").value,status:document.getElementById("editGiftStatus").value,notes:document.getElementById("editGiftNotes").value.trim()}; const {error}=await supabase.from("gifts").update(updates).eq("id",giftId); if(error){alert(error.message);return;} document.getElementById("giftModalBackdrop").classList.remove("show"); await loadGifts();});}
function setupAddGiftModal(){const openBtn=document.getElementById("openAddGiftModal"), closeBtn=document.getElementById("closeAddGiftModal"), form=document.getElementById("addGiftForm"); if(openBtn)openBtn.addEventListener("click",()=>document.getElementById("addGiftModalBackdrop").classList.add("show")); if(closeBtn)closeBtn.addEventListener("click",()=>document.getElementById("addGiftModalBackdrop").classList.remove("show")); if(!form)return; form.addEventListener("submit",async e=>{e.preventDefault(); const user=await requireLogin(); if(!user)return; const wishlistId=new URLSearchParams(window.location.search).get("id"); const {error}=await supabase.from("gifts").insert({wishlist_id:wishlistId,name:document.getElementById("addGiftName").value.trim(),image_url:document.getElementById("addGiftImageUrl").value.trim()||null,gift_url:document.getElementById("addGiftUrl").value.trim()||null,cost:document.getElementById("addGiftCost").value||null,quantity:Number(document.getElementById("addGiftQuantity").value||1),priority:document.getElementById("addGiftPriority").value,status:"Available",notes:document.getElementById("addGiftNotes").value.trim(),created_by:user.id}); if(error){alert(error.message);return;} form.reset(); document.getElementById("addGiftQuantity").value=1; document.getElementById("addGiftPriority").value="N/A"; document.getElementById("addGiftModalBackdrop").classList.remove("show"); await loadGifts();});}
function setupWishlistEditor(){const openBtn=document.getElementById("openWishlistSettings"), closeBtn=document.getElementById("closeWishlistModal"), copyBtn=document.getElementById("copyWishlistCode"), form=document.getElementById("editWishlistForm"); if(openBtn)openBtn.addEventListener("click",()=>{if(currentWishlist){document.getElementById("editWishlistId").value=currentWishlist.id; document.getElementById("editWishlistPerson").value=currentWishlist.person_name||""; document.getElementById("editWishlistCode").value=currentWishlist.wishlist_code||"";} document.getElementById("wishlistModalBackdrop").classList.add("show");}); if(closeBtn)closeBtn.addEventListener("click",()=>document.getElementById("wishlistModalBackdrop").classList.remove("show")); if(copyBtn)copyBtn.addEventListener("click",async()=>{const code=document.getElementById("editWishlistCode").value; await navigator.clipboard.writeText(code); copyBtn.textContent="Copied"; setTimeout(()=>copyBtn.textContent="Copy code",900);}); if(!form)return; form.addEventListener("submit",async e=>{e.preventDefault(); const id=document.getElementById("editWishlistId").value; const personName=document.getElementById("editWishlistPerson").value.trim(); const code=document.getElementById("editWishlistCode").value.trim().toUpperCase(); const {error}=await supabase.from("wishlists").update({person_name:personName,wishlist_code:code}).eq("id",id); if(error){alert(error.message);return;} document.getElementById("wishlistModalBackdrop").classList.remove("show"); await loadWishlistName();});}
async function populateWishlistDropdown(){const dd=document.getElementById("giftWishlist"); if(!dd)return; const {data,error}=await supabase.from("wishlists").select("*").order("person_name",{ascending:true}); if(error){dd.innerHTML=`<option value="">Unable to load wishlists</option>`;return;} if(!data||!data.length){dd.innerHTML=`<option value="">Create a wishlist first</option>`;return;} dd.innerHTML=`<option value="">Select a wishlist</option>`+data.map(w=>`<option value="${w.id}">${w.person_name} (${w.wishlist_code})</option>`).join("");}
async function loadPurchases(){const list=document.getElementById("purchaseList"); if(!list)return; const user=await requireLogin(); if(!user)return; const {data,error}=await supabase.from("purchases").select("*, gifts(name, cost), wishlists(person_name)").eq("buyer_id",user.id).order("purchased_at",{ascending:false}); if(error){list.innerHTML=`<div class="card small-text">${error.message}</div>`;return;} if(!data||!data.length){list.innerHTML=`<div class="card small-text">No purchases yet.</div>`;return;} list.innerHTML=data.map(i=>`<article class="card"><h3>${i.gifts?.name||"Gift"}</h3><p class="small-text">For: ${i.wishlists?.person_name||"Unknown"} · Quantity: ${i.quantity||1} · ${formatMoney(i.price||i.gifts?.cost)}</p></article>`).join("");}
function setupAdminForms(){const codeInput=document.getElementById("wishlistCode"), codeBtn=document.getElementById("generateCodeBtn"); if(codeInput&&!codeInput.value)codeInput.value=generateCode(); if(codeBtn)codeBtn.addEventListener("click",()=>codeInput.value=generateCode()); const wishlistForm=document.getElementById("wishlistForm"); if(wishlistForm)wishlistForm.addEventListener("submit",async e=>{e.preventDefault(); const user=await requireLogin(); if(!user)return; const personName=document.getElementById("wishlistPerson").value.trim(); const code=document.getElementById("wishlistCode").value.trim().toUpperCase(); const {data,error}=await supabase.from("wishlists").insert({person_name:personName,wishlist_code:code,created_by:user.id}).select().single(); if(error){showMessage("adminMessage",error.message);return;} await supabase.from("wishlist_members").insert({wishlist_id:data.id,user_id:user.id,can_view:true,can_edit:true}); showMessage("adminMessage","Wishlist created."); wishlistForm.reset(); document.getElementById("wishlistCode").value=generateCode(); await populateWishlistDropdown();});}
if(page==="wishlists"){loadWishlists(); setupJoinWishlist();}
if(page==="wishlist"){loadWishlistName(); loadGifts(); setupGiftFilters(); setupGiftEditor(); setupAddGiftModal(); setupWishlistEditor();}
if(page==="purchases")loadPurchases();
if(page==="admin"){setupAdminForms(); populateWishlistDropdown();}
