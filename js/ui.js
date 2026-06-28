export function showMessage(id,message){const el=document.getElementById(id);if(!el)return;el.textContent=message;el.classList.add("show")}
export function formatMoney(value){if(value===null||value===undefined||value==="")return"Price TBC";return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(Number(value))}
export function generateCode(length=5){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let code="";for(let i=0;i<length;i++)code+=chars[Math.floor(Math.random()*chars.length)];return code}
