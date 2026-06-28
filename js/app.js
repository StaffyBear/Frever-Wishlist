import { supabase } from "./supabase.js";
import { requireLogin, redirectIfLoggedIn, setupLoginForm, setupRegisterForm, signOut } from "./auth.js";
import { showMessage, formatMoney } from "./ui.js";

const page = document.body.dataset.page;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

if (page === "index") {
  redirectIfLoggedIn();
}

if (page === "login") {
  redirectIfLoggedIn();
  setupLoginForm();
}

if (page === "register") {
  redirectIfLoggedIn();
  setupRegisterForm();
}

if (["dashboard", "registries", "wishlist", "admin", "purchases", "profile"].includes(page)) {
  requireLogin().then(user => {
    if (!user) return;
    const userEmail = document.querySelector("[data-user-email]");
    if (userEmail) userEmail.textContent = user.email;
  });
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", signOut);
}

async function loadRegistries() {
  const list = document.getElementById("registryList");
  if (!list) return;

  const { data, error } = await supabase
    .from("registries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="card small-text">${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="card small-text">No registries yet. Create one in Admin.</div>`;
    return;
  }

  list.innerHTML = data.map(reg => `
    <a class="menu-tile" href="wishlist.html?registry=${reg.id}">
      <div class="menu-icon">🎁</div>
      <div>
        <h3>${reg.name}</h3>
        <p>Invite code: ${reg.invite_code}</p>
      </div>
    </a>
  `).join("");
}

async function loadGifts() {
  const list = document.getElementById("giftList");
  if (!list) return;

  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="card small-text">${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="card small-text">No gifts yet. Add gift ideas in Admin.</div>`;
    return;
  }

  list.innerHTML = data.map(gift => `
    <article class="gift-card">
      <div class="gift-image">${gift.image_url ? `<img src="${gift.image_url}" alt="">` : "🎁"}</div>
      <div>
        <h3>${gift.name}</h3>
        <p class="small-text">${formatMoney(gift.cost)} · Qty ${gift.quantity || 1}</p>
        <div class="meta">
          <span class="pill">${gift.priority || "N/A"}</span>
          <span class="pill ${(gift.status || "Available").toLowerCase()}">${gift.status || "Available"}</span>
        </div>
      </div>
    </article>
  `).join("");
}

async function loadPurchases() {
  const list = document.getElementById("purchaseList");
  if (!list) return;

  const user = await requireLogin();
  if (!user) return;

  const { data, error } = await supabase
    .from("purchases")
    .select("*, gifts(name, cost)")
    .eq("buyer_id", user.id)
    .order("purchased_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="card small-text">${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="card small-text">No purchases yet.</div>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <article class="card">
      <h3>${item.gifts?.name || "Gift"}</h3>
      <p class="small-text">Quantity: ${item.quantity || 1} · ${formatMoney(item.price || item.gifts?.cost)}</p>
    </article>
  `).join("");
}

function setupAdminForms() {
  const registryForm = document.getElementById("registryForm");
  if (registryForm) {
    registryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const user = await requireLogin();
      if (!user) return;

      const name = document.getElementById("registryName").value.trim();
      const inviteCode = document.getElementById("registryCode").value.trim().toUpperCase();

      const { data, error } = await supabase.from("registries").insert({
        name,
        owner_id: user.id,
        invite_code: inviteCode
      }).select().single();

      if (error) {
        showMessage("adminMessage", error.message);
        return;
      }

      await supabase.from("registry_members").insert({
        registry_id: data.id,
        user_id: user.id,
        role: "admin"
      });

      showMessage("adminMessage", "Registry created.");
      registryForm.reset();
    });
  }

  const wishlistForm = document.getElementById("wishlistForm");
  if (wishlistForm) {
    wishlistForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const user = await requireLogin();
      if (!user) return;

      const registryId = document.getElementById("wishlistRegistryId").value.trim();
      const title = document.getElementById("wishlistTitle").value.trim();
      const personName = document.getElementById("wishlistPerson").value.trim();
      const occasion = document.getElementById("wishlistOccasion").value.trim();
      const code = document.getElementById("wishlistCode").value.trim().toUpperCase();

      const { error } = await supabase.from("wishlists").insert({
        registry_id: registryId,
        title,
        person_name: personName,
        occasion,
        wishlist_code: code,
        created_by: user.id
      });

      showMessage("adminMessage", error ? error.message : "Wishlist created.");
      if (!error) wishlistForm.reset();
    });
  }

  const giftForm = document.getElementById("giftForm");
  if (giftForm) {
    giftForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const user = await requireLogin();
      if (!user) return;

      const { error } = await supabase.from("gifts").insert({
        wishlist_id: document.getElementById("giftWishlistId").value.trim(),
        name: document.getElementById("giftName").value.trim(),
        cost: document.getElementById("giftCost").value || null,
        quantity: Number(document.getElementById("giftQuantity").value || 1),
        priority: document.getElementById("giftPriority").value,
        status: "Available",
        notes: document.getElementById("giftNotes").value.trim(),
        created_by: user.id
      });

      showMessage("adminMessage", error ? error.message : "Gift added.");
      if (!error) giftForm.reset();
    });
  }
}

if (page === "registries") loadRegistries();
if (page === "wishlist") loadGifts();
if (page === "purchases") loadPurchases();
if (page === "admin") setupAdminForms();
