const http = require('node:http');
const url = require('node:url');

// 1. In-Memory Data Store (Works on Node 18, 20, 22+ with 0 external dependencies)
let users = [
    { id: 'u-1', name: 'Ramesh Patel (Super Admin)', email: 'superadmin@businessconnect.in', role: 'superadmin', phone: '+91 98111 00001' },
    { id: 'u-2', name: 'Priya Sharma (Admin)', email: 'admin@businessconnect.in', role: 'admin', phone: '+91 98111 00002' },
    { id: 'u-3', name: 'Vikram Singh (Seller)', email: 'seller@businessconnect.in', role: 'seller', company: 'Bharat Heavy Machines Ltd.', phone: '+91 79 2589 1100' },
    { id: 'u-4', name: 'Amit Verma (Buyer)', email: 'buyer@businessconnect.in', role: 'buyer', company: 'Verma Trading Co.', phone: '+91 98222 33445' }
];

let businesses = [
    { id: 'biz-1', business_name: 'Bharat Heavy Machines Ltd.', category: 'Industrial Machinery', city: 'Ahmedabad', state: 'Gujarat', phone: '+91 79 2589 1100', whatsapp: '919822233344', rating: 4.9, reviews: 58, verified: 1, gstin: '24AABCB1234F1Z8', address: 'Plot 42, GIDC Vatva Industrial Estate' },
    { id: 'biz-2', business_name: 'Metro Tech Electronics Pvt Ltd', category: 'Electrical & Electronics', city: 'Bengaluru', state: 'Karnataka', phone: '+91 80 4123 9988', whatsapp: '919833344455', rating: 4.7, reviews: 42, verified: 1, gstin: '29AADCM4567H1Z2', address: 'Phase 1, Electronic City' },
    { id: 'biz-3', business_name: 'Vardhman Premium Textiles', category: 'Textiles & Fabrics', city: 'Surat', state: 'Gujarat', phone: '+91 261 2456 789', whatsapp: '919822299988', rating: 4.8, reviews: 89, verified: 1, gstin: '24AAACV8899K1Z5', address: 'Ring Road Textile Market' }
];

