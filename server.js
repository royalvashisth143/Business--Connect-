/**
 * BUSINESS CONNECT - Complete Production Server Engine
 * Node.js + Express + JWT + RBAC + REST API
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'business_connect_super_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// IN-MEMORY DATABASE MOCK
// ==========================================
const db = {
  users: [
    {
      id: 'user-super-1',
      fullName: 'Super Admin',
      email: 'superadmin@businessconnect.com',
      passwordHash: bcrypt.hashSync('Admin@123', 10),
      role: 'SUPER_ADMIN',
      status: 'VERIFIED',
      createdAt: new Date()
    },
    {
      id: 'user-mfg-1',
      fullName: 'Rajesh Kumar',
      email: 'manufacturer@example.com',
      passwordHash: bcrypt.hashSync('Mfg@123', 10),
      role: 'MANUFACTURER',
      status: 'VERIFIED',
      createdAt: new Date()
    },
    {
      id: 'user-buyer-1',
      fullName: 'Amit Sharma',
      email: 'buyer@example.com',
      passwordHash: bcrypt.hashSync('Buyer@123', 10),
      role: 'BUYER',
      status: 'VERIFIED',
      createdAt: new Date()
    }
  ],
  businesses: [
    {
      id: 'bus-1',
      ownerId: 'user-mfg-1',
      companyName: 'Apex Industrial Heavy Machinery Ltd',
      slug: 'apex-industrial-heavy-machinery',
      businessType: 'MANUFACTURER',
      gstNumber: '07AABCA1234F1Z5',
      verification: 'VERIFIED',
      description: 'Leading manufacturer of heavy industrial CNC machines and lathe equipment.',
      country: 'India',
      state: 'Haryana',
      city: 'Gurugram',
      locality: 'Udyog Vihar',
      pinCode: '122016',
      whatsappNumber: '919876543210',
      createdAt: new Date()
    }
  ],
  products: [
    {
      id: 'prod-1',
      businessId: 'bus-1',
      ownerId: 'user-mfg-1',
      title: 'High-Precision CNC Lathe Machine X-500',
      slug: 'high-precision-cnc-lathe-machine-x-500',
      sku: 'CNC-X500-01',
      categoryId: 'cat-machinery',
      description: 'Heavy duty CNC lathe machine with automated tool changer and high torque spindle.',
      retailPrice: 1250000,
      wholesalePrice: 1100000,
      minOrderQuantity: 1,
      stockQuantity: 15,
      isApproved: true,
      createdAt: new Date()
    }
  ],
  categories: [
    { id: 'cat-machinery', name: 'Industrial Machinery', slug: 'industrial-machinery', parentId: null },
    { id: 'cat-agri', name: 'Agriculture', slug: 'agriculture', parentId: null },
    { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', parentId: null }
  ],
  locations: [
    { id: 'loc-1', country: 'India', state: 'Haryana', district: 'Gurugram', city: 'Gurugram', locality: 'Udyog Vihar', pinCode: '122016' }
  ],
  enquiries: [],
  socialLinks: [],
  auditLogs: []
};

// ==========================================
// AUTHENTICATION & RBAC MIDDLEWARE
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}

// ==========================================
// ROOT & HEALTH CHECK ROUTES
// ==========================================
app.get('/', (req, res) => {
  res.json({
    platform: 'Business Connect Super Portal',
    status: 'ONLINE 🚀',
    version: '1.0.0',
    timestamp: new Date()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', platform: 'Business Connect Super Portal', timestamp: new Date() });
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, role, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${uuidv4()}`,
      fullName,
      email,
      passwordHash,
      phone: phone || null,
      role: role || 'BUYER',
      status: role === 'BUYER' ? 'VERIFIED' : 'PENDING',
      createdAt: new Date()
    };

    db.users.push(newUser);
    db.auditLogs.push({ id: uuidv4(), userId: newUser.id, action: 'USER_REGISTERED', details: { email, role }, createdAt: new Date() });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registration successful', token, user: { id: newUser.id, fullName, email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

// ==========================================
// 2. BUSINESS DIRECTORY & CRUD ENDPOINTS
// ==========================================
app.get('/api/businesses', (req, res) => {
  const { type, search, city, verified } = req.query;
  let results = [...db.businesses];

  if (type) results = results.filter(b => b.businessType === type);
  if (city) results = results.filter(b => b.city.toLowerCase() === city.toLowerCase());
  if (verified) results = results.filter(b => b.verification === verified.toUpperCase());
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(b => b.companyName.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q)));
  }

  res.json(results);
});

app.post('/api/businesses', authenticateToken, requireRoles('MANUFACTURER', 'SUPPLIER', 'SELLER', 'BUSINESS_OWNER', 'SUPER_ADMIN', 'ADMIN'), (req, res) => {
  const { companyName, businessType, gstNumber, description, country, state, city, locality, pinCode, whatsappNumber, website } = req.body;
  if (!companyName || !businessType || !city) {
    return res.status(400).json({ error: 'Company name, business type, and city are required' });
  }

  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newBusiness = {
    id: `bus-${uuidv4()}`,
    ownerId: req.user.id,
    companyName,
    slug,
    businessType,
    gstNumber: gstNumber || null,
    verification: 'PENDING',
    description: description || '',
    country: country || 'India',
    state: state || '',
    city,
    locality: locality || '',
    pinCode: pinCode || '',
    whatsappNumber: whatsappNumber || '',
    website: website || '',
    createdAt: new Date()
  };

  db.businesses.push(newBusiness);
  res.status(201).json({ message: 'Business created successfully', business: newBusiness });
});

// ==========================================
// 3. PRODUCT CATALOGUE & CRUD ENDPOINTS
// ==========================================
app.get('/api/products', (req, res) => {
  const { search, categoryId, businessId } = req.query;
  let results = db.products.filter(p => p.isApproved);

  if (categoryId) results = results.filter(p => p.categoryId === categoryId);
  if (businessId) results = results.filter(p => p.businessId === businessId);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }

  res.json(results);
});

app.post('/api/products', authenticateToken, requireRoles('MANUFACTURER', 'SUPPLIER', 'SELLER', 'SUPER_ADMIN', 'ADMIN'), (req, res) => {
  const { title, sku, businessId, categoryId, description, retailPrice, wholesalePrice, minOrderQuantity, stockQuantity } = req.body;
  if (!title || !sku || !businessId || !categoryId) {
    return res.status(400).json({ error: 'Title, SKU, businessId, and categoryId are required' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newProduct = {
    id: `prod-${uuidv4()}`,
    businessId,
    ownerId: req.user.id,
    title,
    slug,
    sku,
    categoryId,
    description: description || '',
    retailPrice: retailPrice ? parseFloat(retailPrice) : null,
    wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
    minOrderQuantity: minOrderQuantity ? parseInt(minOrderQuantity) : 1,
    stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
    isApproved: req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN',
    createdAt: new Date()
  };

  db.products.push(newProduct);
  res.status(201).json({ message: 'Product added successfully. Pending approval if added by vendor.', product: newProduct });
});

// ==========================================
// 4. CATEGORIES & LOCATIONS ENDPOINTS
// ==========================================
app.get('/api/categories', (req, res) => {
  res.json(db.categories);
});

app.post('/api/categories', authenticateToken, requireRoles('SUPER_ADMIN', 'ADMIN'), (req, res) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cat = { id: `cat-${uuidv4()}`, name, slug, parentId: parentId || null };
  db.categories.push(cat);
  res.status(201).json(cat);
});

app.get('/api/locations', (req, res) => {
  res.json(db.locations);
});

// ==========================================
// 5. ENQUIRY & RFQ WORKFLOW ENDPOINTS
// ==========================================
app.get('/api/enquiries', authenticateToken, (req, res) => {
  if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.json(db.enquiries);
  }
  const userEnquiries = db.enquiries.filter(e => e.buyerId === req.user.id || e.vendorId === req.user.id);
  res.json(userEnquiries);
});

app.post('/api/enquiries', authenticateToken, requireRoles('BUYER', 'SUPER_ADMIN'), (req, res) => {
  const { vendorId, productId, quantity, message, deliveryLocation } = req.body;
  if (!vendorId || !quantity || !message) {
    return res.status(400).json({ error: 'Vendor ID, quantity, and message are required' });
  }

  const newEnquiry = {
    id: `enq-${uuidv4()}`,
    buyerId: req.user.id,
    vendorId,
    productId: productId || null,
    quantity: parseInt(quantity),
    message,
    deliveryLocation: deliveryLocation || '',
    quotationPrice: null,
    status: 'NEW',
    createdAt: new Date()
  };

  db.enquiries.push(newEnquiry);
  res.status(201).json({ message: 'Enquiry submitted successfully', enquiry: newEnquiry });
});

// ==========================================
// 6. SOCIAL MEDIA LINK & QR CODE GENERATOR
// ==========================================
app.post('/api/social-qr/generate', async (req, res) => {
  try {
    const { phoneNumber, businessName, productTitle, targetUrl } = req.body;
    let whatsappLink = null;
    if (phoneNumber && businessName) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const msg = `Hello ${businessName}, I am interested in your listing${productTitle ? `: *${productTitle}*` : ''} via Business Connect.`;
      whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    }
    let qrCodeDataUrl = null;
    if (targetUrl) {
      qrCodeDataUrl = await QRCode.toDataURL(targetUrl, { color: { dark: '#059669', light: '#FFFFFF' } });
    }
    res.json({ whatsappLink, qrCodeDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`[BUSINESS CONNECT] Running on port ${PORT}`);
});
                                                            
