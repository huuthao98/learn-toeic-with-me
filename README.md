# LearnTOEIC 🎯

A full-stack TOEIC learning platform built with **Next.js 15**, **NestJS**, and **Supabase**.

## 📁 Project Structure

```
learn-english/
├── frontend/          # Next.js 15 (App Router) – SEO optimized
├── backend/           # NestJS REST API
└── supabase/
    └── schema.sql     # Database schema + RLS policies
```

## 🚀 Getting Started

### 1. Setup Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy your Project URL and keys

### 2. Configure Environment Variables

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Backend** (`backend/.env`):
```
PORT=3001
JWT_SECRET=<your-32+-char-secret>
JWT_EXPIRES_IN=7d
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FRONTEND_URL=http://localhost:3000
```

### 3. Run the Applications

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:3000

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/auth/login` | Login page |
| `/auth/register` | Registration page |
| `/dashboard` | Personal dashboard (score, streak, plan, chart) |
| `/practice` | Practice test catalog |
| `/vocabulary` | Vocabulary learning |
| `/progress` | Progress reports |
| `/admin` | Admin panel (question management) |

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Vanilla CSS, Recharts |
| State | Zustand (with persist) |
| Forms | React Hook Form + Zod |
| Backend | NestJS, Passport-JWT, Swagger |
| Database | Supabase (PostgreSQL + RLS) |
| Icons | Lucide React |

## 🗄️ API Documentation

After starting the backend, visit: http://localhost:3001/api/docs
