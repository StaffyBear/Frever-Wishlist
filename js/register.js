import { supabase } from "./supabase.js";
import { redirectLoggedIn, ensureProfile } from "./auth-core.js";
import { showMessage } from "./utils.js";

await redirectLoggedIn();

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const displayName = document.getElementById("displayName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  if (password !== confirm) return showMessage("message", "Passwords do not match.");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return showMessage("message", error.message);

  if (data.user) await ensureProfile(data.user, displayName || email);
  showMessage("message", "Account created. You can sign in now.");
  setTimeout(() => window.location.href = "login.html", 900);
});
