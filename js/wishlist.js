import { supabase } from "./supabase.js";
import { requireUser } from "./auth-core.js";
import { money, openModal, closeModal } from "./utils.js";

const user = await requireUser();
const wishlistId = new URLSearchParams(window.location.search).get("id");
const ICONS = ["🎁", "🐼", "👦", "👧", "🎄", "🎂", "⭐", "🌈", "⚽", "🎮", "📚", "🚗", "🧸", "🦕", "🚀", "❤️", "🌸", "🎵", "🏆", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

let wishlist = null;
let gifts = [];
let isOwner = false;

if (!wishlistId) window.location.href = "wishlists.html";

function displayIcon(icon) {
  if (!icon) return "🎁";
  if (icon.length === 1 && /[A-Z]/.test(icon)) return `<span class="initial-icon">${icon}</span>`;
  return icon;
}

function renderIconPicker(containerId, hiddenInputId, selected = "🎁") {
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

async function loadWishlist() {
  const { data, error } = await supabase.from("wishlists").select("*").eq("id", wishlistId).single();

  if (error) {
    document.getElementById("giftList").innerHTML = `<div class="empty">${error.message}</div>`;
    return;
  }

  wishlist = data;
  isOwner = wishlist.created_by === user.id;

  document.getElementById("title").textContent = `${wishlist.person_name}'s Wishlist`;
  document.getElementById("subtitle").textContent = isOwner
    ? "This is your wishlist. You can add, edit and delete gifts."
    : "This wishlist was shared with you. You can update gift status.";

  document.getElementById("editPerson").value = wishlist.person_name;
  document.getElementById("editCode").value = wishlist.wishlist_code;
  renderIconPicker("editIconPicker", "editIcon", wishlist.icon || "🎁");

  document.getElementById("addGiftBtn").style.display = isOwner ? "block" : "none";
  document.getElementById("ownerSettings").style.display = isOwner ? "block" : "none";
  document.getElementById("viewerListWrap").style.display = isOwner ? "block" : "none";
  document.getElementById("saveWishlistBtn").style.display = isOwner ? "block" : "none";
  document.getElementById("copyCode").style.display = isOwner ? "block" : "none";
  document.getElementById("deleteWishlistBtn").style.display = isOwner ? "block" : "none";
  document.getElementById("removeSharedWishlistBtn").style.display = isOwner ? "none" : "block";
  document.getElementById("viewerSettings").innerHTML = isOwner ? "" : `<p class="small">You can remove this shared wishlist from your account. This will not delete the owner's wishlist.</p>`;

  if (isOwner) await loadViewers();
}

async function loadViewers() {
  const list = document.getElementById("viewerList");
  list.innerHTML = `<div class="empty">Loading viewers...</div>`;

  const { data, error } = await supabase.rpc("get_wishlist_viewers", { wishlist_input: wishlistId });

  if (error) {
    list.innerHTML = `<div class="empty">${error.message}</div>`;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `<div class="empty">No viewers yet.</div>`;
    return;
  }

  list.innerHTML = data.map(v => `
    <div class="viewer-row">
      <div>
        <p><strong>${v.display_name || v.email || "Unknown user"}</strong></p>
        <p class="small">${v.email || ""}</p>
      </div>
      ${v.user_id === user.id ? `<span class="pill">Owner</span>` : `<button class="text-btn danger" data-remove-viewer="${v.member_id}" type="button">Remove</button>`}
    </div>
  `).join("");

  document.querySelectorAll("[data-remove-viewer]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this person's access?")) return;
      const { error } = await supabase.rpc("remove_wishlist_viewer", { member_input: btn.dataset.removeViewer });
      if (error) return alert(error.message);
      await loadViewers();
    });
  });
}

async function loadGifts() {
  const { data, error } = await supabase.from("gifts").select("*").eq("wishlist_id", wishlistId).order("created_at", { ascending:false });

  if (error) {
    document.getElementById("giftList").innerHTML = `<div class="empty">${error.message}</div>`;
    return;
  }

  gifts = data || [];
  renderGifts();
}

