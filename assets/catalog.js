/* Dua Computers — catalog loader
   Pulls live product data from the published Google Sheet (CSV export)
   and renders it into any element with [data-catalog].
   To point this at your own sheet: replace SHEET_ID below with the ID
   from your sheet's URL (the long string between /d/ and /edit). */

const SHEET_ID = "1ijP6lGXyXZTUhugyeHEO91PFlSMvXX9RE6TOEpf1N9c";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
const WHATSAPP_NUMBER = "96877036787";

function parseCSV(text) {
  // Simple CSV parser that handles quoted fields with commas.
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function rowsToProducts(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  const idx = (name) => header.findIndex(h => h.includes(name));
  const iName = idx("product"), iCat = idx("category"), iCond = idx("condition"),
        iSpec = idx("spec"), iPrice = idx("price"), iStock = idx("stock"), iPhoto = idx("photo");

  return rows.slice(1)
    .filter(r => r[iName] && r[iName].trim())
    .map(r => ({
      name: (r[iName] || "").trim(),
      category: (r[iCat] || "").trim(),
      condition: (r[iCond] || "").trim(),
      spec: (r[iSpec] || "").trim(),
      price: (r[iPrice] || "").trim(),
      inStock: (r[iStock] || "").trim().toLowerCase() !== "no",
      photo: (r[iPhoto] || "").trim(),
    }))
    .filter(p => p.inStock);
}

function driveDirectLink(url) {
  if (!url) return "";
  const match = url.match(/\/d\/(.*?)\//) || url.match(/id=([^&]+)/);
  if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  return url;
}

function productCard(p) {
  const condClass = p.condition.toLowerCase().includes("new") ? "cond-new" : "cond-used";
  const waText = encodeURIComponent(`Hi, I'm asking about the ${p.name}${p.price ? ` (OMR ${p.price})` : ""} listed on your website.`);
  const img = driveDirectLink(p.photo);
  return `
    <div class="card" data-category="${p.category}">
      <div class="card-img">${img ? `<img src="${img}" alt="${p.name}" loading="lazy">` : "Photo coming soon"}</div>
      <div class="card-body">
        <span class="card-cond ${condClass}">${p.condition.toUpperCase() || "IN STOCK"}</span>
        <div class="card-name">${p.name}</div>
        <div class="card-spec">${p.spec}</div>
        <div class="card-foot">
          <div class="card-price">${p.price ? `OMR ${p.price}` : "Ask price"} <span>+VAT</span></div>
          <div class="card-actions">
            <a class="card-call" href="tel:+${WHATSAPP_NUMBER}" title="Call">📞</a>
            <a class="card-wa" href="https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${waText}" target="_blank" rel="noopener" title="WhatsApp">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.93 7.93 0 0 0 3.85 1h0a7.94 7.94 0 0 0 7.94-7.94 7.9 7.9 0 0 0-2.39-5.64zM12.05 18.4h0a6.5 6.5 0 0 1-3.32-.91l-.24-.14-2.47.65.66-2.41-.16-.25a6.55 6.55 0 0 1 10.2-8.1 6.5 6.5 0 0 1 1.94 4.63 6.56 6.56 0 0 1-6.6 6.53zm3.6-4.9c-.2-.1-1.17-.58-1.35-.64s-.32-.1-.45.1-.5.64-.62.77-.23.15-.43.05a5.4 5.4 0 0 1-1.6-.98 6 6 0 0 1-1.1-1.37c-.12-.2 0-.3.09-.4.09-.1.2-.23.3-.35.1-.11.13-.2.2-.32a.36.36 0 0 0 0-.35c-.05-.1-.45-1.08-.62-1.48-.16-.39-.33-.33-.45-.34h-.38a.74.74 0 0 0-.53.25 2.25 2.25 0 0 0-.7 1.67 3.9 3.9 0 0 0 .82 2.07 8.9 8.9 0 0 0 3.4 3 10.3 10.3 0 0 0 1.14.42 2.75 2.75 0 0 0 1.26.08c.38-.06 1.17-.48 1.34-.94a1.66 1.66 0 0 0 .11-.94c-.05-.09-.18-.14-.38-.24z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderCatalog(products, targetSelector, opts = {}) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  const limit = opts.limit;
  const list = limit ? products.slice(0, limit) : products;
  if (!list.length) {
    target.innerHTML = `<div class="empty-state">Nothing in stock right now — message us on WhatsApp and we'll check.</div>`;
    return;
  }
  target.innerHTML = list.map(productCard).join("");
}

async function loadCatalog() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  return rowsToProducts(parseCSV(text));
}

/* Category filter wiring for the shop page */
function wireCategoryFilter(products, gridSelector, stripSelector) {
  const strip = document.querySelector(stripSelector);
  if (!strip) return;
  strip.addEventListener("click", (e) => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    strip.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    const cat = pill.dataset.cat;
    const cond = pill.dataset.cond;
    let filtered = products;
    if (cat && cat !== "all") filtered = filtered.filter(p => p.category === cat);
    if (cond) filtered = filtered.filter(p => p.condition.toLowerCase() === cond.toLowerCase());
    renderCatalog(filtered, gridSelector);
  });
}
