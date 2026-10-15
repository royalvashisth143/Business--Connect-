const http = require('node:http');
const url = require('node:url');

let users = [
    { id: 'u-1', name: 'Ramesh Patel', email: 'superadmin@businessconnect.in', role: 'superadmin', phone: '+91 98111 00001' },
    { id: 'u-2', name: 'Priya Sharma', email: 'admin@businessconnect.in', role: 'admin', phone: '+91 98111 00002' },
    { id: 'u-3', name: 'Vikram Singh', email: 'seller@businessconnect.in', role: 'seller', company: 'Bharat Heavy Machines Ltd.', phone: '+91 79 2589 1100' },
    { id: 'u-4', name: 'Amit Verma', email: 'buyer@businessconnect.in', role: 'buyer', company: 'Verma Trading Co.', phone: '+91 98222 33445' }
];

let businesses = [
    { id: 'biz-1', name: 'Bharat Heavy Machines Ltd.', category: 'Industrial Machinery', city: 'Ahmedabad', phone: '+91 79 2589 1100', whatsapp: '919822233344', rating: 4.9, verified: true, gstin: '24AABCB1234F1Z8' },
    { id: 'biz-2', name: 'Metro Tech Electronics Pvt Ltd', category: 'Electrical & Electronics', city: 'Bengaluru', phone: '+91 80 4123 9988', whatsapp: '919833344455', rating: 4.7, verified: true, gstin: '29AADCM4567H1Z2' },
    { id: 'biz-3', name: 'Vardhman Premium Textiles', category: 'Textiles & Fabrics', city: 'Surat', phone: '+91 261 2456 789', whatsapp: '919822299988', rating: 4.8, verified: true, gstin: '24AAACV8899K1Z5' }
];

let products = [
    { id: 'p1', biz_name: 'Bharat Heavy Machines Ltd.', title: 'Automatic Packaging Machine', wholesale_price: 185000, retail_price: 225000, moq: 1, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500' },
    { id: 'p2', biz_name: 'Metro Tech Electronics Pvt Ltd', title: 'Industrial 150W LED High Bay Light', wholesale_price: 1350, retail_price: 2499, moq: 20, img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500' },
    { id: 'p3', biz_name: 'Vardhman Premium Textiles', title: '100% Pure Organic Cotton Fabric', wholesale_price: 195, retail_price: 380, moq: 100, img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500' }
];

let enquiries = [
    { id: 'enq-101', buyer_name: 'Amit Verma', phone: '+91 98222 33445', product: 'Automatic Packaging Machine', qty: 2 }
];

function getSession(req) {
    const cookie = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('bc_user='));
    if (cookie) {
        try { return JSON.parse(decodeURIComponent(cookie.split('=')[1])); } catch (e) { return null; }
    }
    return null;
}

function parseBody(req) {
    return new Promise(resolve => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
                    const p = new URLSearchParams(body); const o = {}; for (const [k, v] of p.entries()) o[k] = v; return resolve(o);
                }
                resolve(JSON.parse(body));
            } catch (e) {
                const p = new URLSearchParams(body); const o = {}; for (const [k, v] of p.entries()) o[k] = v; resolve(o);
            }
        });
    });
}

