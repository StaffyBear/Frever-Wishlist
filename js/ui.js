export function showMessage(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
}

export function clearMessage(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = "";
  el.classList.remove("show");
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "Price TBC";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(Number(value));
}
