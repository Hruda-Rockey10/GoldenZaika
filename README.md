# Golden Zaika - Food Delivery Application

## 🚀 Tech Stack

- **Frontend Framework:** Next.js 15 (App Router)
- **UI Libraries:**
  - Tailwind CSS v4 (Styling)
  - Framer Motion (Animations)
  - GSAP (Advanced Animations)
  - Lucide React (Icons)
- **State Management:** Zustand
- **Backend Services:**
  - Next.js API Routes (Serverless Functions)
  - Firebase Authentication (Auth)
  - Firebase Firestore (Database)
  - Firebase Storage (File Uploads)
  - Upstash Redis (Caching & Rate Limiting)
- **Artificial Intelligence:** Google Gemini (Generative AI)
- **Payments:** Razorpay
- **Utilities:**
  - Axios (Data Fetching)
  - PDF Generation (`jspdf`)

## 🏗️ Architecture

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

## ✨ Features and Functionality

### 👤 User Application

- **Authentication**
  - Phone Number Login
  - Email Login
  - Protected Routes
- **Discovery**
  - Real-time Menu Sync
  - Category Filtering
  - AI-Powered Ingredient Search
  - AI Personalized Recommendations
- **Ordering**
  - Persistent Cart (Zustand)
  - Razorpay Payment Integration
  - Real-time Order Tracking
  - Order History
  - Invoice Generation

### 🛡️ Admin Dashboard

- **Management**
  - Real-time Order Monitoring
  - Status Updates (Pending -> Delivered)
  - Menu Item CRUD Operations
  - Image Uploads (Firebase Storage)
  - Service Zone Configuration
- **Analytics**
  - Revenue Graphs
  - User Activity Stats
  - Top Selling Items
- **Support**
  - Customer Message Center

### 🤖 AI Capabilities (Gemini)

- Nutritional Analysis (Calories/Macros)
- Smart Product Description Generation
- Intelligent Natural Language Search
- User Taste Profiling

## 📂 Project Structure

```
src/
├── app/              # Next.js App Router (Pages & API)
├── components/       # Reusable UI Components
├── constants/        # App-wide Constants
├── hooks/            # Custom React Hooks
├── lib/              # Integrations (Firebase, Redis, Gemini)
├── services/         # Client-side API Services
├── stores/           # Zustand State Management
└── utils/            # Helper Functions & API Wrappers
```

## 🛠️ Getting Started

1.  **Clone Repository**

    - `git clone [url]`
    - `cd [folder]`

2.  **Install Dependencies**

    - `npm install`

3.  **Configure Environment**

    - Create `.env`
    - Add Firebase credentials
    - Add Razorpay keys
    - Add Gemini API key

4.  **Run Application**
    - `npm run dev`
    - Access at `http://localhost:3000`

---

### Created with ❤️ by Hrudananda Behera
