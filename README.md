# 🍔 **Golden Zaika** - _Premium Food Delivery Platform_

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFA611?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Secure-blue?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Zustand](https://img.shields.io/badge/Zustand-State-orange?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**Experience the taste of luxury.**
A fully featured, AI-powered food delivery application built with the latest modern web technologies.

[🚀 **Launch Live App**](https://golden-zaika.vercel.app/)

</div>

---

## 🛠️ **Tech Stack**

A cutting-edge stack designed for performance, scalability, and user experience.

### **Frontend**

- **Framework:** [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **UI Library:** [React 19.2.3](https://react.dev/)
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://gsap.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Notifications:** [React Toastify](https://fkhadra.github.io/react-toastify/introduction)
- **Forms:** [React Hook Form](https://react-hook-form.com/)

### **Backend**

- **API:** Next.js API Routes (Serverless)
- **Database:** [Firebase Firestore](https://firebase.google.com/products/firestore) (NoSQL)
- **Authentication:** [Firebase Auth](https://firebase.google.com/products/auth)
- **File Storage:** [Firebase Storage](https://firebase.google.com/products/storage)
- **Caching:** [Upstash Redis](https://upstash.com/) (Serverless)
- **Rate Limiting:** `@upstash/ratelimit`

### **Services & Integrations**

- **Payments:** [Razorpay](https://razorpay.com/)
- **Artificial Intelligence:** [Google Gemini AI](https://deepmind.google/technologies/gemini/) (Product descriptions, recommendations, nutrition analysis)
- **Contact Forms:** [Web3Forms](https://web3forms.com/)
- **PDF Generation:** `jspdf`

### **State Management**

- **Global Client State:** [Zustand](https://github.com/pmndrs/zustand)
- **Server State:** React Hooks + Firebase Real-time Listeners

### **DevOps**

- **Hosting:** [Vercel](https://vercel.com/) (Auto CI/CD)
- **Package Manager:** `npm`
- **Node Version:** 20.x

---

## 🏗️ **Architecture**

High-level overview of how the client, server, and external services interact.

```mermaid
graph TD
    %% Nodes
    User([User / Client])

    subgraph "Presentation Layer (Client)"
        UI["React Components / Pages"]
        Zustand["Zustand Stores <br/> (ViewModel / State)"]
        Services["Service Layer <br/> (Axios / Fetch)"]
    end

    subgraph "Next.js Server (API)"
        Middleware["API Wrapper / Middleware <br/> (Rate Limit, Auth Check)"]
        Routes["API Routes"]

        subgraph "Backend Logic"
            Logger["Logger"]
            Redis[("Redis Cache")]
            AI["Gemini AI Service"]
        end
    end

    subgraph "External Infrastructure"
        FB_Auth["Firebase Auth"]
        FB_DB[("Firestore DB")]
        FB_Storage["Firebase Storage"]
        RP["Razorpay Gateway"]
    end

    %% Connections
    User -->|Interacts| UI
    UI <-->|State Sync| Zustand
    UI -->|Calls| Services
    Zustand -->|Calls| Services

    Services -->|HTTP Requests| Middleware
    Middleware -->|Passes| Routes

    Routes -->|Logs| Logger
    Routes -->|Checks/Caches| Redis
    Routes -->|Generates Content| AI

    Routes -->|Verifies Token| FB_Auth
    Routes -->|CRUD Ops| FB_DB
    Routes -->|Uploads| FB_Storage
    Routes -->|Process Payment| RP

    %% Styling
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef server fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef ext fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    class UI,Zustand,Services client;
    class Middleware,Routes,Logger,Redis,AI server;
    class FB_Auth,FB_DB,FB_Storage,RP ext;
```

---

## ✨ **Key Features**

### 👤 **User Application**

- **🛒 Smart Ordering:** Persistent cart, real-time updates, and order history.
- **🔐 Secure Auth:** Robust authentication via Firebase (Email/Password, Phone).
- **💸 Easy Payments:** Seamless checkout process integrated with **Razorpay**.
- **🧾 Invoicing:** Automatic PDF invoice generation for every order.

### 🛡️ **Admin Dashboard**

- **📊 Live Monitoring:** Real-time dashboard for tracking orders and status changes.
- **✏️ Content Management:** Full CRUD capabilities for menu items and categories.
- **📈 Analytics:** visual graphs and stats for revenue, sales, and user activity.
- **📨 Customer Support:** Integrated message center for handling inquiries.

### 🤖 **AI Capabilities (Gemini)**

- **Intelligent Recommendations:** Suggests food based on browsing habits.
- **Nutritional Analysis:** Automatically calculates calories and macros.
- **Content Gen:** Creates appetizing product descriptions instantly.

---

## 📂 **Project Structure**

```
src/
├── app/              # Next.js App Router (Pages & API endpoints)
├── components/       # Reusable UI Components (Buttons, Cards, Modals)
├── constants/        # App-wide fixed data and configuration
├── hooks/            # Custom React Hooks (useAuth, useCart)
├── lib/              # core library configurations (Firebase, Gemini, Redis)
├── scripts/          # Utility scripts for data migration or seeding
├── services/         # API Service layer (Auth, Order, Product services)
├── stores/           # Global state management (Zustand stores)
└── utils/            # Helper functions and formatted utilities
```

---

## 🚀 **Getting Started**

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Hruda-Rockey10/Nextjs---Firebase.git
cd "Nextjs---Firebase"
```

### 2. Install Dependencies

> **Note:** Use the custom script to ensure legacy peer dependencies are handled correctly.

```bash
npm run modules
# OR
npm install --legacy-peer-deps
```

### 3. Configure Environment

Create a `.env` file in the root directory and populate it with your keys:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key"

# Payment
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AI & Database
GEMINI_API_KEY=your_gemini_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

<div align="center">
  <b>Created with ❤️ by Hrudananda Behera</b>
</div>
