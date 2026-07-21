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
          <a class="card-wa" href="https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}?text=${waText}" target="_blank" rel="noopener">💬</a>
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
