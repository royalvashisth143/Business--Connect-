const http = require('node:http');
const url = require('node:url');

// Database Simulation (Zero external dependencies - 100% reliable on Render)
let users = [
    { id: 'u-1', name: 'Ramesh Patel (Super Admin)', email: 'superadmin@businessconnect.in', role: 'superadmin', phone: '+91 98111 00001' },
    { id: 'u-2', name: 'Priya Sharma (Admin)', email: 'admin@businessconnect.in', role: 'admin', phone: '+91 98111 00002' },
    { id: 'u-3', name: 'Vikram Singh (Seller)', email: 'seller@businessconnect.in', role: 'seller', company: 'Bharat Heavy Machines Ltd.', phone: '+91 79 2589 1100' },
    { id: 'u-4', name: 'Amit Verma (Buyer)', email: 'buyer@businessconnect.in', role: 'buyer', company: 'Verma Trading Co.', phone: '+91 98222 33445' }
];

let businesses = [
    { id: 'biz-1', name: 'Bharat Heavy Machines Ltd.', category: 'Industrial Machinery', city: 'Ahmedabad', state: 'Gujarat', pincode: '382445', phone: '+91 79 2589 1100', whatsapp: '919822233344', rating: 4.9, reviews: 58, verified: true, gstin: '24AABCB1234F1Z8', est: 2008, address: 'Plot 42, GIDC Industrial Estate, Vatva' },
    { id: 'biz-2', name: 'Metro Tech Electronics Pvt Ltd', category: 'Electrical & Electronics', city: 'Bengaluru', state: 'Karnataka', pincode: '560100', phone: '+91 80 4123 9988', whatsapp: '919833344455', rating: 4.7, reviews: 42, verified: true, gstin: '29AADCM4567H1Z2', est: 2014, address: 'Phase 1, Electronic City' },
    { id: 'biz-3', name: 'Vardhman Premium Textiles', category: 'Textiles & Fabrics', city: 'Surat', state: 'Gujarat', pincode: '395002', phone: '+91 261 2456 789', whatsapp: '919822299988', rating: 4.8, reviews: 89, verified: true, gstin: '24AAACV8899K1Z5', est: 2001, address: 'Ring Road Textile Market' },
    { id: 'biz-4', name: 'Shree Krishna Agro Chemicals', category: 'Agriculture & Chemicals', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001', phone: '+91 731 2987 654', whatsapp: '919844455566', rating: 4.6, reviews: 31, verified: true, gstin: '23AABCK9911L1Z0', est: 2016, address: 'Sanwer Road Industrial Area' }
];

let products = [
    { id: 'p1', biz_id: 'biz-1', biz_name: 'Bharat Heavy Machines Ltd.', title: 'Automatic Packaging Machine (High Speed)', wholesale_price: 185000, retail_price: 225000, moq: 1, stock: 15, category: 'Industrial Machinery', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500' },
    { id: 'p2', biz_id: 'biz-2', biz_name: 'Metro Tech Electronics Pvt Ltd', title: 'Industrial 150W LED High Bay Light (IP65)', wholesale_price: 1350, retail_price: 2499, moq: 20, stock: 500, category: 'Electrical & Electronics', img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500' },
    { id: 'p3', biz_id: 'biz-3', biz_name: 'Vardhman Premium Textiles', title: '100% Pure Organic Cotton Fabric (Per Meter)', wholesale_price: 195, retail_price: 380, moq: 100, stock: 5000, category: 'Textiles & Fabrics', img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500' },
    { id: 'p4', biz_id: 'biz-4', biz_name: 'Shree Krishna Agro Chemicals', title: 'Organic Bio-Fertilizer 50Kg Bag', wholesale_price: 650, retail_price: 1100, moq: 50, stock: 1200, category: 'Agriculture & Chemicals', img: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500' }
];

let enquiries = [
    { id: 'enq-101', buyer_name: 'Amit Verma', phone: '+91 98222 33445', product: 'Automatic Packaging Machine', qty: 2, city: 'Delhi', status: 'Quotation Sent', date: 'Today' }
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
            <span class="font-bold text-emerald-700 dark:text-emerald-400">● ${user.name.split(' ')[0]} (${user.role.toUpperCase()})</span>
            <a href="${user.role === 'superadmin' ? '/admin/super' : (user.role === 'admin' ? '/admin' : (user.role === 'seller' ? '/seller' : '/buyer'))}" class="bg-emerald-600 text-white px-2.5 py-1 rounded-md font-bold hover:bg-emerald-700 shadow-sm">Dashboard</a>
            <a href="/logout" class="text-rose-500 font-bold hover:underline">Logout</a>
        </div>
    ` : `
        <div class="flex items-center space-x-2">
            <a href="/login" class="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm">Login / Register</a>
        </div>
    `;

    return `<!DOCTYPE html>
<html lang="en" class="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Business Connect - IndiaMART + Justdial Portal</title>
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
    <!-- Top Announcement Bar -->
    <header class="bg-emerald-900 text-white text-xs py-1.5 px-4 flex justify-between items-center border-b border-emerald-950">
        <div class="flex items-center space-x-3">
            <span>🇮🇳 <b>Business Connect India</b> &bull; IndiaMART + Justdial Portal</span>
        </div>
        <div class="flex items-center space-x-4">
            <span>Toll-Free: <b>1800-200-9898</b></span>
            <span>INR (₹)</span>
        </div>
    </header>

    <!-- Navbar -->
    <nav class="bg-white dark:bg-slate-900 border-b border-emerald-100 dark:border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
            <a href="/" class="flex items-center space-x-2">
                <span class="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow">BC</span>
                <div>
                    <span class="text-xl font-black text-slate-900 dark:text-white leading-none">Business<span class="text-emerald-600">Connect</span></span>
                    <span class="block text-[9px] text-slate-400 font-bold tracking-wider">B2B & B2C INDIA MARKETPLACE</span>
                </div>
            </a>

            <!-- Navigation Links -->
            <div class="flex items-center flex-wrap gap-2 md:gap-3 text-xs font-bold">
                <a href="/" class="hover:text-emerald-600">Home</a>
                <a href="/directory" class="hover:text-emerald-600">Directory</a>
                <a href="/b2b" class="hover:text-emerald-600">B2B Wholesale</a>
                <a href="/marketplace" class="hover:text-emerald-600">Retail</a>
                
                <!-- Free Listing Button -->
                <a href="/list-business" class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition">
                    <i class="fa-solid fa-plus-circle"></i> + Free Listing
                </a>

                <!-- Dark / Light Toggle -->
                <button onclick="toggleTheme()" class="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-amber-400">🌓</button>

                ${authSection}
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow">${content}</main>

    <!-- Professional Footer -->
    <footer class="bg-slate-900 text-slate-400 text-xs py-10 px-4 border-t border-slate-800 mt-12">
        <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
                <h4 class="font-bold text-white mb-2 uppercase text-[11px]">Quick Links</h4>
                <ul class="space-y-1.5">
                    <li><a href="/directory" class="hover:text-emerald-400">Local Directory</a></li>
                    <li><a href="/b2b" class="hover:text-emerald-400">B2B Wholesale</a></li>
                    <li><a href="/list-business" class="hover:text-emerald-400">+ Free Business Listing</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-white mb-2 uppercase text-[11px]">Role Logins</h4>
                <ul class="space-y-1.5">
                    <li><a href="/quick-login?role=superadmin" class="hover:text-emerald-400">👑 Super Admin</a></li>
                    <li><a href="/quick-login?role=admin" class="hover:text-emerald-400">🛡️ Operations Admin</a></li>
                    <li><a href="/quick-login?role=seller" class="hover:text-emerald-400">🏪 Seller Dashboard</a></li>
                    <li><a href="/quick-login?role=buyer" class="hover:text-emerald-400">🛒 Buyer Portal</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-white mb-2 uppercase text-[11px]">Top Cities</h4>
                <ul class="space-y-1.5">
                    <li><a href="/directory?city=Ahmedabad" class="hover:text-emerald-400">Ahmedabad</a></li>
                    <li><a href="/directory?city=Bengaluru" class="hover:text-emerald-400">Bengaluru</a></li>
                    <li><a href="/directory?city=Surat" class="hover:text-emerald-400">Surat</a></li>
                    <li><a href="/directory?city=Indore" class="hover:text-emerald-400">Indore</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-white mb-2 uppercase text-[11px]">Contact & Support</h4>
                <p class="text-[11px] text-slate-400">Email: support@businessconnect.in</p>
                <p class="text-[11px] text-slate-400">Phone: 1800-200-9898</p>
            </div>
        </div>
        <div class="max-w-7xl mx-auto border-t border-slate-800 pt-4 text-center text-[11px]">
            &copy; 2026 Business Connect &bull; Designed for Indian Businesses &bull; Asia/Kolkata
        </div>
    </footer>

    <!-- WhatsApp Support Floating Action -->
    <a href="https://wa.me/919811122233?text=Hello%20Business%20Connect" target="_blank" class="fixed bottom-5 right-5 bg-emerald-600 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-2xl z-50 hover:bg-emerald-700 transition">
        <i class="fa-brands fa-whatsapp"></i>
    </a>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
    const p = url.parse(req.url, true);
    const m = req.method;
    const user = getSession(req);

    // Logout
    if (p.pathname === '/logout') {
        res.writeHead(302, { 'Set-Cookie': 'bc_user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly', 'Location': '/login' });
        return res.end();
    }

    // 1-Click Fast Login
    if (p.pathname === '/quick-login') {
        const role = p.query.role || 'buyer';
        const u = users.find(x => x.role === role) || users[3];
        const dest = role === 'superadmin' ? '/admin/super' : (role === 'admin' ? '/admin' : (role === 'seller' ? '/seller' : '/buyer'));
        res.writeHead(302, { 'Set-Cookie': `bc_user=${encodeURIComponent(JSON.stringify(u))}; Path=/; HttpOnly`, 'Location': dest });
        return res.end();
    }

    // Login Page
    if (p.pathname === '/login') {
        if (m === 'POST') {
            const b = await parseBody(req);
            let u = users.find(x => x.email === b.email);
            if (!u) {
                u = { id: 'u-' + Date.now(), name: b.name || b.email.split('@')[0], email: b.email, role: b.role || 'buyer', phone: b.phone || '+91 98000 00000' };
                users.push(u);
            }
            const dest = u.role === 'superadmin' ? '/admin/super' : (u.role === 'admin' ? '/admin' : (u.role === 'seller' ? '/seller' : '/buyer'));
            res.writeHead(302, { 'Set-Cookie': `bc_user=${encodeURIComponent(JSON.stringify(u))}; Path=/; HttpOnly`, 'Location': dest });
            return res.end();
        }

        const html = layout('Login', `
            <div class="max-w-md mx-auto px-4 py-10">
                <div class="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div class="text-center mb-6">
                        <span class="w-12 h-12 bg-emerald-600 text-white rounded-xl inline-flex items-center justify-center font-bold text-xl mb-2 shadow">BC</span>
                        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Portal Access</h2>
                        <p class="text-xs text-slate-500">Sign in to your role dashboard</p>
                    </div>

                    <div class="p-4 bg-emerald-50 dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-slate-700 mb-6">
                        <p class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">⚡ 1-Click Fast Access:</p>
                        <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                            <a href="/quick-login?role=superadmin" class="bg-emerald-700 text-white p-2 rounded text-center">👑 Super Admin</a>
                            <a href="/quick-login?role=admin" class="bg-teal-700 text-white p-2 rounded text-center">🛡️ Admin</a>
                            <a href="/quick-login?role=seller" class="bg-green-700 text-white p-2 rounded text-center">🏪 Seller</a>
                            <a href="/quick-login?role=buyer" class="bg-emerald-600 text-white p-2 rounded text-center">🛒 Buyer</a>
                        </div>
                    </div>

                    <form method="POST" action="/login" class="space-y-3 text-xs">
                        <div>
                            <label class="block font-bold mb-1">Select Role</label>
                            <select name="role" class="w-full border p-2.5 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                <option value="superadmin">👑 Super Admin</option>
                                <option value="admin">🛡️ Operations Admin</option>
                                <option value="seller">🏪 Seller / Manufacturer</option>
                                <option value="buyer">🛒 Buyer</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Email</label>
                            <input type="email" name="email" value="seller@businessconnect.in" class="w-full border p-2.5 rounded bg-white dark:bg-slate-800" required>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Password</label>
                            <input type="password" name="password" value="demo123" class="w-full border p-2.5 rounded bg-white dark:bg-slate-800" required>
                        </div>
                        <button type="submit" class="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 text-sm shadow">Login to Dashboard</button>
                    </form>
                </div>
            </div>
        `, user);
        res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html);
    }

    // FREE BUSINESS LISTING PAGE
    if (p.pathname === '/list-business') {
        if (m === 'POST') {
            const b = await parseBody(req);
            const newBiz = {
                id: 'biz-' + Date.now(),
                name: b.name || 'New Business',
                category: b.category || 'General Business',
                city: b.city || 'India',
                state: b.state || '',
                pincode: b.pincode || '',
                phone: b.phone || '+91 98000 00000',
                whatsapp: (b.whatsapp || b.phone || '919800000000').replace(/[^0-9]/g, ''),
                rating: 5.0,
                reviews: 1,
                verified: true,
                gstin: b.gstin || '24AAACT1234K1Z1',
                est: Number(b.est || 2024),
                address: b.address || 'India'
            };
            businesses.unshift(newBiz);
            
            const html = layout('Listing Submitted', `
                <div class="max-w-md mx-auto px-4 py-16 text-center">
                    <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900 dark:text-white">Business Listed Successfully!</h2>
                    <p class="text-xs text-slate-500 mt-2">Your company <b>"${newBiz.name}"</b> is now live in Business Connect Directory.</p>
                    <div class="mt-6 flex justify-center gap-3">
                        <a href="/directory" class="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-xs">View in Directory</a>
                        <a href="/seller" class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-4 py-2 rounded-lg text-xs">Open Seller Panel</a>
                    </div>
                </div>
            `, user);
            res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html);
        }

        const html = layout('Free Business Listing', `
            <div class="max-w-2xl mx-auto px-4 py-8">
                <div class="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
                    <h1 class="text-2xl font-black text-slate-900 dark:text-white mb-1">List Your Business for FREE</h1>
                    <p class="text-xs text-slate-500 mb-6">Get listed on IndiaMART wholesale & Justdial local directory in 2 minutes</p>

                    <form method="POST" action="/list-business" class="space-y-4 text-xs">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-1">Company / Business Name *</label>
                                <input type="text" name="name" required placeholder="e.g. Maruti Precision Tools Ltd." class="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-800">
                            </div>
                            <div>
                                <label class="block font-bold mb-1">Business Category *</label>
                                <select name="category" class="w-full border p-2.5 roun
