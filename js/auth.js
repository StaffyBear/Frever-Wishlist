import { supabase } from "./supabase.js";
import { showMessage } from "./ui.js";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireLogin() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

export async function redirectIfLoggedIn() {
  const user = await getCurrentUser();
  if (user) window.location.href = "dashboard.html";
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

export function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showMessage("authMessage", error.message);
      return;
    }

    window.location.href = "dashboard.html";
  });
}

export function setupRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayName = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerConfirm").value;

    if (password !== confirm) {
      showMessage("authMessage", "Passwords do not match.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      showMessage("authMessage", error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        display_name: displayName || email,
        role: "member"
      });
    }

    showMessage("authMessage", "Account created. You can now sign in.");
    setTimeout(() => window.location.href = "login.html", 900);
  });
}
