# Project Rules

## Project Naming Conventions
When writing or modifying code in both the `backend/` and `frontend/` directories, **ALWAYS** use `camelCase` for variable names, object properties, and database schema fields (e.g., use `totalQuestions` instead of `total_questions`).
- **Backend:** Mongoose schemas, service methods, controllers, and MongoDB models must strictly use `camelCase`.
- **Frontend:** API responses, React state variables, props, and UI components must expect and use `camelCase`.

## Frontend Architecture & Conventions
The following rules strictly apply to the `frontend/` directory (Next.js & React stack):

### 1. File & Component Naming
- **Components:** Always use `PascalCase` for component files and folders (e.g., `UserTable.tsx`, `MediaUploadInput.tsx`).
- **Hooks:** Always prefix with `use` and use `camelCase` (e.g., `useAuth.ts`, `useTests.ts`).
- **Utils & Constants:** Use `camelCase` for file names (e.g., `formatters.ts`, `constants.ts`).
- **Component Props:** Name the interface `[ComponentName]Props` (e.g., `interface UserTableProps { ... }`).
- **Exports:** Prefer **Named Exports** (`export const MyComponent = ...`) for all files except for Next.js mandatory pages (`page.tsx`, `layout.tsx`).

### 2. Component Directory Structure (Layered)
Components in `src/components/` must be logically grouped:
- **`ui/`**: Base primitive components (e.g., Shadcn buttons, dialogs, inputs). **Must NEVER import from `feature/` or `layout/`.**
- **`layout/`**: Structural wrappers (e.g., Sidebar, Navbar, DashboardLayout).
- **`feature/`**: Domain-specific complex components (e.g., `CreateTestForm`, `PracticeTestRunner`). These can import from `ui/`.

### 3. Thin Pages Principle
- **Keep `page.tsx` thin:** Do not write thousands of lines of business logic inside `page.tsx`.
- Delegate complex logic, states, and UI to Feature Components inside `src/components/feature/`.
- `page.tsx` should primarily handle routing params, SEO metadata, and invoking the main feature component.

### 4. Routing & API Handling
- **No Hardcoded Routes:** Avoid scattered hardcoded strings like `router.push('/admin/tests')`. Define and use route constants instead (e.g., `ROUTES.ADMIN_TESTS`).
- For styling, strictly use TailwindCSS combined with Shadcn UI. Do NOT use CSS Modules.

### 5. UX & Alerts
- **Notifications & Alerts:** Always use `toast` from `sonner` (`import { toast } from 'sonner'`) for success, error, and info notifications instead of native `alert()` or manual state-based messages.
- **Confirmations:** Always use the `<ConfirmModal>` component from `@/components/ui/confirm-modal` for destructive actions or important confirmations instead of the native browser `confirm()`.
