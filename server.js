
/**
 * BUSINESS CONNECT - Complete Super Portal Server
 */
const express = require('express');
const cors = require('cors');
// Root route
app.get('/', (req, res) => {
  res.json({
    platform: 'Business Connect Super Portal',
    status: 'ONLINE 🚀',
    version: '1.0.0',
    timestamp: new Date()
  });
});
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'business_connect_secret_2026';

app.use(cors());
app.use(express.json());

// In-Memory Database for Mobile/Cloud Quick Testing
const db = {
  users: [],
  businesses: [],
  products: [],
  enquiries: []
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', platform: 'Business Connect Super Portal', time: new Date() });
});

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, role, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      fullName,
      email,
      passwordHash,
      phone: phone || null,
      role: role || 'BUYER',
      status: 'VERIFIED',
      createdAt: new Date()
    };
    db.users.push(newUser);
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registration successful', token, user: { id: newUser.id, fullName, email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp & QR Deep-Link Generator Engine
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

app.listen(PORT, () => {
  console.log(`[BUSINESS CONNECT] Running on port ${PORT}`);
});
         
