# Dua Computers Website

Static site for Dua Computers (Ruwi, Muscat) — no build step, no server needed.

## Structure
- `index.html` — Home
- `shop.html` — Full catalog (pulls live from the Google Sheet)
- `repair.html` — Repair & services
- `about.html` — About
- `contact.html` — Contact + map
- `assets/style.css` — All styling
- `assets/catalog.js` — Loads product data from the Google Sheet

## Updating stock
Stock is **not** edited here. Open the "Dua Computers Stock" Google Sheet and:
- Add a row for new stock
- Set a row's Stock column to `No` (or delete it) when something sells
- The website picks up changes automatically — no redeploy needed

## Updating contact info, hours, or text
Edit the relevant `.html` file directly (address, phone, and hours appear in the top bar, footer, and Contact page on every file — search and replace across files if changing any of these).

## Changing colors or fonts
Everything is controlled from the `:root` section at the top of `assets/style.css`. Change the hex values there and it updates site-wide.

## Deploying
This repo is connected to Netlify, which auto-deploys the `main` branch. Push changes to GitHub and the live site updates automatically within a minute or two.
