const http = require('node:http');
const url = require('node:url');

// In-Memory Data Store (Works on Node 18, 20, 22, 24 with 0 external dependencies)
let users = [
    { id: 'u-1', name: 'Ramesh Patel (Super Admin)', email: 'superadmin@businessconnect.in', role: 'superadmin', phone: '+91 98111 00001' },
    { id: 'u-2', name: 'Priya Sharma (Admin)', email: 'admin@businessconnect.in', role: 'admin', phone: '+91 98111 00002' },
    { id: 'u-3', name: 'Vikram Singh (Seller)', email: 'seller@businessconnect.in', role: 'seller', company: 'Bharat Heavy Machines Ltd.', phone: '+91 79 2589 1100' },
    { id: 'u-4', name: 'Amit Verma (Buyer)', email: 'buyer@businessconnect.in', role: 'buyer', company: 'Verma Trading Co.', phone: '+91 98222 33445' }
];

let businesses = [
    { id: 'biz-1', business_name: 'Bharat Heavy Machines Ltd.', category: 'Industrial Machinery', city: 'Ahmedabad', phone: '+91 79 2589 1100', whatsapp: '919822233344', rating: 4.9, reviews: 58, verified: 1, gstin: '24AABCB1234F1Z8' },
    { id: 'biz-2', business_name: 'Metro Tech Electronics Pvt Ltd', category: 'Electrical & Electronics', city: 'Bengaluru', phone: '+91 80 4123 9988', whatsapp: '919833344455', rating: 4.7, reviews: 42, verified: 1, gstin: '29AADCM4567H1Z2' },
    { id: 'biz-3', business_name: 'Vardhman Premium Textiles', category: 'Textiles & Fabrics', city: 'Surat', phone: '+91 261 2456 789', whatsapp: '919822299988', rating: 4.8, reviews: 89, verified: 1, gstin: '24AAACV8899K1Z5' }
];

