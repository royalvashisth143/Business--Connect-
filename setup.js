const fs = require('fs');
const path = require('path');

const files = {
  'package.json': JSON.stringify({
    "name": "business-connect",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    },
    "dependencies": {
      "@supabase/ssr": "^0.5.2",
      "@supabase/supabase-js": "^2.48.1",
      "clsx": "^2.1.1",
      "lucide-react": "^0.475.0",
      "next": "15.1.6",
      "react": "^19.0.0",
      "react-dom": "^19.0.0",
      "tailwind-merge": "^3.0.1"
    },
    "devDependencies": {
      "@types/node": "^22.13.1",
      "@types/react": "^19.0.8",
      "@types/react-dom": "^19.0.3",
      "postcss": "^8.5.1",
      "tailwindcss": "^3.4.17",
      "typescript": "^5.7.3"
    }
  }, null, 2),

  '.env.example': `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Payment Gateway (Razorpay)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Optional Maps Provider
NEXT_PUBLIC_MAPS_API_KEY=your_maps_api_key
`,

  'tailwind.config.ts': `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#16834A",
          dark: "#0D5F38",
          light: "#1FA861",
        },
        brand: {
          bgLight: "#F5F8F6",
          bgDark: "#101713",
          surfaceDark: "#18221C",
          textLight: "#18231D",
          textDark: "#E2E8F0",
          muted: "#66736B",
        },
      },
    },
  },
  plugins: [],
};
export default config;
`,

  'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,

  'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
`,

  'tsconfig.json': JSON.stringify({
    "compilerOptions": {
      "target": "ES2017",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [{ "name": "next" }],
      "paths": { "@/*": ["./src/*"] }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }, null, 2),

  'supabase/schema.sql': `-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Roles Enum
create type user_role as enum ('SUPER_ADMIN', 'ADMIN', 'SELLER', 'SUPPLIER', 'BUYER', 'CUSTOMER', 'SUPPORT_STAFF');

-- Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text unique not null,
  phone text,
  role user_role default 'CUSTOMER',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Businesses Table
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  slug text unique not null,
  category text not null,
  description text,
  logo_url text,
  gstin text,
  address text,
  city text not null,
  state text not null,
  pincode text not null,
  phone text not null,
  whatsapp text,
  verified boolean default false,
  featured boolean default false,
  status text default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  sku text,
  category text not null,
  description text,
  wholesale_price numeric(10,2),
  retail_price numeric(10,2),
  moq integer default 1,
  stock integer default 0,
  images text[],
  is_b2b boolean default true,
  is_b2c boolean default true,
  approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RFQs Table
create table public.rfqs (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text not null,
  description text not null,
  quantity integer not null,
  unit text not null,
  delivery_city text not null,
  status text default 'OPEN',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  total_amount numeric(10,2) not null,
  status text default 'PENDING',
  payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.rfqs enable row level security;
alter table public.orders enable row level security;
`,

  'src/types/index.ts': `export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SELLER' | 'SUPPLIER' | 'BUYER' | 'CUSTOMER' | 'SUPPORT_STAFF';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  business_name: string;
  slug: string;
  category: string;
  description?: string;
  logo_url?: string;
  gstin?: string;
  address?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp?: string;
  verified: boolean;
  featured: boolean;
  status: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  sku?: string;
  category: string;
  description?: string;
  wholesale_price?: number;
  retail_price?: number;
  moq: number;
  stock: number;
  images: string[];
  is_b2b: boolean;
  is_b2c: boolean;
  approved: boolean;
}
`,

  'src/lib/supabase/client.ts': `import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`,

  'src/lib/supabase/server.ts': `import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
