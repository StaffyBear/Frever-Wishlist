import { supabase } from "./supabase.js";
import { requireUser } from "./auth-core.js";
import { code, showMessage, openModal, closeModal } from "./utils.js";

const user = await requireUser();
const ICONS = ["gift-purple", "gift-red", "gift-blue", "gift-green", "gift-gold", "gift-pink", "gift-teal", "gift-orange", "gift-lime", "gift-sky", "gift-violet", "gift-rose", "🐼", "👦", "👧", "👶", "🧒", "👩", "👨", "🎄", "🎂", "🎈", "🎉", "⭐", "🌈", "❤️", "💜", "🌸", "🌼", "⚽", "🎮", "📚", "🚗", "🚂", "✈️", "🚀", "🦕", "🧸", "🐶", "🐱", "🐾", "🎵", "🎨", "📷", "🛍️", "🏆", "🏖️", "🎯", "🧩", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];


function displayIcon(icon) {
  if (!icon) return `<span class="gift-colour-icon gift-purple">🎁</span>`;
  if (icon.startsWith("gift-")) return `<span class="gift-colour-icon ${icon}">🎁</span>`;
  if (icon.length === 1 && /[A-Z]/.test(icon)) return `<span class="initial-icon">${icon}</span>`;
  return icon;
}


function renderIconPicker(containerId, hiddenInputId, selected = "gift-purple") {
  const box = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenInputId);
  if (!box || !hidden) return;

  hidden.value = selected;
  box.innerHTML = ICONS.map(icon => `
    <button class="icon-choice ${icon === selected ? "selected" : ""}" type="button" data-icon="${icon}">
      ${displayIcon(icon)}
    </button>
  `).join("");

  box.querySelectorAll("[data-icon]").forEach(btn => {
    btn.addEventListener("click", () => {
      hidden.value = btn.dataset.icon;
      box.querySelectorAll(".icon-choice").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
}

function card(w) {
  return `<a class="tile" href="wishlist.html?id=${w.id}">
    <div class="tile-icon">${displayIcon(w.icon || "gift-purple")}</div>
    <div><h3>${w.person_name}</h3><p>Wishlist code: ${w.wishlist_code}</p></div>
  </a>`;
}

async function loadWishlists() {
  const { data, error } = await supabase
    .from("wishlists")
    .select("*")
    .order("created_at", { ascending:false });

  if (error) return showMessage("joinMessage", error.message);

  const mine = (data || []).filter(w => w.created_by === user.id);
  const others = (data || []).filter(w => w.created_by !== user.id);

  document.getElementById("myWishlists").innerHTML = mine.length
    ? mine.map(card).join("")
    : `<div class="empty">You have not created any wishlists yet.</div>`;

  document.getElementById("otherWishlists").innerHTML = others.length
    ? others.map(card).join("")
    : `<div class="empty">No other wishlists added yet.</div>`;
}

document.getElementById("openCreateWishlist").addEventListener("click", () => {
  renderIconPicker("createIconPicker", "wishlistIcon", "gift-purple");
  openModal("createWishlistModal");
});

document.getElementById("closeCreateWishlist").addEventListener("click", () => closeModal("createWishlistModal"));
document.getElementById("openJoinWishlist").addEventListener("click", () => openModal("joinWishlistModal"));
document.getElementById("closeJoinWishlist").addEventListener("click", () => closeModal("joinWishlistModal"));

document.getElementById("createWishlistForm").addEventListener("submit", async event => {
  event.preventDefault();

  const personName = document.getElementById("personName").value.trim();
  const icon = document.getElementById("wishlistIcon").value || "gift-purple";

  const insertPayload = {
    person_name: personName,
    wishlist_code: code(),
    icon,
    created_by: user.id
  };

  let { data, error } = await supabase
    .from("wishlists")
    .insert(insertPayload)
    .select()
    .single();

  if (error && error.message && error.message.includes("icon")) {
    delete insertPayload.icon;
    const retry = await supabase.from("wishlists").insert(insertPayload).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return showMessage("createMessage", error.message);

  await supabase.from("wishlist_members").insert({
    wishlist_id: data.id,
    user_id: user.id,
    can_view: true,
    can_edit: true
  });

  event.target.reset();
  closeModal("createWishlistModal");
  await loadWishlists();
});

document.getElementById("joinBtn").addEventListener("click", async () => {
  const joinCode = document.getElementById("joinCode").value.trim().toUpperCase();
  if (!joinCode) return showMessage("joinMessage", "Enter a wishlist code.");

  const { error } = await supabase.rpc("join_wishlist_by_code", {
    code_input: joinCode
  });

  if (error) return showMessage("joinMessage", error.message || "No wishlist found with that code.");

  document.getElementById("joinCode").value = "";
  closeModal("joinWishlistModal");
  await loadWishlists();
});

renderIconPicker("createIconPicker", "wishlistIcon", "gift-purple");
await loadWishlists();