let products = [
    { id: 'p1', business_id: 'biz-1', business_name: 'Bharat Heavy Machines Ltd.', title: 'Automatic Packaging Machine', wholesale_price: 185000, retail_price: 225000, moq: 1, stock: 15, category: 'Industrial Machinery', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500' },
    { id: 'p2', business_id: 'biz-2', business_name: 'Metro Tech Electronics Pvt Ltd', title: 'Industrial 150W LED High Bay Light', wholesale_price: 1350, retail_price: 2499, moq: 20, stock: 500, category: 'Electrical & Electronics', img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500' },
    { id: 'p3', business_id: 'biz-3', business_name: 'Vardhman Premium Textiles', title: '100% Pure Organic Cotton Fabric', wholesale_price: 195, retail_price: 380, moq: 100, stock: 5000, category: 'Textiles & Fabrics', img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500' }
];

let enquiries = [
    { id: 'enq-101', buyer_name: 'Amit Verma', buyer_phone: '+91 98222 33445', product_title: 'Automatic Packaging Machine', business_id: 'biz-1', quantity: 2, city: 'Delhi', status: 'Quotation Sent' }
];

let cart = [
    { id: 'p2', title: 'Industrial 150W LED High Bay Light', price: 1350, qty: 5, img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500' }
];

function parseBody(req) {
    return new Promise(res => {
        let b = ''; req.on('data', c => b += c);
        req.on('end', () => {
            try {
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(b);
                    const obj = {};
                    for (const [k, v] of params.entries()) obj[k] = v;
                    return res(obj);
                }
                res(JSON.parse(b));
            } catch {
                const params = new URLSearchParams(b);
                const obj = {};
                for (const [k, v] of params.entries()) obj[k] = v;
                res(obj);
            }
        });
    });
}

function getSession(req) {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('bc_user='));
    if (match) {
        try {
            return JSON.parse(decodeURIComponent(match.split('=')[1]));
        } catch {
            return null;
        }
    }
    return null;
}

function roleBadge(role) {
    if (role === 'superadmin') return '<span class="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400">👑 Super Admin</span>';
    if (role === 'admin') return '<span class="bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-400">🛡️ Admin</span>';
    if (role === 'seller') return '<span class="bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-300 text-[10px] font-bold px-2 py-0.5 rounded border border-green-400">🏪 Seller</span>';
    return '<span class="bg-lime-100 dark:bg-lime-900/60 text-lime-800 dark:text-lime-300 text-[10px] font-bold px-2 py-0.5 rounded border border-lime-400">🛒 Buyer</span>';
}

function dashboardUrl(role) {
    if (role === 'superadmin') return '/admin/super';
    if (role === 'admin') return '/admin';
    if (role === 'seller') return '/seller';
    return '/buyer';
}

function layout(title, content, user = null) {
    let authNav = '';
    if (user) {
        authNav = `
            <div class="flex items-center space-x-2">
                <a href="${dashboardUrl(user.role)}" class="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 flex items-center gap-1">
                    ${roleBadge(user.role)}
                    <span class="hidden sm:inline">${user.name}</span>
                </a>
                <a href="${dashboardUrl(user.role)}" class="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-700 shadow-sm">Dashboard</a>
                <a href="/logout" class="text-xs text-rose-500 font-bold hover:underline">Logout</a>
            </div>
        `;
    } else {
        authNav = `
            <div class="flex items-center space-x-2">
                <a href="/login" class="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-1">
                    <i class="fa-solid fa-user-lock"></i> Login / Register
                </a>
            </div>
        `;
    }

    return `<!DOCTYPE html><html lang="en" class="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} | Business Connect India</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' }
                    }
                }
            }
        }
    </script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script>
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        function toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon();
        }
        function updateThemeIcon() {
            const btn = document.getElementById('theme-toggle-icon');
            if (btn) {
                btn.className = document.documentElement.classList.contains('dark') ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-emerald-700';
            }
        }
        window.addEventListener('DOMContentLoaded', updateThemeIcon);
    </script>
    </head><body class="bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased flex flex-col min-h-screen transition-colors duration-200">
    
    <!-- Top Bar -->
    <header class="bg-emerald-800 dark:bg-slate-900 text-white py-1.5 px-4 text-xs border-b border-emerald-900 dark:border-slate-800">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <span>🇮🇳 <b>Business Connect India</b> &bull; White & Green B2B/B2C Marketplace</span>
            <span>Toll-Free: 1800-200-9898 &bull; INR (₹)</span>
        </div>
    </header>

    <!-- Main Navigation -->
    <nav class="bg-white dark:bg-slate-900 border-b border-emerald-100 dark:border-slate-800 sticky top-0 z-40 shadow-sm px-4 py-3">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <a href="/" class="flex items-center space-x-2">
                <span class="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">BC</span>
                <span class="text-xl font-extrabold text-slate-900 dark:text-white">Business<span class="text-emerald-600">Connect</span></span>
            </a>
            
            <div class="flex items-center flex-wrap gap-2 sm:gap-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                <a href="/" class="hover:text-emerald-600">Home</a>
                <a href="/directory" class="hover:text-emerald-600">Directory</a>
                <a href="/b2b" class="hover:text-emerald-600">B2B Wholesale</a>
                <a href="/marketplace" class="hover:text-emerald-600">Retail</a>
                <a href="/list-business" class="bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-lg hover:bg-emerald-100 flex items-center gap-1 font-bold"><i class="fa-solid fa-plus-circle"></i> + List Business</a>
                <a href="/cart" class="hover:text-emerald-600 flex items-center gap-1"><i class="fa-solid fa-cart-shopping"></i> Cart (${cart.length})</a>
                
                <!-- Dark / Light Mode Toggle Button -->
                <button onclick="toggleTheme()" type="button" title="Switch Light/Dark Mode" class="p-2 rounded-lg bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-emerald-200 dark:border-slate-700 transition">
                    <i id="theme-toggle-icon" class="fa-solid fa-moon text-emerald-700"></i>
                </button>

                ${authNav}
            </div>
        </div>
    </nav>

    <main class="flex-1">${content}</main>

    <!-- Footer -->
    <footer class="bg-emerald-950 dark:bg-slate-950 text-emerald-100/70 dark:text-slate-400 text-xs py-8 px-4 border-t border-emerald-900 dark:border-slate-800 mt-12 text-center">
        <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-4 text-left">
            <div>
                <h4 class="text-white font-bold text-sm mb-1 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Business Connect India
                </h4>
                <p class="text-[11px] text-emerald-200/60 dark:text-slate-400 max-w-sm">Leading Indian B2B & B2C Business Portal & Wholesale Network across 500+ industrial hubs.</p>
            </div>
            <div class="flex flex-wrap gap-4 text-xs font-semibold">
                <a href="/login?role=superadmin" class="hover:text-white">👑 Super Admin</a>
                <a href="/login?role=admin" class="hover:text-white">🛡️ Admin</a>
                <a href="/login?role=seller" class="hover:text-white">🏪 Seller</a>
                <a href="/login?role=buyer" class="hover:text-white">🛒 Buyer</a>
            </div>
        </div>
        <p class="border-t border-emerald-900/60 dark:border-slate-800 pt-4">&copy; 2026 Business Connect Technologies India Pvt Ltd. Make in India 🇮🇳 &bull; GST & MSME Compliant</p>
    </footer>

    <!-- WhatsApp Floating Action -->
    <a href="https://wa.me/919811122233" target="_blank" class="fixed bottom-5 right-5 bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-2xl z-50 transition transform hover:scale-105"><i class="fa-brands fa-whatsapp"></i></a>
    </body></html>`;
}

const server = http.createServer(async (req, res) => {
    const p = url.parse(req.url, true);
    const m = req.method;
    const user = getSession(req);

    // LOGOUT
    if (p.pathname === '/logout') {
        res.writeHead(302, {
            'Set-Cookie': 'bc_user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
            'Location': '/login'
        });
        return res.end();
    }

    // 1-CLICK INSTANT LOGIN HANDLER
    if (p.pathname === '/quick-login') {
        const targetRole = p.query.role || 'buyer';
        const found = users.find(u => u.role === targetRole) || users[3];
        res.writeHead(302, {
            'Set-Cookie': `bc_user=${encodeURIComponent(JSON.stringify(found))}; Path=/; HttpOnly`,
            'Location': dashboardUrl(found.role)
        });
        return res.end();
    }

    // FORM LOGIN / REGISTER
    if (p.pathname === '/login') {
        if (m === 'POST') {
            const body = await parseBody(req);
            let foundUser = users.find(u => u.email === body.email);
            if (!foundUser) {
                foundUser = {
                    id: 'u-' + Date.now(),
                    name: body.name || body.email.split('@')[0],
                    email: body.email,
                    role: body.role || 'buyer',
                    company: body.company || 'Business Co.',
                    phone: body.phone || '+91 9800000000'
                };
                users.push(foundUser);
            }
            res.writeHead(302, {
                'Set-Cookie': `bc_user=${encodeURIComponent(JSON.stringify(foundUser))}; Path=/; HttpOnly`,
                'Location': dashboardUrl(foundUser.role)
            });
            return res.end();
        }

        const preselectRole = p.query.role || '';
        const html = layout('Login & Register', `
            <div class="max-w-md mx-auto px-4 py-10">
                <div class="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl p-6 shadow-md">
                    <div class="text-center mb-6">
                        <span class="w-12 h-12 bg-emerald-600 text-white rounded-xl inline-flex items-center justify-center font-bold text-xl mb-2 shadow">BC</span>
                        <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white">Portal Login</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Select your role to access dashboard</p>
                    </div>

                    <!-- 1-Click Fast Mobile Access -->
                    <div class="mb-6 p-4 bg-emerald-50/60 dark:bg-slate-800/60 rounded-xl border border-emerald-200 dark:border-slate-700">
                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2.5"><i class="fa-solid fa-bolt text-amber-500 mr-1"></i> Quick 1-Click Login (Mobile Shortcut):</span>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <a href="/quick-login?role=superadmin" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">👑 Super Admin</a>
                            <a href="/quick-login?role=admin" class="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">🛡️ Admin</a>
                            <a href="/quick-login?role=seller" class="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">🏪 Seller</a>
                            <a href="/quick-login?role=buyer" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">🛒 Buyer</a>
                        </div>
                    </div>

                    <div class="relative flex py-2 items-center mb-4">
                        <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                        <span class="flex-shrink mx-2 text-slate-400 text-xs font-semibold">Or Login with Password</span>
                        <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    </div>

                    <form method="POST" action="/login" class="space-y-4 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Role</label>
                            <select name="role" class="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                <option value="superadmin" ${preselectRole === 'superadmin' ? 'selected' : ''}>👑 Super Admin (Full Control)</option>
                                <option value="admin" ${preselectRole === 'admin' ? 'selected' : ''}>🛡️ Admin (Operations & Approvals)</option>
                                <option value="seller" ${preselectRole === 'seller' ? 'selected' : ''}>🏪 Seller (Supplier / Manufacturer)</option>
                                <option value="buyer" ${preselectRole === 'buyer' || !preselectRole ? 'selected' : ''}>🛒 Buyer (Wholesale & Retail)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input type="email" name="email" required placeholder="name@businessconnect.in" value="${preselectRole ? preselectRole + '@businessconnect.in' : 'seller@businessconnect.in'}" class="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-emerald-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <input type="password" name="password" required value="demo123" class="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-emerald-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                            <span class="text-[10px] text-slate-400 mt-1 block">Default demo password: <b>demo123</b></span>
                        </div>
                        <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-sm shadow">
                            Sign In to Portal
                        </button>
                    </form>
                </div>
            </div>
        `, user);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    // SUPER ADMIN DASHBOARD
    if (p.pathname === '/admin/super') {
        if (!user || user.role !== 'superadmin') {
            res.writeHead(302, { Location: '/login?role=superadmin' });
            return res.end();
        }

        if (p.query.toggle_verify) {
            const biz = businesses.find(b => b.id === p.query.toggle_verify);
            if (biz) biz.verified = biz.verified ? 0 : 1;
            res.writeHead(302, { Location: '/admin/super' });
            return res.end();
        }

        const html = layout('Super Admin Dashboard', `
 