function layout(title, content, user = null) {
    const authSection = user ? `
        <div class="flex items-center space-x-2 text-xs">
            <span class="font-bold text-emerald-700 dark:text-emerald-400">● ${user.name} (${user.role.toUpperCase()})</span>
            <a href="${user.role === 'superadmin' ? '/admin/super' : (user.role === 'admin' ? '/admin' : (user.role === 'seller' ? '/seller' : '/buyer'))}" class="bg-emerald-600 text-white px-2.5 py-1 rounded font-bold hover:bg-emerald-700">Dashboard</a>
            <a href="/logout" class="text-rose-500 font-bold hover:underline">Logout</a>
        </div>
    ` : `
        <a href="/login" class="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700">Login / Register</a>
    `;

    return `<!DOCTYPE html>
<html lang="en" class="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Business Connect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { darkMode: 'class' };
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        function toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }
    </script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-emerald-50/20 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col min-h-screen">
    <header class="bg-emerald-800 text-white text-xs py-1.5 px-4 flex justify-between items-center">
        <span>🇮🇳 <b>Business Connect</b> &bull; India's Wholesale & Retail B2B/B2C Platform</span>
        <span>Helpline: 1800-200-9898 &bull; INR (₹)</span>
    </header>

    <nav class="bg-white dark:bg-slate-900 border-b border-emerald-100 dark:border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-sm flex flex-wrap justify-between items-center gap-2">
        <a href="/" class="flex items-center space-x-2">
            <span class="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black">BC</span>
            <span class="text-xl font-black text-slate-900 dark:text-white">Business<span class="text-emerald-600">Connect</span></span>
        </a>
        <div class="flex items-center flex-wrap gap-3 text-xs font-bold">
            <a href="/" class="hover:text-emerald-600">Home</a>
            <a href="/directory" class="hover:text-emerald-600">Directory</a>
            <a href="/b2b" class="hover:text-emerald-600">B2B Wholesale</a>
            <a href="/marketplace" class="hover:text-emerald-600">Retail</a>
            <button onclick="toggleTheme()" class="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-700 dark:text-amber-400">🌓 Mode</button>
            ${authSection}
        </div>
    </nav>

    <main class="flex-grow">${content}</main>

    <footer class="bg-slate-900 text-slate-400 text-xs py-8 px-4 border-t border-slate-800 mt-12">
        <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
            <div>
                <p class="font-bold text-white text-sm">Business Connect India</p>
                <p class="text-[11px] mt-1">&copy; 2026 Business Connect &bull; Unified B2B & B2C Portal &bull; Asia/Kolkata</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <a href="/quick-login?role=superadmin" class="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded text-[11px]">👑 Super Admin</a>
                <a href="/quick-login?role=admin" class="bg-teal-950 text-teal-300 border border-teal-800 px-2 py-1 rounded text-[11px]">🛡️ Admin</a>
                <a href="/quick-login?role=seller" class="bg-green-950 text-green-300 border border-green-800 px-2 py-1 rounded text-[11px]">🏪 Seller</a>
                <a href="/quick-login?role=buyer" class="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded text-[11px]">🛒 Buyer</a>
            </div>
        </div>
    </footer>
    <a href="https://wa.me/919811122233" target="_blank" class="fixed bottom-5 right-5 bg-emerald-600 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-2xl z-50 hover:bg-emerald-700"><i class="fa-brands fa-whatsapp"></i></a>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
    const p = url.parse(req.url, true);
    const m = req.method;
    const user = getSession(req);

    if (p.pathname === '/logout') {
        res.writeHead(302, { 'Set-Cookie': 'bc_user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly', 'Location': '/login' });
        return res.end();
    }

    if (p.pathname === '/quick-login') {
        const role = p.query.role || 'buyer';
        const u = users.find(x => x.role === role) || users[3];
        const dest = role === 'superadmin' ? '/admin/super' : (role === 'admin' ? '/admin' : (role === 'seller' ? '/seller' : '/buyer'));
        res.writeHead(302, { 'Set-Cookie': `bc_user=${encodeURIComponent(JSON.stringify(u))}; Path=/; HttpOnly`, 'Location': dest });
        return res.end();
    }

    if (p.pathname === '/login') {
        if (m === 'POST') {
            const b = await parseBody(req);
            let u = users.find(x => x.email === b.email);
            if (!u) {
                u = { id: 'u-' + Date.now(), name: b.email.split('@')[0], email: b.email, role: b.role || 'buyer' };
                users.push(u);
            }
            const dest = u.role === 'superadmin' ? '/admin/super' : (u.role === 'admin' ? '/admin' : (u.role === 'seller' ? '/seller' : '/buyer'));
            res.writeHead(302, { 'Set-Cookie': `bc_user=${encodeURIComponent(JSON.stringify(u))}; Path=/; HttpOnly`, 'Location': dest });
            return res.end();
        }

        const html = layout('Login', `
            <div class="max-w-md mx-auto px-4 py-10">
                <div class="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h2 class="text-2xl font-black text-center text-slate-900 dark:text-white mb-2">Portal Access</h2>
                    <p class="text-xs text-center text-slate-500 mb-6">Choose your role or tap 1-Click Access</p>
                    <div class="p-4 bg-emerald-50 dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-slate-700 mb-6">
                        <p class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">⚡ 1-Click Instant Login (Direct):</p>
                        <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                            <a href="/quick-login?role=superadmin" class="bg-emerald-700 text-white p-2 rounded text-center">👑 Super Admin</a>
                            <a href="/quick-login?role=admin" class="bg-teal-700 text-white p-2 rounded text-center">🛡️ Admin</a>
                            <a href="/quick-login?role=seller" class="bg-green-700 text-white p-2 rounded text-center">🏪 Seller</a>
                            <a href="/quick-login?role=buyer" class="bg-emerald-600 text-white p-2 rounded text-center">🛒 Buyer</a>
                        </div>
                    </div>
                    <form method="POST" action="/login" class="space-y-3 text-xs">
                        <div><label class="block font-bold mb-1">Select Role</label>
                            <select name="role" class="w-full border p-2 rounded bg-white dark:bg-slate-800">
                                <option value="superadmin">👑 Super Admin</option>
                                <option value="admin">🛡️ Operations Admin</option>
                                <option value="seller">🏪 Seller / Manufacturer</option>
                                <option value="buyer">🛒 Buyer</option>
                            </select>
                        </div>
                        <div><label class="block font-bold mb-1">Email</label><input type="email" name="email" value="seller@businessconnect.in" class="w-full border p-2 rounded bg-white dark:bg-slate-800" required></div>
                        <div><label class="block font-bold mb-1">Password</label><input type="password" name="password" value="demo123" class="w-full border p-2 rounded bg-white dark:bg-slate-800" required></div>
                        <button type="submit" class="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700">Login to Dashboard</button>
                    </form>
                </div>
            </div>
        `, user);
        res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html);
    }

    if (p.pathname === '/admin/super') {
        if (!user || user.role !== 'superadmin') { res.writeHead(302, { Location: '/quick-login?role=superadmin' }); return res.end(); }
        const html = layout('Super Admin', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <span class="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs px-2 py-0.5 rounded border border-emerald-300">👑 Super Admin Master</span>
                        <h1 class="text-2xl font-black text-slate-900 dark:text-white mt-1">Platform Master Administration</h1>
                    </div>
                    <a href="/logout" class="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded">Logout</a>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">TOTAL USERS</p><p class="text-2xl font-black text-emerald-600">1,544</p></div>
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">TRANSACTION VALUE</p><p class="text-2xl font-black text-slate-900 dark:text-white">₹4.82 Cr</p></div>
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">PLATFORM REVENUE</p><p class="text-2xl font-black text-emerald-700">₹14.28 Lakh</p></div>
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">BUSINESSES</p><p class="text-2xl font-black text-teal-600">515</p></div>
                </div>
                <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-100 dark:border-slate-800">
                    <h3 class="font-bold text-sm mb-3">Master User Directory</h3>
                    <div class="overflow-x-auto text-xs">
                        <table class="w-full text-left">
                            <tr class="border-b text-slate-400 pb-2"><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
                            ${users.map(u => `<tr class="border-b py-2"><td class="font-bold py-2">${u.name}</td><td>${u.email}</td><td><span class="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">${u.role}</span></td><td><a href="/quick-login?role=${u.role}" class="text-emerald-600 font-bold hover:underline">Switch</a></td></tr>`).join('')}
                        </table>
                    </div>
                </div>
            </div>
        `, user);
        res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html);
    }

    if (p.pathname === '/admin') {
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) { res.writeHead(302, { Location: '/quick-login?role=admin' }); return res.end(); }
        const html = layout('Admin', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <span class="bg-teal-100 text-teal-800 font-bold text-xs px-2 py-0.5 rounded">🛡️ Operations Admin</span>
                <h1 class="text-2xl font-black mt-1 mb-6">Listing Verification & Approvals</h1>
                <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-100 dark:border-slate-800 text-xs">
                    <h3 class="font-bold text-sm mb-3">Pending Businesses for Verification</h3>
                    ${businesses.map(b => `<div class="flex justify-between items-center py-2 border-b"><div><p class="font-bold">${b.name}</p><p class="text-slate-400">${b.category} &bull; ${b.city} &bull; GST: ${b.gstin}</p></div><button onclick="alert('Business Approved!')" class="bg-emerald-600 text-white px-3 py-1 rounded font-bold">Approve</button></div>`).join('')}
                </div>
            </div>
        `, user);
        res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html);
    }

    if (p.pathname === '/seller') {
        if (!user || (user.role !== 'seller' && user.role !== 'superadmin')) { res.writeHead(302, { Location: '/quick-login?role=seller' }); return res.end(); }
        const html = layout('Seller Panel', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <span class="bg-green-100 text-green-800 font-bold text-xs px-2 py-0.5 rounded">🏪 Supplier Dashboard</span>
                        <h1 class="text-2xl font-black mt-1">Bharat Heavy Machines Ltd.</h1>
                    </div>
                    <button onclick="const t = prompt('Product Name:'); if(t) alert('Product Added!')" class="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded">+ Add Product</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">ACTIVE LISTINGS</p><p class="text-2xl font-black text-emerald-600">${products.length}</p></div>
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">INCOMING LEADS</p><p class="text-2xl font-black text-amber-600">${enquiries.length}</p></div>
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">ORDERS</p><p class="text-2xl font-black text-slate-900 dark:text-white">28</p></div>
                    <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800"><p class="text-xs text-slate-400">TOTAL REVENUE</p><p class="text-2xl font-black text-emerald-700">₹34.5 Lakh</p></div>
                </div>
                <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-100 dark:border-slate-800 text-xs">
                    <h3 class="font-bold text-sm mb-3">Incoming Wholesale Leads & Enquiries</h3>
                    ${enquiries.map(e => `<div class="flex justify-between items-center py-2.5 border-b"><div><p class="font-bold">${e.buyer_name} (${e.phone})</p><p class="text-slate-400">Product: ${e.product} &bull; Qty: ${e.qty} units</p></div><a href="https://wa.me/919822233445" target="_blank" class="bg-emerald-600 text-white px-3 py-1 rounded font-bold">Reply WhatsApp</a></div>`).join('')}
                </div>
            </div>
        `, user);
        res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html);
    }

    if (p.pathname === '/buyer') {
        if (!user) { res.writeHead(302, { Location: '/quick-login?role=buyer' }); return res.end(); }
        const html = layout('Buyer Portal', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <span class="bg-lime-100 text-lime-800 font-bold text-xs px-2 py-0.5 rounded">🛒 Buyer Dashboard</span>
                <h1 class="text-2xl font-black mt-1 mb-6">Welcome, ${user.name}</h1>
                <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-100 dark:border-slate-800 text-xs">
                    <h3 class="font-bold text-sm mb-3">My RFQs & Quotations</h3>
                    <div class="flex justify-between items-center py-2 border-b">
                        <div><p class="font-bold">Automatic Packaging M
