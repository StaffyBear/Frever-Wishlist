import { supabase } from "./supabase.js";
import { requireUser } from "./auth-core.js";
import { money } from "./utils.js";

const user = await requireUser();
const list = document.getElementById("purchaseList");

const { data, error } = await supabase
  .from("purchases")
  .select("*, gifts(name, cost, image_url, quantity), wishlists(person_name)")
  .eq("buyer_id", user.id)
  .order("purchased_at", { ascending:false });

if (error) {
  list.innerHTML = `<div class="empty">${error.message}</div>`;
} else if (!data || !data.length) {
  list.innerHTML = `<div class="empty">No purchases yet. Mark a gift as Purchased and it will appear here.</div>`;
} else {
  list.innerHTML = data.map(p => `
    <article class="gift-card">
      <div class="gift-img">${p.gifts?.image_url ? `<img src="${p.gifts.image_url}" alt="">` : "🛍️"}</div>
      <div>
        <h3>${p.gifts?.name || "Gift"}</h3>
        <p class="small">${money(p.price || p.gifts?.cost)} · Qty ${p.quantity || p.gifts?.quantity || 1}</p>
        <p class="small">For: ${p.wishlists?.person_name || "Unknown"}</p>
        <div class="pills"><span class="pill Purchased">Purchased</span></div>
      </div>
    </article>
  `).join("");
}