function sortedGifts() {
  const search = document.getElementById("search").value.trim().toLowerCase();
  const sort = document.getElementById("sort").value;

  let filtered = gifts.filter(g => !search || (g.name || "").toLowerCase().includes(search) || (g.notes || "").toLowerCase().includes(search));

  filtered.sort((a,b) => {
    if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (sort === "priceLow") return Number(a.cost || 0) - Number(b.cost || 0);
    if (sort === "priceHigh") return Number(b.cost || 0) - Number(a.cost || 0);
    if (sort === "nameAZ") return (a.name || "").localeCompare(b.name || "");
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return filtered;
}

function renderGifts() {
  const list = document.getElementById("giftList");
  const display = sortedGifts();

  if (!display.length) {
    list.innerHTML = `<div class="empty">${isOwner ? "No gifts found. Tap + to add one." : "No gifts found."}</div>`;
    return;
  }

  list.innerHTML = display.map(g => `
    <article class="gift-card">
      <div class="gift-img">${g.image_url ? `<img src="${g.image_url}" alt="">` : "🎁"}</div>
      <div>
        <h3>${g.name}</h3>
        <div class="small">${money(g.cost)} · Qty ${g.quantity || 1}</div>
        <div class="actions">
          ${g.gift_url ? `<a class="link" href="${g.gift_url}" target="_blank" rel="noopener">Open link</a>` : ""}
          ${isOwner ? `<button class="text-btn" data-edit="${g.id}">Edit</button><button class="text-btn danger" data-delete="${g.id}">Delete</button>` : ""}
        </div>
        <div class="pills">
          <span class="pill">${g.priority || "N/A"}</span>
          <span class="pill ${g.status || "Available"}">${g.status || "Available"}</span>
        </div>
        <div class="status-link-row">
          <button class="text-btn ${(g.status || "Available") === "Available" ? "active" : ""}" data-status-id="${g.id}" data-status="Available">Available</button>
          <button class="text-btn ${(g.status || "Available") === "Reserved" ? "active" : ""}" data-status-id="${g.id}" data-status="Reserved">Reserved</button>
          <button class="text-btn ${(g.status || "Available") === "Purchased" ? "active" : ""}" data-status-id="${g.id}" data-status="Purchased">Purchased</button>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => openEdit(btn.dataset.edit)));
  document.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => deleteGift(btn.dataset.delete)));
  document.querySelectorAll("[data-status-id]").forEach(btn => btn.addEventListener("click", () => updateGiftStatus(btn.dataset.statusId, btn.dataset.status)));
}

async function syncPurchaseRecord(gift, status) {
  await supabase.from("purchases").delete().eq("gift_id", gift.id).eq("buyer_id", user.id);

  if (status === "Purchased") {
    const { error } = await supabase.from("purchases").insert({
      gift_id: gift.id,
      wishlist_id: gift.wishlist_id,
      buyer_id: user.id,
      quantity: gift.quantity || 1,
      price: gift.cost || null
    });
    if (error) console.warn(error.message);
  }
}

async function updateGiftStatus(id, status) {
  const gift = gifts.find(g => g.id === id);
  const { error } = await supabase.from("gifts").update({ status }).eq("id", id);
  if (error) return alert(error.message);
  if (gift) await syncPurchaseRecord(gift, status);
  await loadGifts();
}

function openEdit(id) {
  const g = gifts.find(x => x.id === id);
  if (!g) return;

  document.getElementById("editGiftId").value = g.id;
  document.getElementById("editGiftName").value = g.name || "";
  document.getElementById("editGiftUrl").value = g.gift_url || "";
  document.getElementById("editGiftImage").value = g.image_url || "";
  document.getElementById("editGiftCost").value = g.cost ?? "";
  document.getElementById("editGiftQty").value = g.quantity || 1;
  document.getElementById("editGiftPriority").value = g.priority || "N/A";
  document.getElementById("editGiftStatus").value = g.status || "Available";
  document.getElementById("editGiftNotes").value = g.notes || "";
  openModal("editGiftModal");
}

async function deleteGift(id) {
  if (!confirm("Delete this gift?")) return;
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadGifts();
}

async function tryAutoFill() {
  const url = document.getElementById("addGiftUrl").value.trim();
  const message = document.getElementById("autofillMessage");
  if (!url) {
    message.textContent = "Paste a product URL first.";
    return;
  }

  message.textContent = "Trying to fetch details...";

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Could not fetch page.");
    const html = await res.text();

    const getMeta = prop => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m) return m[1].replace(/&amp;/g, "&");
      }
      return "";
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta("og:title") || (titleMatch ? titleMatch[1].trim() : "");
    const image = getMeta("og:image") || getMeta("twitter:image");
    const priceMatch = html.match(/(?:£|GBP\s?)(\d+[\.,]?\d{0,2})/i) || html.match(/"price"\s*:\s*"?([0-9]+\.?[0-9]*)"?/i);
    const price = priceMatch ? priceMatch[1].replace(",", ".") : "";

    if (title && !document.getElementById("addGiftName").value) document.getElementById("addGiftName").value = title;
    if (image && !document.getElementById("addGiftImage").value) document.getElementById("addGiftImage").value = image;
    if (price && !document.getElementById("addGiftCost").value) document.getElementById("addGiftCost").value = price;

    message.textContent = title || image || price
      ? "Auto-fill added what it could. Please check before saving."
      : "Could not find useful details. Please enter manually.";
  } catch (err) {
    message.textContent = "Could not auto-fill this link. Please enter manually.";
  }
}

document.getElementById("search").addEventListener("input", renderGifts);
document.getElementById("sort").addEventListener("change", renderGifts);
document.getElementById("addGiftBtn").addEventListener("click", () => openModal("addGiftModal"));
document.getElementById("closeAddGift").addEventListener("click", () => closeModal("addGiftModal"));
document.getElementById("closeEditGift").addEventListener("click", () => closeModal("editGiftModal"));
if (document.getElementById("autofillBtn")) document.getElementById("autofillBtn").addEventListener("click", tryAutoFill);

document.getElementById("settingsBtn").addEventListener("click", async () => {
  if (isOwner) await loadViewers();
  openModal("wishlistModal");
});
document.getElementById("closeWishlist").addEventListener("click", () => closeModal("wishlistModal"));

document.getElementById("copyCode").addEventListener("click", async () => {
  await navigator.clipboard.writeText(document.getElementById("editCode").value);
  document.getElementById("copyCode").textContent = "Copied";
  setTimeout(() => document.getElementById("copyCode").textContent = "Copy code", 900);
});

document.getElementById("addGiftForm").addEventListener("submit", async event => {
  event.preventDefault();

  const { error } = await supabase.from("gifts").insert({
    wishlist_id: wishlistId,
    name: document.getElementById("addGiftName").value.trim(),
    gift_url: document.getElementById("addGiftUrl").value.trim() || null,
    image_url: document.getElementById("addGiftImage").value.trim() || null,
    cost: document.getElementById("addGiftCost").value || null,
    quantity: Number(document.getElementById("addGiftQty").value || 1),
    priority: document.getElementById("addGiftPriority").value,
    status: document.getElementById("addGiftStatus").value,
    notes: document.getElementById("addGiftNotes").value.trim(),
    created_by: user.id
  });

  if (error) return alert(error.message);

  event.target.reset();
  document.getElementById("addGiftQty").value = 1;
  document.getElementById("addGiftPriority").value = "N/A";
  document.getElementById("addGiftStatus").value = "Available";
  if (document.getElementById("autofillMessage")) document.getElementById("autofillMessage").textContent = "This will try to fill the name, image and price. Some shops may block it.";
  closeModal("addGiftModal");
  await loadGifts();
});

document.getElementById("editGiftForm").addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("editGiftId").value;
  const originalGift = gifts.find(g => g.id === id);
  const newStatus = document.getElementById("editGiftStatus").value;

  const updates = {
    name: document.getElementById("editGiftName").value.trim(),
    gift_url: document.getElementById("editGiftUrl").value.trim() || null,
    image_url: document.getElementById("editGiftImage").value.trim() || null,
    cost: document.getElementById("editGiftCost").value || null,
    quantity: Number(document.getElementById("editGiftQty").value || 1),
    priority: document.getElementById("editGiftPriority").value,
    status: newStatus,
    notes: document.getElementById("editGiftNotes").value.trim()
  };

  const { error } = await supabase.from("gifts").update(updates).eq("id", id);
  if (error) return alert(error.message);

  if (originalGift) await syncPurchaseRecord({ ...originalGift, ...updates }, newStatus);

  closeModal("editGiftModal");
  await loadGifts();
});

document.getElementById("wishlistForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!isOwner) return;

  const { error } = await supabase.from("wishlists").update({
    person_name: document.getElementById("editPerson").value.trim(),
    wishlist_code: document.getElementById("editCode").value.trim().toUpperCase(),
    icon: document.getElementById("editIcon").value || "🎁"
  }).eq("id", wishlistId);

  if (error) return alert(error.message);

  closeModal("wishlistModal");
  await loadWishlist();
});

document.getElementById("deleteWishlistBtn").addEventListener("click", async () => {
  if (!isOwner) return;
  if (!confirm("Delete this wishlist and all gifts?")) return;

  const { error } = await supabase.from("wishlists").delete().eq("id", wishlistId);
  if (error) return alert(error.message);

  window.location.href = "wishlists.html";
});

document.getElementById("removeSharedWishlistBtn").addEventListener("click", async () => {
  if (isOwner) return;
  if (!confirm("Remove this wishlist from your account?")) return;

  const { error } = await supabase.rpc("leave_wishlist", { wishlist_input: wishlistId });
  if (error) return alert(error.message);

  window.location.href = "wishlists.html";
});

await loadWishlist();
await loadGifts();
