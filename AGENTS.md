# Agri-Tech: Repository Context

## Project

Agri-Tech is a smart farming management system (MERN). Farmers manage farms, crops, soil reports, weather forecasts, pest alerts, resource orders, expert consultations, and a community forum. Admins manage users, content, resource approvals, and moderation.

## Stack

- Backend: Node 18+, Express, Mongoose (MongoDB), JWT, bcryptjs, Joi, helmet, cors, express-rate-limit, winston, morgan, node-cron
- Frontend: React (Vite), React Router, Axios, react-bootstrap, react-i18next, recharts, @tanstack/react-query
- Tests: Jest + Supertest + mongodb-memory-server (server), Vitest + React Testing Library (client)
- Weather: Open-Meteo (no API key)

## Repo layout

```text
/server  src/{config,models,controllers,routes,middleware,services,jobs,utils,validators} tests/
/client  src/{api,components,pages,context,hooks,i18n,routes,utils}
/postman collection + environment files
```

## Commands

- Server: `cd server && npm run dev | npm test | npm run lint`
- Client: `cd client && npm run dev | npm test | npm run lint | npm run build`

## Conventions

- Controllers stay thin; business logic lives in `services/`.
- Every route validates input (Joi) and returns the same error shape: `{ "success": false, "message": "...", "errors": [] }`. Success shape: `{ "success": true, "data": ... }`.
- All list endpoints are paginated (`?page=&limit=`), default limit 20.
- Farmers may only read/write their own farms, crops, soil reports, orders, and consultations. Enforce ownership in services, not just routes.
- Roles: `farmer`, `expert`, and `admin`. Use `protect` then `authorize(...roles)` middleware; experts are limited to open consultations and general/pest alerts, not user management or orders.
- Never log or return password hashes. Never commit secrets; update `.env.example` whenever a new variable is added.
- Every user-facing string in the client goes through `t('key')`; add keys to `en.json` and `hi.json`.
- Every page handles loading, empty, and error states.
- Add or update tests with every task. A task is not done until tests and lint pass.

## Definition of done

Every task includes model and validation, routes, role and ownership checks, server tests, client UI with loading and error states, translated strings, Postman requests, and passing lint and test checks where applicable.

## Do not

- Do not add new libraries beyond the stack above without stating why.
- Do not store JWTs in localStorage (access token in memory, refresh token in httpOnly cookie).
- Do not implement real payments (mock/cash-on-delivery only).
- Do not modify files unrelated to the current task.

## UI rules

- Frontend is React + Vite + react-bootstrap. Do not add a new UI library. For icons, use the one already installed (e.g. `react-bootstrap-icons` or `lucide-react`) at a single size (20px) across the navbar.
- All user-facing text goes through `t('key')`. Add every new key to `en.json` and `hi.json`.
- Nav labels are short: Farms, Market, Orders, Forum, Experts. Nav links never wrap (`white-space: nowrap`).
- Colors and spacing come from CSS variables in one theme file (`src/styles/theme.css`). Body text contrast must meet WCAG AA (4.5:1).
- Interactive elements: visible focus ring, minimum 44x44px tap target, `aria-label` on icon-only buttons, `aria-current="page"` on the active nav link.
- Page content is capped at a max width of 1200px and centered.
- Every page handles loading, empty, and error states.
- Do not change backend code or unrelated pages in these tasks.
