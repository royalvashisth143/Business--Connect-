const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Demo data: replace with a database (for example, Supabase/PostgreSQL) for production.
const categories = [
  { id: 1, name: "Industrial Machinery", icon: "⚙️" },
  { id: 2, name: "Electronics", icon: "🔌" },
  { id: 3, name: "Apparel & Textiles", icon: "🧵" },
  { id: 4, name: "Building Materials", icon: "🧱" },
  { id: 5, name: "Food & Agriculture", icon: "🌾" },
  { id: 6, name: "Home & Kitchen", icon: "🏠" },
  { id: 7, name: "Jewellery", icon: "💎" },
  { id: 8, name: "Business Services", icon: "🤝" }
];

const products = [
  { id: 101, name: "Industrial Water Pump", category: "Industrial Machinery", price: "₹8,500 / piece", moq: "2 pieces", seller: "Shree Industrial Solutions", city: "Ahmedabad", verified: true, image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80", description: "Heavy-duty industrial pump for commercial applications." },
  { id: 102, name: "LED Panel Light", category: "Electronics", price: "₹450 / piece", moq: "50 pieces", seller: "BrightStar Electricals", city: "Delhi", verified: true, image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80", description: "Energy-efficient LED lighting for offices and shops." },
  { id: 103, name: "Cotton Fabric Roll", category: "Apparel & Textiles", price: "₹180 / metre", moq: "100 metres", seller: "Rajasthan Textile House", city: "Jaipur", verified: false, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80", description: "Cotton fabric suitable for apparel and garment production." },
  { id: 104, name: "Premium Ceramic Tiles", category: "Building Materials", price: "₹42 / sq. ft.", moq: "500 sq. ft.", seller: "UrbanBuild Materials", city: "Morbi", verified: true, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80", description: "Modern finish tiles for residential and commercial projects." },
  { id: 105, name: "Organic Basmati Rice", category: "Food & Agriculture", price: "₹95 / kg", moq: "100 kg", seller: "GreenHarvest Foods", city: "Karnal", verified: true, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80", description: "Long-grain rice supplied in wholesale packaging." },
  { id: 106, name: "Gold-Plated Jewellery Set", category: "Jewellery", price: "₹1,250 / set", moq: "10 sets", seller: "Aarohi Jewellery Works", city: "Mumbai", verified: true, image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80", description: "Fashion jewellery for retailers and resellers." },
  { id: 107, name: "Stainless Steel Cookware", category: "Home & Kitchen", price: "₹780 / set", moq: "20 sets", seller: "KitchenKart Wholesale", city: "Bengaluru", verified: false, image: "https://images.unsplash.com/photo-1584990347449-a6e4a7b0f0c4?auto=format&fit=crop&w=900&q=80", description: "Durable cookware sets for retail and hospitality." },
  { id: 108, name: "Business Website Package", category: "Business Services", price: "Starting ₹4,999", moq: "1 project", seller: "Digital Growth Studio", city: "Pune", verified: true, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80", description: "Business website setup and digital presence services." }
];

const inquiries = [];

app.get("/health", (_req, res) => res.json({ status: "ok", app: "Business Connect" }));
app.get("/api/categories", (_req, res) => res.json(categories));
app.get("/api/products", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim().toLowerCase();
  const city = String(req.query.city || "").trim().toLowerCase();
  const result = products.filter(p =>
    (!q || [p.name, p.category, p.seller, p.description].some(v => v.toLowerCase().includes(q))) &&
    (!category || p.category.toLowerCase() === category) &&
    (!city || p.city.toLowerCase().includes(city))
  );
  res.json(result);
});
app.post("/api/inquiries", (req, res) => {
  const { name, phone, email, message, productId } = req.body || {};
  if (!name || !phone || !message) {
    return res.status(400).json({ error: "Name, phone and message are required." });
  }
  const inquiry = {
    id: Date.now(),
    name: String(name).slice(0, 100),
    phone: String(phone).slice(0, 30),
    email: String(email || "").slice(0, 120),
    message: String(message).slice(0, 2000),
    productId: productId ? Number(productId) : null,
    createdAt: new Date().toISOString()
  };
  inquiries.push(inquiry);
  console.log("NEW INQUIRY:", JSON.stringify(inquiry));
  res.status(201).json({ success: true, message: "Inquiry received. The demo stores it in temporary memory only." });
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#138a45"><meta name="description" content="Discover verified suppliers, compare wholesale products and connect with businesses across India.">
<title>Business Connect | India's Business Marketplace</title>
<style>
:root{--green:#138a45;--green2:#0d6b35;--mint:#eaf7ef;--bg:#f6f8f6;--card:#fff;--text:#17231b;--muted:#647067;--border:#e1e8e2;--shadow:0 8px 28px #163c2010}
[data-theme="dark"]{--green:#46c878;--green2:#2ba65d;--mint:#183526;--bg:#101713;--card:#18211b;--text:#edf6ef;--muted:#a6b6aa;--border:#2c3a30;--shadow:0 8px 28px #0003}
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text)}a{color:inherit;text-decoration:none}button,input,select,textarea{font:inherit}.topbar{background:var(--green2);color:white;text-align:center;padding:8px 12px;font-size:13px}.nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px max(4%,calc((100% - 1200px)/2));background:var(--card);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:5}.brand{font-size:23px;font-weight:850;letter-spacing:-.8px;white-space:nowrap}.brand span{color:var(--green)}.navlinks{display:flex;gap:20px;align-items:center;color:var(--muted);font-size:14px}.btn{border:0;border-radius:10px;background:var(--green);color:white;padding:11px 16px;font-weight:700;cursor:pointer}.btn:hover{filter:brightness(.94)}.btn.outline{background:transparent;color:var(--green);border:1px solid var(--green)}.theme{background:var(--mint);color:var(--text);border:1px solid var(--border);padding:9px 11px;border-radius:10px;cursor:pointer}.hero{background:linear-gradient(120deg,var(--mint),var(--bg));padding:58px 20px 42px}.wrap{max-width:1200px;margin:auto}.hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:36px;align-items:center}.eyebrow{display:inline-flex;background:var(--card);color:var(--green);border:1px solid var(--border);padding:7px 11px;border-radius:99px;font-size:12px;font-weight:800}.hero h1{font-size:clamp(34px,5vw,56px);line-height:1.06;letter-spacing:-1.8px;margin:18px 0}.hero h1 span{color:var(--green)}.hero p{color:var(--muted);font-size:17px;line-height:1.65;max-width:610px}.searchbox{display:flex;gap:8px;background:var(--card);padding:9px;border:1px solid var(--border);border-radius:15px;box-shadow:var(--shadow);margin-top:24px}.searchbox input,.searchbox select{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--text);padding:9px}.hero-card{background:var(--card);padding:24px;border-radius:22px;border:1px solid var(--border);box-shadow:var(--shadow)}.hero-card h3{margin:0 0 16px}.statgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.stat{padding:17px;background:var(--bg);border:1px solid var(--border);border-radius:14px}.stat strong{display:block;font-size:25px;color:var(--green)}.stat small{color:var(--muted)}.section{padding:40px 20px}.sectionhead{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:22px}.section h2{font-size:28px;margin:0 0 8px;letter-spacing:-.6px}.sub{color:var(--muted);margin:0}.categories{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}.cat{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:18px 8px;text-align:center;cursor:pointer;transition:.15s}.cat:hover{border-color:var(--green);transform:translateY(-2px)}.cat .icon{font-size:27px;display:block;margin-bottom:10px}.cat b{font-size:12px}.filters{display:flex;gap:8px;flex-wrap:wrap}.filters input,.filters select{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--text)}.products{display:grid;grid-template-columns:repeat(4,1fr);gap:17px}.product{background:var(--card);border:1px solid var(--border);border-radius:17px;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column}.product img{width:100%;height:170px;object-fit:cover;background:var(--mint)}.productbody{padding:15px;display:flex;flex-direction:column;flex:1}.tag{font-size:11px;background:var(--mint);color:var(--green);padding:5px 8px;border-radius:99px;align-self:flex-start;font-weight:750}.product h3{font-size:16px;margin:11px 0 7px}.price{font-weight:850;font-size:17px}.meta{font-size:12px;color:var(--muted);line-height:1.7;margin:8px 0 14px}.seller{margin-top:auto;font-size:12px;color:var(--muted);padding-bottom:12px}.product .btn{width:100%}.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.trustcard{background:var(--card);border:1px solid var(--border);padding:22px;border-radius:16px}.trustcard .icon{font-size:27px}.trustcard h3{margin:10px 0 6px}.trustcard p{color:var(--muted);font-size:14px;line-height:1.6;margin:0}.cta{background:var(--green2);color:white;border-radius:22px;padding:30px;display:flex;align-items:center;justify-content:space-between;gap:20px}.cta p{opacity:.85}.cta .btn{background:white;color:#126b36}.footer{border-top:1px solid var(--border);padding:28px 20px;color:var(--muted);font-size:13px}.footerinner{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}.modal{display:none;position:fixed;inset:0;background:#0008;z-index:20;align-items:center;justify-content:center;padding:16px}.modal.open{display:flex}.modalbox{width:min(520px,100%);background:var(--card);border-radius:18px;padding:24px;max-height:90vh;overflow:auto}.modalhead{display:flex;justify-content:space-between;align-items:center}.modalhead h2{margin:0}.close{border:0;background:var(--bg);color:var(--text);border-radius:8px;padding:7px 10px;cursor:pointer}.form{display:grid;gap:12px;margin-top:18px}.form input,.form textarea{width:100%;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text)}.form textarea{min-height:100px;resize:vertical}.notice{font-size:12px;color:var(--muted);line-height:1.5}.empty{grid-column:1/-1;text-align:center;padding:40px;background:var(--card);border:1px dashed var(--border);border-radius:15px;color:var(--muted)}
@media(max-width:950px){.categories{grid-template-columns:repeat(4,1fr)}.products{grid-template-columns:repeat(2,1fr)}.hero-grid{grid-template-columns:1fr}.hero-card{max-width:600px}.navlinks a{display:none}}
@media(max-width:560px){.nav{padding:13px 15px}.brand{font-size:20px}.nav .btn{padding:9px 10px}.hero{padding-top:36px}.searchbox{flex-direction:column}.searchbox .btn{width:100%}.categories{grid-template-columns:repeat(2,1fr)}.products{grid-template-columns:1fr 1fr;gap:10px}.product img{height:120px}.productbody{padding:11px}.product h3{font-size:14px}.price{font-size:14px}.product .meta{font-size:11px}.section{padding:30px 14px}.sectionhead{align-items:flex-start;flex-direction:column}.trust{grid-template-columns:1fr}.cta{align-items:flex-start;flex-direction:column}.hero h1{font-size:39px}}
</style>
</head>
<body>
<div class="topbar">India's business discovery & wholesale marketplace · Connect directly with suppliers</div>
<nav class="nav">
  <a class="brand" href="/">Business<span>Connect</span></a>
  <div class="navlinks"><a href="#categories">Categories</a><a href="#products">Find Products</a><a href="#how">How it works</a></div>
  <div style="display:flex;gap:8px;align-items:center"><button class="theme" id="themeBtn" aria-label="Toggle dark mode">🌙</button><button class="btn" onclick="openInquiry()">Post Requirement</button></div>
</nav>
<header class="hero"><div class="wrap hero-grid">
  <div><span class="eyebrow">● MADE FOR INDIAN BUSINESSES</span><h1>Find suppliers.<br><span>Grow your business.</span></h1>
  <p>Discover products, compare wholesale options and connect with businesses across India—all in one place.</p>
  <form class="searchbox" id="searchForm"><input id="q" aria-label="Search products" placeholder="Product, supplier or service..."><select id="city" aria-label="City"><option value="">All India</option><option>Delhi</option><option>Mumbai</option><option>Ahmedabad</option><option>Jaipur</option><option>Pune</option><option>Bengaluru</option></select><button class="btn" type="submit">Search</button></form>
  <p style="font-size:12px;margin-top:12px">Popular: machinery · electronics · jewellery · textiles</p></div>
  <div class="hero-card"><h3>Business opportunities start here</h3><div class="statgrid"><div class="stat"><strong>8+</strong><small>Product categories</small></div><div class="stat"><strong>Pan-India</strong><small>Supplier discovery</small></div><div class="stat"><strong>B2B</strong><small>Wholesale enquiries</small></div><div class="stat"><strong>B2C</strong><small>Product discovery</small></div></div><p style="font-size:13px;margin-bottom:0">Demo marketplace preview · Supplier verification must be completed independently.</p></div>
</div></header>
<section class="section" id="categories"><div class="wrap"><div class="sectionhead"><div><h2>Explore categories</h2><p class="sub">Find the right products and business partners.</p></div></div><div class="categories" id="categoryGrid"></div></div></section>
<section class="section" id="products" style="padding-top:10px"><div class="wrap"><div class="sectionhead"><div><h2>Featured products</h2><p class="sub">Explore sample wholesale listings and enquire directly.</p></div><div class="filters"><input id="filterQ" placeholder="Filter products..." aria-label="Filter products"><select id="filterCategory" aria-label="Filter category"><option value="">All categories</option></select></div></div><div class="products" id="productGrid"><div class="empty">Loading products…</div></div></div></section>
<section class="section" id="how"><div class="wrap"><div class="sectionhead"><div><h2>Built for business growth</h2><p class="sub">A simple starting point for buyers and sellers.</p></div></div><div class="trust"><div class="trustcard"><span class="icon">🔎</span><h3>Discover</h3><p>Search products, categories and supplier locations from one marketplace.</p></div><div class="trustcard"><span class="icon">🤝</span><h3>Connect</h3><p>Send a requirement or product enquiry to start a business conversation.</p></div><div class="trustcard"><span class="icon">📈</span><h3>Grow</h3><p>Help your business get discovered. Add verified profiles and lead tools as the platform evolves.</p></div></div></div></section>
<section class="section"><div class="wrap"><div class="cta"><div><h2 style="margin:0">Looking for a specific product?</h2><p style="margin:8px 0 0">Tell suppliers what you need and start collecting quotes.</p></div><button class="btn" onclick="openInquiry()">Post Your Requirement →</button></div></div></section>
<footer class="footer"><div class="wrap footerinner"><div><b class="brand">Business<span>Connect</span></b><p>Discover. Connect. Grow.</p></div><div>© <span id="year"></span> Business Connect · Demo prototype</div><div>Privacy · Terms · Contact (add your official details before launch)</div></div></footer>
<div class="modal" id="inquiryModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modalbox"><div class="modalhead"><h2 id="modalTitle">Post an enquiry</h2><button class="close" onclick="closeInquiry()">✕</button></div><form class="form" id="inquiryForm"><input name="name" placeholder="Your full name *" required maxlength="100"><input name="phone" placeholder="Mobile number *" required maxlength="30"><input name="email" type="email" placeholder="Email (optional)" maxlength="120"><textarea name="message" placeholder="What product/service are you looking for? *" required maxlength="2000"></textarea><input type="hidden" name="productId" id="productId"><button class="btn" type="submit">Submit enquiry</button><p class="notice">Prototype notice: enquiries are kept in temporary server memory and printed to server logs. They are not permanently stored or emailed.</p><div id="formMessage" role="status"></div></form></div></div>
<script>
const $=s=>document.querySelector(s);
let allProducts=[];
const categoriesFallback=${JSON.stringify(categories)};
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderCategories(cats){$("#categoryGrid").innerHTML=cats.map(c=>`<button class="cat" data-category="${escapeHtml(c.name)}"><span class="icon">${c.icon}</span><b>${escapeHtml(c.name)}</b></button>`).join("");$("#filterCategory").innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option>${escapeHtml(c.name)}</option>`).join("");}
function renderProducts(items){$("#productGrid").innerHTML=items.length?items.map(p=>`<article class="product"><img loading="lazy" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'"><div class="productbody"><span class="tag">${escapeHtml(p.category)}</span><h3>${escapeHtml(p.name)}</h3><div class="price">${escapeHtml(p.price)}</div><div class="meta">Minimum order: ${escapeHtml(p.moq)}<br>📍 ${escapeHtml(p.city)} ${p.verified?' · ✓ Demo verified label':''}</div><div class="seller">${escapeHtml(p.seller)}</div><button class="btn" data-enquire="${p.id}">Get Best Quote</button></div></article>`).join(""):'<div class="empty">No matching products. Try another search or category.</div>';}
async function loadProducts(){try{const r=await fetch('/api/products');allProducts=await r.json();renderProducts(allProducts);}catch(e){$("#productGrid").innerHTML='<div class="empty">Could not load listings. Refresh the page and try again.</div>';}}
function applyFilters(){const q=$("#filterQ").value.toLowerCase();const cat=$("#filterCategory").value;const city=$("#city").value.toLowerCase();renderProducts(allProducts.filter(p=>(!q||[p.name,p.category,p.seller,p.description].some(v=>v.toLowerCase().includes(q)))&&(!cat||p.category===cat)&&(!city||p.city.toLowerCase().includes(city))));}
function openInquiry(id=""){ $("#productId").value=id; $("#formMessage").textContent=""; $("#inquiryModal").classList.add("open");}
function closeInquiry(){ $("#inquiryModal").classList.remove("open");}
$("#themeBtn").addEventListener("click",()=>{const dark=document.documentElement.getAttribute("data-theme")!=="dark";document.documentElement.setAttribute("data-theme",dark?"dark":"light");localStorage.setItem("bc-theme",dark?"dark":"light");$("#themeBtn").textContent=dark?"☀️":"🌙";});
if(localStorage.getItem("bc-theme")==="dark"){document.documentElement.setAttribute("data-theme","dark");$("#themeBtn").textContent="☀️";}
$("#searchForm").addEventListener("submit",e=>{e.preventDefault();$("#filterQ").value=$("#q").value;applyFilters();$("#products").scrollIntoView({behavior:"smooth"});});
$("#filterQ").addEventListener("input",applyFilters);$("#filterCategory").addEventListener("change",applyFilters);$("#city").addEventListener("change",applyFilters);
$("#categoryGrid").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){$("#filterCategory").value=b.dataset.category;applyFilters();$("#products").scrollIntoView({behavior:"smooth"});}});
$("#productGrid").addEventListener("click",e=>{const b=e.target.closest("[data-enquire]");if(b)openInquiry(b.dataset.enquire);});
$("#inquiryForm").addEventListener("submit",async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());try{const r=await fetch("/api/inquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const out=await r.json();$("#formMessage").textContent=out.message||out.error||"Please try again.";if(r.ok)e.target.reset();}catch(err){$("#formMessage").textContent="Could not submit. Please try again."; }});
$("#year").textContent=new Date().getFullYear();renderCategories(categoriesFallback);loadProducts();
</script>
</body></html>`);
});

app.listen(PORT, "0.0.0.0", () => console.log(`Business Connect running on port ${PORT}`));

