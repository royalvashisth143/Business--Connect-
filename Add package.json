const http = require('node:http');
const url = require('node:url');
const { DatabaseSync } = require('node:sqlite');

// Database Auto-Initialization
const db = new DatabaseSync('database.sqlite');
db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY, business_name TEXT, category TEXT, city TEXT,
        phone TEXT, whatsapp TEXT, rating REAL, reviews INT, verified INT DEFAULT 1, gstin TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, business_id TEXT, title TEXT, wholesale_price REAL,
        retail_price REAL, moq INT, stock INT, is_b2b INT, is_b2c INT, img TEXT
    );
    CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY, buyer_name TEXT, buyer_phone TEXT, product_id TEXT,
        business_id TEXT, quantity INT, city TEXT, requirements TEXT, status TEXT DEFAULT 'new'
    );
`);

// Seed Indian businesses if empty
const count = db.prepare('SELECT COUNT(*) as c FROM businesses').get().c;
if (count === 0) {
    db.prepare(`INSERT INTO businesses VALUES 
        ('biz-1', 'Bharat Heavy Machines Ltd.', 'Industrial Machinery', 'Ahmedabad', '+91 79 2589 1100', '919822233344', 4.9, 58, 1, '24AABCB1234F1Z8'),
        ('biz-2', 'Metro Tech Electronics Pvt Ltd', 'Electrical & Electronics', 'Bengaluru', '+91 80 4123 9988', '919833344455', 4.7, 42, 1, '29AADCM4567H1Z2'),
        ('biz-3', 'Vardhman Premium Textiles', 'Textiles & Fabrics', 'Surat', '+91 261 2456 789', '919822299988', 4.8, 89, 1, '24AAACV8899K1Z5')
    `).run();
    db.prepare(`INSERT INTO products VALUES 
        ('p1', 'biz-1', 'Automatic Packaging Machine', 185000, 225000, 1, 15, 1, 0, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500'),
        ('p2', 'biz-2', 'Industrial 150W LED High Bay Light', 1350, 2499, 20, 500, 1, 1, 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500'),
        ('p3', 'biz-3', '100% Pure Organic Cotton Fabric', 195, 380, 100, 5000, 1, 1, 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500')
    `).run();
}

function parseBody(req) {
    return new Promise(res => {
        let b = ''; req.on('data', c => b += c);
        req.on('end', () => { try { res(JSON.parse(b)); } catch { res({}); } });
    });
}

function layout(title, content) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} | Business Connect India</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    </head><body class="bg-slate-50 text-slate-800 antialiased flex flex-col min-h-screen">
    <header class="bg-[#0a1128] text-white py-2 px-4 text-xs border-b border-slate-800">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <span>🇮🇳 <b>Business Connect India</b> &bull; Unified B2B & B2C Marketplace</span>
            <span>Toll-Free: 1800-200-9898 &bull; INR (₹)</span>
        </div>
    </header>
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-4 py-3">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <a href="/" class="flex items-center space-x-2">
                <span class="w-9 h-9 bg-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-lg">BC</span>
                <span class="text-xl font-extrabold text-slate-900">Business<span class="text-blue-700">Connect</span></span>
            </a>
            <div class="flex items-center space-x-4 text-xs font-bold text-slate-700">
                <a href="/" class="hover:text-blue-700">Home</a>
                <a href="/directory" class="hover:text-blue-700">Directory</a>
                <a href="/b2b" class="hover:text-blue-700">B2B Wholesale</a>
                <a href="/marketplace" class="hover:text-blue-700">Retail</a>
                <a href="/seller" class="bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">Seller Panel</a>
            </div>
        </div>
    </nav>
    <main class="flex-1">${content}</main>
    <footer class="bg-[#0a1128] text-slate-400 text-xs py-8 px-4 border-t border-slate-800 mt-12 text-center">
        <p>&copy; 2026 Business Connect Technologies India Pvt Ltd. Make in India 🇮🇳 &bull; GST & MSME Compliant</p>
    </footer>
    <a href="https://wa.me/919811122233" target="_blank" class="fixed bottom-5 right-5 bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-2xl z-50"><i class="fa-brands fa-whatsapp"></i></a>
    </body></html>`;
}

const server = http.createServer(async (req, res) => {
    const p = url.parse(req.url, true);
    const m = req.method;

    if (p.pathname === '/api/enquiries' && m === 'POST') {
        const b = await parseBody(req);
        const id = 'enq-' + Date.now();
        db.prepare(`INSERT INTO enquiries VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`).run(
            id, b.buyer_name || 'Buyer', b.buyer_phone || '', b.product_id || '', b.business_id || '', b.quantity || 1, b.city || 'India', b.requirements || ''
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, id }));
    }

    if (p.pathname === '/' || p.pathname === '/index.html') {
        const prods = db.prepare('SELECT p.*, b.business_name FROM products p JOIN businesses b ON b.id = p.business_id').all();
        const bizs = db.prepare('SELECT * FROM businesses').all();
        const html = layout('Home', `
            <section class="bg-gradient-to-r from-[#0a1128] to-blue-950 text-white py-14 px-4 text-center">
                <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">Search. Connect. Trade in India.</h1>
                <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6">Over 50,000+ verified Indian manufacturers, suppliers, and wholesale deals.</p>
                <form action="/directory" class="max-w-xl mx-auto flex bg-white rounded-lg p-1.5 shadow-xl text-slate-800 text-xs">
                    <input type="text" name="city" placeholder="City (Mumbai, Delhi, Surat...)" class="w-1/3 p-2 outline-none border-r border-slate-200">
                    <input type="text" name="search" placeholder="Search machines, LED, fabrics..." class="flex-1 p-2 outline-none">
                    <button class="bg-blue-700 text-white px-5 py-2 font-bold rounded hover:bg-blue-800">Search</button>
                </form>
            </section>
            <section class="max-w-6xl mx-auto px-4 py-10">
                <h2 class="text-xl font-bold mb-6 text-slate-900">Featured Verified Manufacturers</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    ${bizs.map(b => `
                        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-sm text-slate-900">${b.business_name}</h3>
                                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Verified</span>
                            </div>
                            <p class="text-xs text-slate-500 mb-4">${b.category} &bull; ${b.city} &bull; GST: ${b.gstin}</p>
                            <div class="flex space-x-2 text-xs">
                                <a href="tel:${b.phone}" class="flex-1 bg-slate-100 text-center py-2 rounded font-bold hover:bg-slate-200"><i class="fa-solid fa-phone mr-1"></i> Call</a>
                                <a href="https://wa.me/${b.whatsapp}" class="flex-1 bg-emerald-600 text-white text-center py-2 rounded font-bold hover:bg-emerald-700"><i class="fa-brands fa-whatsapp mr-1"></i> WhatsApp</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <h2 class="text-xl font-bold mb-6 text-slate-900">Trending B2B Wholesale Deals</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${prods.map(p => `
                        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                            <div>
                                <img src="${p.img}" class="w-full h-44 object-cover">
                                <div class="p-4">
                                    <span class="text-[10px] text-blue-700 font-bold uppercase">${p.business_name}</span>
                                    <h4 class="font-bold text-sm text-slate-900 mt-1">${p.title}</h4>
                                    <p class="text-emerald-700 font-extrabold text-base mt-2">₹${p.wholesale_price.toLocaleString('en-IN')} <span class="text-xs text-slate-400 font-normal">/ MOQ: ${p.moq}</span></p>
                                </div>
                            </div>
                            <div class="p-4 pt-0">
                                <button onclick="promptEnq('${p.id}', '${p.business_id}')" class="w-full bg-blue-700 text-white py-2 rounded font-bold text-xs hover:bg-blue-800">Request Quotation (RFQ)</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            <script>
                async function promptEnq(pid, bid) {
                    const name = prompt('Enter your name for quotation:') || 'Buyer';
                    const phone = prompt('Enter mobile number:') || '+91 9800000000';
                    const qty = prompt('Quantity needed:') || '50';
                    const res = await fetch('/api/enquiries', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ buyer_name: name, buyer_phone: phone, product_id: pid, business_id: bid, quantity: qty })
                    });
                    const d = await res.json();
                    if(d.success) alert('Success! RFQ sent. Ref ID: ' + d.id);
                }
            </script>
        `);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    if (p.pathname === '/directory') {
        let q = 'SELECT * FROM businesses WHERE 1=1';
        let params = [];
        if (p.query.city) { q += ' AND city LIKE ?'; params.push(`%${p.query.city}%`); }
        if (p.query.search) { q += ' AND (business_name LIKE ? OR category LIKE ?)'; params.push(`%${p.query.search}%`, `%${p.query.search}%`); }
        const bizs = db.prepare(q).all(...params);
        const html = layout('Directory', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <h1 class="text-2xl font-bold mb-4">India Business Directory (Justdial-Style)</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${bizs.map(b => `
                        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                            <div>
                                <h3 class="font-bold text-sm text-slate-900">${b.business_name}</h3>
                                <p class="text-xs text-slate-500">${b.category} &bull; ${b.city} &bull; Rating: ⭐ ${b.rating}</p>
                            </div>
                            <div class="space-x-2 text-xs">
                                <a href="tel:${b.phone}" class="bg-slate-100 px-3 py-1.5 rounded font-bold">Call</a>
                                <a href="https://wa.me/${b.whatsapp}" class="bg-emerald-600 text-white px-3 py-1.5 rounded font-bold">WhatsApp</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    if (p.pathname === '/b2b' || p.pathname === '/marketplace') {
        const prods = db.prepare('SELECT * FROM products').all();
        const html = layout(p.pathname === '/b2b' ? 'B2B Wholesale' : 'Marketplace', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <h1 class="text-2xl font-bold mb-6">${p.pathname === '/b2b' ? 'B2B Wholesale Portal' : 'Retail Marketplace'}</h1>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${prods.map(pr => `
                        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <img src="${pr.img}" class="w-full h-40 object-cover rounded mb-2">
                            <h3 class="font-bold text-sm">${pr.title}</h3>
                            <p class="text-blue-700 font-bold text-sm mt-1">₹${pr.wholesale_price.toLocaleString('en-IN')}</p>
                            <button onclick="alert('Order / RFQ processed for ${pr.title}')" class="w-full bg-blue-700 text-white py-1.5 rounded text-xs font-bold mt-3">Buy / Inquire</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    if (p.pathname === '/seller') {
        const enqs = db.prepare('SELECT * FROM enquiries').all();
        const html = layout('Seller Dashboard', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <h1 class="text-2xl font-bold mb-4">Seller Dashboard</h1>
                <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
                    <h3 class="font-bold text-sm mb-2">Incoming Buyer RFQs (${enqs.length})</h3>
                    ${enqs.length === 0 ? '<p class="text-xs text-slate-500">No enquiries yet.</p>' : enqs.map(e => `
                        <div class="border-b border-slate-100 py-2 text-xs flex justify-between">
                            <span><b>${e.buyer_name}</b> (${e.city}) &bull; Qty: ${e.quantity}</span>
                            <a href="tel:${e.buyer_phone}" class="text-blue-700 font-bold">Contact: ${e.buyer_phone}</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    res.writeHead(302, { Location: '/' });
    res.end();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Business Connect live on port ' + PORT));
