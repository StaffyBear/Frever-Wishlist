import { requireUser, logout } from "./auth-core.js";

const user = await requireUser();
document.getElementById("emailText").textContent = user.email;
document.getElementById("logoutBtn").addEventListener("click", logout);
