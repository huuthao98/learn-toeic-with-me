# LearnTOEIC – Implementation Plan & Architecture

## ✅ Đã hoàn thành

### Frontend (Next.js 15 App Router)
- `src/app/layout.tsx` – Root layout với SEO metadata đầy đủ (title, description, OpenGraph, Twitter)  
- `src/app/globals.css` – **Toàn bộ Design System CSS** theo spec (colors, typography, buttons, cards, inputs, tags, modals, animations)
- `src/app/page.tsx` – Redirect thông minh: auth → dashboard, no-auth → login
- `src/app/auth/login/page.tsx` – Login page 2 cột
- `src/app/auth/register/page.tsx` – Register page với password strength
- `src/app/dashboard/page.tsx` + `DashboardPage.tsx` – Full dashboard với chart
- `src/app/practice/page.tsx` + `PracticePage.tsx` – Practice test catalog
- `src/app/admin/page.tsx` + `AdminLayout.tsx` – Admin panel với dark sidebar + modal
- `src/components/layout/Sidebar.tsx` – Sidebar với nav + user info
- `src/components/layout/Topbar.tsx` – Topbar với search + CTA
- `src/components/layout/DashboardLayout.tsx` – Layout wrapper với auth guard
- `src/lib/api.ts` – API client module
- `src/lib/constants.ts` – TOEIC parts, config constants
- `src/lib/utils.ts` – Utility functions
- `src/store/auth.store.ts` – Zustand auth store với persist
- `.env.local` – Environment variables template

### Backend (NestJS)
- `src/main.ts` – Server với Helmet, CORS, ValidationPipe, Swagger
- `src/app.module.ts` – Root module với ThrottlerModule
- `src/supabase/supabase.module.ts` – Global Supabase client provider
- `src/auth/` – Auth module (register/login/profile + JWT strategy + guards)
- `src/questions/` – Questions CRUD + admin controller
- `src/dashboard/` – Dashboard stats/plan/chart/recent-tests
- `src/users/` – Users admin module
- `src/tests/tests.module.ts` – Placeholder
- `src/admin/admin.module.ts` – Placeholder
- `.env` – Backend env template

### Database (Supabase)
- `supabase/schema.sql` – Full PostgreSQL schema + RLS policies

---

## 🗺️ Routes

| Route | Role | Page |
|-------|------|------|
| `/auth/login` | Public | Login page |
| `/auth/register` | Public | Register page |
| `/dashboard` | User | Personal dashboard |
| `/practice` | User | Practice test catalog |
| `/vocabulary` | User | Vocabulary (TODO) |
| `/listening` | User | Grammar & Listening (TODO) |
| `/progress` | User | Progress Report (TODO) |
| `/admin` | Admin | Question management |

---

## 🔄 Các bước tiếp theo

### Priority 1 – Kết nối Supabase
1. Tạo project tại [supabase.com](https://supabase.com)
2. Chạy `supabase/schema.sql` trong SQL Editor
3. Điền credentials vào `frontend/.env.local` và `backend/.env`

### Priority 2 – Trang còn thiếu (Frontend)
- `/vocabulary` – Vocabulary learning với flashcards
- `/progress` – Progress report với charts theo từng part
- `/practice/[id]` – Exam interface (câu hỏi TOEIC, timer, submit)
- `/practice/[id]/review` – Review kết quả sau bài thi

### Priority 3 – Backend modules hoàn chỉnh
- `TestsModule` – Quản lý test sets, start/submit exam
- `VocabularyModule` – CRUD vocabulary + spaced repetition
- `AnalyticsModule` – Admin analytics dashboard

### Priority 4 – Polish
- Dark mode support
- Mobile responsive (sidebar drawer)
- File upload cho audio (Supabase Storage)
- Email verification
- Password reset flow

---

## 🏗️ Design System Tokens (CSS Variables)

```
--blue-600: #2563EB  (Primary brand)
--blue-900: #1E3A8A  (Dark blue)
--success:  #10B981  (Green)
--warning:  #F59E08  (Amber)
--error:    #EF4444  (Red)
--gray-900: #111827  (Text)
--gray-500: #6B7280  (Muted)
```

Font: **Inter** (Google Fonts) – Heading1: 48px/700, H2: 38px/600, Body: 16px/400, Caption: 12px/500
