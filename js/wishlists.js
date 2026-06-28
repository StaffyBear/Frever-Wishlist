import { supabase } from "./supabase.js";
import { requireUser } from "./auth-core.js";
import { showMessage } from "./utils.js";

const user = await requireUser();

function card(w){
  return `<a class="tile" href="wishlist.html?id=${w.id}"><div class="tile-icon">🎁</div><div><h3>${w.person_name}</h3><p>Code: ${w.wishlist_code}</p></div></a>`;
}

async function loadWishlists(){
  const { data, error } = await supabase.from("wishlists").select("*").order("created_at", { ascending:false });
  if (error) return showMessage("joinMessage", error.message);

  const mine = (data || []).filter(w => w.created_by === user.id);
  const others = (data || []).filter(w => w.created_by !== user.id);

  document.getElementById("myWishlists").innerHTML = mine.length ? mine.map(card).join("") : `<div class="empty">You have not created any wishlists yet.</div>`;
  document.getElementById("otherWishlists").innerHTML = others.length ? others.map(card).join("") : `<div class="empty">No other wishlists added yet.</div>`;
}

document.getElementById("joinBtn").addEventListener("click", async () => {
  const code = document.getElementById("joinCode").value.trim().toUpperCase();
  if (!code) return showMessage("joinMessage", "Enter a wishlist code.");

  const { error } = await supabase.rpc("join_wishlist_by_code", {
    code_input: code
  });

  if (error) {
    return showMessage("joinMessage", error.message || "No wishlist found with that code.");
  }

  showMessage("joinMessage", "Wishlist added.");
  document.getElementById("joinCode").value = "";
  await loadWishlists();
});

await loadWishlists();
