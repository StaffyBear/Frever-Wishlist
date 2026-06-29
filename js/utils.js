export function showMessage(id,msg){const el=document.getElementById(id);if(!el)return;el.textContent=msg;el.classList.add("show")}
export function money(value){if(value===null||value===undefined||value==="")return"Price TBC";return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(Number(value))}
export function code(length=5){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let out="";for(let i=0;i<length;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out}
export function openModal(id){document.getElementById(id)?.classList.add("show")}
export function closeModal(id){document.getElementById(id)?.classList.remove("show")}
