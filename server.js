const http = require('node:http');
const crypto = require('node:crypto');
const ROLES = ['super_admin', 'admin', 'merchant', 'supplier', 'seller', 'buyer'];
const ADMIN_ROLES = ['super_admin', 'admin'];
const VENDOR_ROLES = ['merchant', 'supplier', 'seller'];
const SELF_REGISTER_ROLES = ['buyer', ...VENDOR_ROLES];
const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', merchant: 'Merchant', supplier: 'Supplier', seller: 'Seller', buyer: 'Buyer' };

const uid = p => p + '-' + crypto.randomBytes(4).toString('hex');
const now = () => new Date().toISOString();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isAdmin = u => !!u && ADMIN_ROLES.includes(u.role);
const isVendor = u => !!u && VENDOR_ROLES.includes(u.role);

function hashPw(pw, salt = crypto.randomBytes(16).toString('hex')) {
    return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
function checkPw(pw, stored) {
    const [salt, h] = String(stored).split(':');
    const a = crypto.scryptSync(pw, salt, 64), b = Buffer.from(h, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const locations = [
    { id: 'loc-1', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001', status: 'active' },
    { id: 'loc-2', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', status: 'active' },
    { id: 'loc-3', city: 'Surat', state: 'Gujarat', pincode: '395003', status: 'active' },
    { id: 'loc-4', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', status: 'active' },
    { id: 'loc-5', city: 'Delhi', state: 'Delhi', pincode: '110001', status: 'active' }
];

const businesses = [
    { id: 'biz-1', business_name: 'Bharat Heavy Machines Ltd.', category: 'Industrial Machinery', location_id: 'loc-1', phone: '+91 79 2589 1100', whatsapp: '919822233344', rating: 4.9, reviews: 58, verified: 1, gstin: '24AABCB1234F1Z8', status: 'active' },
    { id: 'biz-2', business_name: 'Metro Tech Electronics Pvt Ltd', category: 'Electrical & Electronics', location_id: 'loc-2', phone: '+91 80 4123 9988', whatsapp: '919833344455', rating: 4.7, reviews: 42, verified: 1, gstin: '29AADCM4567H1Z2', status: 'active' },
    { id: 'biz-3', business_name: 'Vardhman Premium Textiles', category: 'Textiles & Fabrics', location_id: 'loc-3', phone: '+91 261 2456 789', whatsapp: '919822299988', rating: 4.8, reviews: 89, verified: 1, gstin: '24AAACV8899K1Z5', status: 'active' }
];

const products = [
    { id: 'p1', business_id: 'biz-1', title: 'Automatic Packaging Machine', category: 'Machinery', wholesale_price: 185000, retail_price: 225000, moq: 1, stock: 15, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500', status: 'active' },
    { id: 'p2', business_id: 'biz-2', title: 'Industrial 150W LED High Bay Light', category: 'Lighting', wholesale_price: 1350, retail_price: 2499, moq: 20, stock: 500, img: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500', status: 'active' },
    { id: 'p3', business_id: 'biz-3', title: '100% Pure Organic Cotton Fabric', category: 'Fabric', wholesale_price: 195, retail_price: 380, moq: 100, stock: 5000, img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500', status: 'active' }
];

const enquiries = [];
const users = [];
const sessions = new Map(); // sid -> { uid, exp }

(function seedUsers() {
    const superEmail = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@businessconnect.in').toLowerCase();
    const superPw = process.env.SUPER_ADMIN_PASSWORD || 'Super@12345';
    const mk = (role, name, email, pw, extra = {}) => users.push({
        id: uid('usr'), name, email, phone: '', role, status: 'active', location_id: 'loc-4',
        business_id: null, password_hash: hashPw(pw), created_at: now(), ...extra
    });
    mk('super_admin', 'Super Admin', superEmail, superPw);
    console.log(`[seed] Super admin: ${superEmail} / ${process.env.SUPER_ADMIN_PASSWORD ? '(from env)' : superPw}`);
    if (process.env.DEMO_DATA === '0') return;
    const demo = 'Demo@12345';
    mk('admin', 'Demo Admin', 'admin@businessconnect.in', demo);
    mk('buyer', 'Demo Buyer', 'buyer@businessconnect.in', demo);
    mk('supplier', 'Bharat Heavy Supplier', 'supplier@businessconnect.in', demo, { business_id: 'biz-1', location_id: 'loc-1' });
    mk('merchant', 'Metro Tech Merchant', 'merchant@businessconnect.in', demo, { business_id: 'biz-2', location_id: 'loc-2' });
    mk('seller', 'Vardhman Seller', 'seller@businessconnect.in', demo, { business_id: 'biz-3', location_id: 'loc-3' });
    console.log(`[seed] Demo accounts (admin/buyer/supplier/merchant/seller @businessconnect.in) password: ${demo}`);
    console.log('[seed] Change these before going live (set DEMO_DATA=0 to skip demo users).');
})();
const fs = require('node:fs');
const path = require('node:path');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const COLLECTIONS = { users, locations, businesses, products, enquiries };

function loadData() {
    try {
        const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        for (const [k, arr] of Object.entries(COLLECTIONS)) if (Array.isArray(d[k])) arr.splice(0, arr.length, ...d[k]);
        sessions.clear();
        for (const [sid, s] of d.sessions || []) if (s.exp > Date.now()) sessions.set(sid, s);
        console.log(`[data] Loaded ${users.length} users from ${DATA_FILE}`);
    } catch (e) {
        if (e.code !== 'ENOENT') console.error('[data] Could not read data file, starting with seed data:', e.message);
    }
}
let saveTimer = null;
function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    try {
        const out = { sessions: [...sessions.entries()] };
        for (const [k, arr] of Object.entries(COLLECTIONS)) out[k] = arr;
        const tmp = DATA_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(out), { mode: 0o600 });
        fs.renameSync(tmp, DATA_FILE);
    } catch (e) { console.error('[data] Save failed:', e.message); }
}
const saveSoon = () => { if (!saveTimer) saveTimer = setTimeout(saveNow, 300); };
loadData();
process.on('SIGTERM', () => { saveNow(); process.exit(0); });
process.on('SIGINT', () => { saveNow(); process.exit(0); });
const bad =(msg, status = 400) => Object.assign(new Error(msg), { status });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s-]{7,18}$/;

const S = {
    location: {
        city: { req: 1, max: 60 }, state: { req: 1, max: 60 },
        pincode: { re: /^\d{6}$/ }, status: { vals: ['active', 'inactive'] }
    },
    user: {
        name: { req: 1, max: 80 }, email: { req: 1, max: 120, re: EMAIL_RE, lower: 1 },
        phone: { re: PHONE_RE }, role: { vals: ROLES },
        status: { vals: ['active', 'pending', 'blocked'] }, location_id: {}
    },
    business: {
        business_name: { req: 1, max: 100 }, category: { req: 1, max: 60 }, location_id: {},
        phone: { re: PHONE_RE }, whatsapp: { re: /^\d{10,15}$/ },
        gstin: { re: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, upper: 1 }
    },
    businessAdmin: {
        status: { vals: ['active', 'pending', 'blocked'] },
        verified: { t: 'n', min: 0, max: 1, int: 1 }
    },
    product: {
        title: { req: 1, max: 120 }, category: { max: 60 },
        wholesale_price: { t: 'n', req: 1, min: 0, max: 1e9 }, retail_price: { t: 'n', req: 1, min: 0, max: 1e9 },
        moq: { t: 'n', req: 1, min: 1, max: 1e7, int: 1 }, stock: { t: 'n', req: 1, min: 0, max: 1e9, int: 1 },
        img: { max: 500, url: 1 }, status: { vals: ['active', 'inactive'] }
    },
    enquiry: {
        buyer_name: { req: 1, max: 80 }, buyer_phone: { req: 1, re: PHONE_RE }, product_id: { req: 1 },
        quantity: { t: 'n', req: 1, min: 1, max: 1e8, int: 1 }, city: { max: 60 }, requirements: { max: 500 }
    }
};

function clean(schema, input, partial) {
    const out = {};
    for (const [k, r] of Object.entries(schema)) {
        if (!(k in input)) { if (!partial && r.req) throw bad(`${k.replace(/_/g, ' ')} is required`); continue; }
        let v = input[k];
        if (r.t === 'n') {
            if (v === '' || v === null || v === undefined) { if (r.req) throw bad(`${k.replace(/_/g, ' ')} is required`); continue; }
            v = Number(v);
            if (!Number.isFinite(v) || (r.int && !Number.isInteger(v)) || (r.min !== undefined && v < r.min) || (r.max !== undefined && v > r.max)) throw bad(`${k.replace(/_/g, ' ')} is invalid`);
            out[k] = v; continue;
        }
        v = String(v ?? '').trim();
        if (r.lower) v = v.toLowerCase();
        if (r.upper) v = v.toUpperCase();
        if (!v) { if (r.req) throw bad(`${k.replace(/_/g, ' ')} is required`); out[k] = ''; continue; }
        if ((r.max && v.length > r.max) || (r.vals && !r.vals.includes(v)) || (r.re && !r.re.test(v)) || (r.url && !/^https?:\/\//i.test(v)))
            throw bad(`${k.replace(/_/g, ' ')} is invalid`);
        out[k] = v;
    }
    return out;
}
const findLoc = id => locations.find(l => l.id === id);
const findBiz = id => businesses.find(b => b.id === id);
const cityOf = id => (findLoc(id) || {}).city || '';
const checkLocation = d => {
    if ('location_id' in d) { if (d.location_id && !findLoc(d.location_id)) throw bad('Unknown location'); if (!d.location_id) d.location_id = null; }
};

const outLoc = l => l;
const outUser = u => {
    const { password_hash, ...rest } = u;
    const l = findLoc(u.location_id), b = findBiz(u.business_id);
    return { ...rest, city: l ? `${l.city}, ${l.state}` : '', business_name: b ? b.business_name : '' };
};
const outBiz = b => { const l = findLoc(b.location_id); return { ...b, city: l ? `${l.city}, ${l.state}` : '' }; };
const outProd = p => { const b = findBiz(p.business_id); return { ...p, business_name: b ? b.business_name : '' }; };
const outEnq = e => {
    const p = products.find(x => x.id === e.product_id), b = findBiz(e.business_id);
    return { ...e, product_title: p ? p.title : '(deleted product)', business_name: b ? b.business_name : '' };
};

function canManageUser(actor, t) {
    if (actor.role === 'super_admin') return true;
    if (actor.role === 'admin') return !ADMIN_ROLES.includes(t.role);
    return false;
}
const canAssignRole = (actor, role) => actor.role === 'super_admin' ? ROLES.includes(role) : (actor.role === 'admin' && !ADMIN_ROLES.includes(role) && ROLES.includes(role));

function createBusiness(owner, d) {
    const b = {
        id: uid('biz'), business_name: d.business_name, category: d.category || 'General',
        location_id: owner.location_id || null, phone: owner.phone || '', whatsapp: '', rating: 0, reviews: 0,
        verified: 0, gstin: d.gstin || '', status: owner.status === 'active' ? 'active' : 'pending'
    };
    businesses.push(b);
    owner.business_id = b.id;
    return b;
}

function dropUserSessions(userId) { for (const [k, s] of sessions) if (s.uid === userId) sessions.delete(k); }

function syncBusinessWithUser(u) {
    const b = findBiz(u.business_id);
    if (!b) return;
    if (u.status === 'active' && b.status !== 'active') b.status = 'active';
    if (u.status === 'blocked') b.status = 'blocked';
    if (u.status === 'pending') b.status = 'pending';
}

const hits = new Map(); // simple in-memory rate limiter
function limited(key, max, windowMs) {
    const t = Date.now(), h = hits.get(key);
    if (!h || t - h.t > windowMs) { hits.set(key, { n: 1, t }); return false; }
    h.n++;
    return h.n > max;
  }
function readBody(req) {
    return new Promise((ok, no) => {
        let b = '', n = 0;
        req.on('data', c => { n += c.length; if (n > 100000) { no(bad('Payload too large', 413)); req.destroy(); return; } b += c; });
        req.on('end', () => {
            if (!b) return ok({});
            try { const j = JSON.parse(b); ok(j && typeof j === 'object' && !Array.isArray(j) ? j : {}); } catch { no(bad('Invalid JSON')); }
        });
        req.on('error', no);
    });
}
const send = (res, status, type, body, headers = {}) => {
    res.writeHead(status, {
        'Content-Type': type + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'same-origin', ...headers
    });
    res.end(body);
};
const json = (res, status, obj, headers) => send(res, status, 'application/json', JSON.stringify(obj), headers);
const page = (res, body, status = 200) => send(res, status, 'text/html', body)
function getUser(req) {
    const m = /(?:^|;\s*)sid=([a-f0-9]{48})/.exec(req.headers.cookie || '');
    if (!m) return null;
    const s = sessions.get(m[1]);
    if (!s || s.exp < Date.now()) { sessions.delete(m[1]); return null; }
    const u = users.find(x => x.id === s.uid);
    return u && u.status === 'active' ? u : null;
}
const need = u => { if (!u) throw bad('Please log in', 401); return u; };
const needAdmin = u => { need(u); if (!isAdmin(u)) throw bad('Admin access required', 403); return u; };
const needVendorOrAdmin = u => { need(u); if (!isAdmin(u) && !isVendor(u)) throw bad('Access denied', 403); return u; };