`,

  'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #F5F8F6;
  --foreground: #18231D;
}

.dark {
  --background: #101713;
  --foreground: #E2E8F0;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
`,

  'src/components/ThemeToggle.tsx': `'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
    >
      {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
    </button>
  );
}
`,

  'src/components/Navbar.tsx': `'use client';

import Link from 'next/link';
import { Building2, ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#18221C] border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary text-white p-2 rounded-lg flex items-center justify-center font-bold text-xl">
            BC
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">BUSINESS</span>
            <span className="text-xl font-bold text-primary ml-1">CONNECT</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Link href="/directory" className="hover:text-primary transition">Directory</Link>
          <Link href="/marketplace" className="hover:text-primary transition">B2B & B2C Market</Link>
          <Link href="/dashboard/seller" className="hover:text-primary transition">Sell on BC</Link>
          <Link href="/dashboard/admin" className="hover:text-primary transition">Admin Panel</Link>
        </nav>

        <div className="hidden lg:flex items-center space-x-4">
          <ThemeToggle />
          <Link
            href="/dashboard/seller"
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition shadow-md"
          >
            List Your Business
          </Link>
        </div>

        <div className="flex lg:hidden items-center space-x-3">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700 dark:text-gray-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#18221C] border-b border-gray-200 dark:border-gray-800 px-4 pt-2 pb-6 space-y-3">
          <Link href="/directory" className="block py-2 font-medium text-gray-700 dark:text-gray-300">Directory</Link>
          <Link href="/marketplace" className="block py-2 font-medium text-gray-700 dark:text-gray-300">B2B & B2C Market</Link>
          <Link href="/dashboard/seller" className="block py-2 font-medium text-gray-700 dark:text-gray-300">Sell on BC</Link>
          <Link href="/dashboard/admin" className="block py-2 font-medium text-gray-700 dark:text-gray-300">Admin Panel</Link>
          <div className="pt-2">
            <Link
              href="/dashboard/seller"
              className="block text-center w-full py-2.5 text-sm font-semibold text-white bg-primary rounded-lg shadow"
            >
              List Your Business
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
`,

  'src/components/Footer.tsx': `import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl font-black text-white">BUSINESS</span>
            <span className="text-xl font-bold text-primary">CONNECT</span>
          </div>
          <p className="text-sm">
            India's Next-Generation B2B & B2C Marketplace, Business Directory, and Wholesale Portal. Grow your business with verified leads and digital catalogs.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/directory" className="hover:text-white transition">Business Directory</Link></li>
            <li><Link href="/marketplace" className="hover:text-white transition">Wholesale Portal</Link></li>
            <li><Link href="/marketplace" className="hover:text-white transition">B2C Shopping</Link></li>
            <li><Link href="/dashboard/seller" className="hover:text-white transition">Seller Registration</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="hover:text-white cursor-pointer">Manufacturers & Suppliers</span></li>
            <li><span className="hover:text-white cursor-pointer">Industrial Machinery</span></li>
            <li><span className="hover:text-white cursor-pointer">Electronics & Electrical</span></li>
            <li><span className="hover:text-white cursor-pointer">Apparel & Textiles</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Legal & Support</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
            <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
            <li><span className="hover:text-white cursor-pointer">Customer Support</span></li>
            <li><span className="hover:text-white cursor-pointer">Trust & Safety</span></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-xs">
        &copy; \${new Date().getFullYear()} Business Connect India. All rights reserved. Currencies in Indian Rupee (INR ₹).
      </div>
    </footer>
  );
}
`,

  'src/app/layout.tsx': `import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Business Connect | India's B2B & B2C Marketplace and Directory",
  description: "Connect with verified manufacturers, wholesalers, suppliers, and retailers across India.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-brand-bgLight dark:bg-brand-bgDark text-brand-textLight dark:text-brand-textDark">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
`,

  'src/app/manifest.ts': `import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Business Connect',
    short_name: 'BusinessConnect',
    description: 'B2B & B2C Marketplace and Business Directory for India',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F8F6',
    theme_color: '#16834A',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
`,

  'src/app/page.tsx': `import Link from 'next/link';
import { Search, MapPin, ShieldCheck, Building2, ShoppingCart, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white border border-white/20">
            <ShieldCheck className="w-4 h-4 text-emerald-300" /> India's Trusted B2B & B2C Business Ecosystem
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Discover Verified Businesses & Wholesale Products
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
            Connect with millions of manufacturers, suppliers, wholesalers, and retail buyers across India. Get verified leads instantly.
          </p>

          <div className="bg-white dark:bg-[#18221C] p-3 rounded-2xl shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-3 mt-8">
            <div className="flex-1 flex items-center px-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="What are you looking for? (e.g. Cotton Yarn, CNC Machine)"
                className="w-full py-3 bg-transparent text-gray-900 dark:text-white focus:outline-none text-sm"
              />
            </div>
            <div className="flex items-center px-3 bg-gray-50 dark:bg-gray-800 rounded-xl md:w-60">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="All India or City"
                className="w-full py-3 bg-transparent text-gray-900 dark:text-white focus:outline-none text-sm"
              />
            </div>
            <button className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Explore Top Categories</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Browse verified suppliers and industrial product catalogues</p>
          </div>
          <Link href="/directory" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { title: 'Manufacturers', count: '45,000+ Listings', icon: Building2 },
            { title: 'Wholesalers', count: '32,000+ Suppliers', icon: ShoppingCart },