let products = [
    { id: 'p1', business_id: 'biz-1', business_name: 'Bharat Heavy Machines Ltd.', title: 'Automatic Packaging Machine', wholesale_price: 185000, retail_price: 225000, moq: 1, stock: 15, category: 'Industrial Machinery', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500' },
    { id: 'p2', business_id: 'biz-2', business_name: 'Metro Tech Electronics Pvt Ltd', title: 'Industrial 150W LED High Bay Light', wholesale_price: 1350, retail_price: 2499, moq: 20, stock: 500, category: 'Electrical & Electronics', img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500' },
    { id: 'p3', business_id: 'biz-3', business_name: 'Vardhman Premium Textiles', title: '100% Pure Organic Cotton Fabric', wholesale_price: 195, retail_price: 380, moq: 100, stock: 5000, category: 'Textiles & Fabrics', img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500' }
];

let enquiries = [
    { id: 'enq-101', buyer_name: 'Amit Verma', buyer_phone: '+91 98222 33445', product_title: 'Automatic Packaging Machine', business_id: 'biz-1', quantity: 2, city: 'Delhi', status: 'Quotation Sent' }
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
    if (role === 'superadmin') return '<span class="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-300">👑 Super Admin</span>';
    if (role === 'admin') return '<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300">🛡️ Admin</span>';
    if (role === 'seller') return '<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">🏪 Seller</span>';
    return '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300">🛒 Buyer</span>';
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
                <a href="${dashboardUrl(user.role)}" class="text-xs font-bold text-slate-800 hover:text-blue-700 flex items-center gap-1">
                    ${roleBadge(user.role)}
                    <span class="hidden sm:inline">${user.name}</span>
                </a>
                <a href="${dashboardUrl(user.role)}" class="bg-blue-700 text-white text-xs px-2.5 py-1 rounded font-bold hover:bg-blue-800">Dashboard</a>
                <a href="/logout" class="text-xs text-rose-600 font-bold hover:underline">Logout</a>
            </div>
        `;
    } else {
        authNav = `
            <div class="flex items-center space-x-2">
                <a href="/login" class="bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-800 shadow-sm flex items-center gap-1">
                    <i class="fa-solid fa-user-lock"></i> Login / Register
                </a>
            </div>
        `;
    }

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
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
            <div class="flex items-center flex-wrap gap-3 text-xs font-bold text-slate-700">
                <a href="/" class="hover:text-blue-700">Home</a>
                <a href="/directory" class="hover:text-blue-700">Directory</a>
                <a href="/b2b" class="hover:text-blue-700">B2B Wholesale</a>
                <a href="/marketplace" class="hover:text-blue-700">Retail</a>
                ${authNav}
            </div>
        </div>
    </nav>
    <main class="flex-1">${content}</main>
    <footer class="bg-[#0a1128] text-slate-400 text-xs py-8 px-4 border-t border-slate-800 mt-12 text-center">
        <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-4 text-left">
            <div>
                <h4 class="text-white font-bold text-sm mb-1">Business Connect India</h4>
                <p class="text-[11px] text-slate-400 max-w-sm">Connecting Manufacturers, Wholesalers, Retailers, and Buyers across 500+ Indian industrial clusters.</p>
            </div>
            <div class="flex space-x-4 text-xs">
                <a href="/login?role=superadmin" class="hover:text-white">Super Admin Portal</a>
                <a href="/login?role=admin" class="hover:text-white">Admin Portal</a>
                <a href="/login?role=seller" class="hover:text-white">Seller Login</a>
                <a href="/login?role=buyer" class="hover:text-white">Buyer Login</a>
            </div>
        </div>
        <p class="border-t border-slate-800 pt-4">&copy; 2026 Business Connect Technologies India Pvt Ltd. Make in India 🇮🇳 &bull; GST & MSME Compliant</p>
    </footer>
    <a href="https://wa.me/919811122233" target="_blank" class="fixed bottom-5 right-5 bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-2xl z-50"><i class="fa-brands fa-whatsapp"></i></a>
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

    // 1-CLICK INSTANT LOGIN HANDLER (Mobile Friendly)
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
                <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
                    <div class="text-center mb-6">
                        <span class="w-12 h-12 bg-blue-700 text-white rounded-xl inline-flex items-center justify-center font-bold text-xl mb-2">BC</span>
                        <h2 class="text-2xl font-extrabold text-slate-900">Portal Login</h2>
                        <p class="text-xs text-slate-500 mt-1">Select your role to access dashboard</p>
                    </div>

                    <!-- 1-Click Fast Mobile Access -->
                    <div class="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span class="text-xs font-bold text-slate-700 block mb-2.5"><i class="fa-solid fa-bolt text-amber-500 mr-1"></i> Quick 1-Click Login (Mobile Shortcut):</span>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <a href="/quick-login?role=superadmin" class="bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">
                                👑 Super Admin
                            </a>
                            <a href="/quick-login?role=admin" class="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">
                                🛡️ Admin
                            </a>
                            <a href="/quick-login?role=seller" class="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">
                                🏪 Seller
                            </a>
                            <a href="/quick-login?role=buyer" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1 shadow-sm">
                                🛒 Buyer
                            </a>
                        </div>
                    </div>

                    <div class="relative flex py-2 items-center mb-4">
                        <div class="flex-grow border-t border-slate-200"></div>
                        <span class="flex-shrink mx-2 text-slate-400 text-xs font-semibold">Or Login with Password</span>
                        <div class="flex-grow border-t border-slate-200"></div>
                    </div>

                    <form method="POST" action="/login" class="space-y-4 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Select Role</label>
                            <select name="role" class="w-full border border-slate-300 rounded-lg p-2.5 font-medium outline-none focus:border-blue-600 bg-white">
                                <option value="superadmin" ${preselectRole === 'superadmin' ? 'selected' : ''}>👑 Super Admin (Full Control)</option>
                                <option value="admin" ${preselectRole === 'admin' ? 'selected' : ''}>🛡️ Admin (Operations & Approvals)</option>
                                <option value="seller" ${preselectRole === 'seller' ? 'selected' : ''}>🏪 Seller (Supplier / Manufacturer)</option>
                                <option value="buyer" ${preselectRole === 'buyer' || !preselectRole ? 'selected' : ''}>🛒 Buyer (Wholesale & Retail)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Email Address</label>
                            <input type="email" name="email" required placeholder="name@businessconnect.in" value="${preselectRole ? preselectRole + '@businessconnect.in' : 'seller@businessconnect.in'}" class="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Password</label>
                            <input type="password" name="password" required value="demo123" class="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-600">
                            <span class="text-[10px] text-slate-400 mt-1 block">Default demo password: <b>demo123</b></span>
                        </div>
                        <button type="submit" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-sm shadow">
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

        // Action: Toggle verification
        if (p.query.toggle_verify) {
            const biz = businesses.find(b => b.id === p.query.toggle_verify);
            if (biz) biz.verified = biz.verified ? 0 : 1;
            res.writeHead(302, { Location: '/admin/super' });
            return res.end();
        }

        const html = layout('Super Admin Dashboard', `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="bg-purple-100 text-purple-800 font-extrabold text-xs px-2.5 py-1 rounded-md border border-purple-300">👑 Super Admin Master Panel</span>
                            <span class="text-xs text-slate-500">${user.name}</span>
                        </div>
                        <h1 class="text-2xl font-black text-slate-900 mt-1">Platform Master Administration</h1>
                    </div>
                    <div class="flex gap-2">
                        <a href="/admin" class="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700">Open Admin Panel</a>
                        <a href="/logout" class="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-lg hover:bg-rose-100">Logout</a>
                    </div>
                </div>

                <!-- Platform KPI Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <span class="text-xs text-slate-500 block">Total Revenue (INR)</span>
                        <span class="text-xl font-black text-emerald-700">₹4,82,500</span>
                        <span class="text-[10px] text-emerald-600 block mt-1"><i class="fa-solid fa-arrow-trend-up"></i> +18.4% this month</span>
                    </div>
                    <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <span class="text-xs text-slate-500 block">Registered Users</span>
                        <span class="text-xl font-black text-blue-700">${users.length} Active</span>
                        <span class="text-[10px] text-slate-400 block mt-1">Super, Admin, Sellers, Buyers</span>
                    </div>
                    <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <span class="text-xs text-slate-500 block">Listed Businesses</span>
                        <span class="text-xl font-black text-slate-900">${businesses.length} Companies</span>
                        <span class="text-[10px] text-emerald-600 block mt-1">${businesses.filter(b => b.verified).length} Verified</span>
                    </div>
                    <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <span class="text-xs text-slate-500 block">Total RFQs & Leads</span>
                        <span class="text-xl font-black text-amber-600">${enquiries.length} Enquiries</span>
                        <span class="text-[10px] text-slate-400 block mt-1">100% routing rate</span>
                    </div>
                </div>

                <!-- Business Moderation & Verification -->
                <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-8">
                    <h3 class="font-bold text-sm text-slate-900 mb-4 flex items-center justify-between">
                        <span>🏢 Business Directory & Verification Control</span>
                        <span class="text-xs text-slate-400 font-normal">Instant Toggle</span>
                    </h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200
