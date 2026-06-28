import { supabase } from "./supabase.js";
import { requireUser, logout } from "./auth-core.js";
import { code, showMessage } from "./utils.js";

const user = await requireUser();
document.getElementById("emailText").textContent = user.email;
document.getElementById("logoutBtn").addEventListener("click", logout);

async function loadHome(){
  const { data: lists } = await supabase.from("wishlists").select("*").order("created_at", { ascending:false });
  const mine = (lists || []).filter(w => w.created_by === user.id).slice(0,3);
  const shared = (lists || []).filter(w => w.created_by !== user.id).slice(0,3);

  document.getElementById("myPreview").innerHTML = mine.length ? mine.map(tile).join("") : `<div class="empty">No wishlists yet.</div>`;
  document.getElementById("sharedPreview").innerHTML = shared.length ? shared.map(tile).join("") : `<div class="empty">No shared wishlists yet.</div>`;
}

function tile(w){
  return `<a class="tile" href="wishlist.html?id=${w.id}"><div class="tile-icon">🎁</div><div><h3>${w.person_name}</h3><p>Code: ${w.wishlist_code}</p></div></a>`;
}

document.getElementById("quickCreateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const person = document.getElementById("quickPerson").value.trim();
  if (!person) return;
  const { data, error } = await supabase.from("wishlists").insert({
    person_name: person,
    wishlist_code: code(),
    created_by: user.id
  }).select().single();
  if (error) return showMessage("homeMessage", error.message);
  await supabase.from("wishlist_members").insert({ wishlist_id:data.id, user_id:user.id, can_view:true, can_edit:true });
  document.getElementById("quickCreateForm").reset();
  await loadHome();
});

await loadHome();
