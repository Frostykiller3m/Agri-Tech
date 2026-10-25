# Agri-Tech

Agri-Tech is a smart farming management system for farmers, experts, and administrators.

## Prerequisites

- Node.js 22
- npm 9 or newer
- MongoDB 6 or newer for database-backed features

## Setup

```powershell
git clone <repository-url>
cd agri-tech-codex
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
npm install
npm install --prefix server
npm install --prefix client
```

Update `server/.env` with a MongoDB connection string and local secrets. The health endpoint can run without MongoDB, but database features require `MONGO_URI`.

## Environment variables

| Variable                                                  | Used by                 | Required              | Purpose                                                                                                                                                         |
| --------------------------------------------------------- | ----------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                    | API                     | No                    | HTTP listen port; defaults to `5000` and is supplied by Render in production.                                                                                   |
| `MONGO_URI`, `MONGODB_URI`, `MONGO_URL`, or `MONGO_MONGODB_URI` | API; admin seed command uses `MONGO_URI` | Yes for data features | MongoDB connection URI. The additional names support Vercel's MongoDB integration. Use a least-privilege Atlas database user in production. |
| `JWT_SECRET`                                              | API                     | Yes in production     | Signs access tokens. Use a unique random secret.                                                                                                                |
| `JWT_REFRESH_SECRET`                                      | API                     | Yes in production     | Signs refresh tokens; keep it distinct from `JWT_SECRET`.                                                                                                       |
| `CLIENT_URL`                                              | API                     | Yes in production     | Exact HTTPS origin allowed by credentialed CORS, with no trailing slash (for example `https://app.example.com`). Defaults to localhost only outside production. |
| `NODE_ENV`                                                | API                     | No                    | Set to `production` on Render; controls secure refresh cookies and production error responses.                                                                  |
| `LOG_LEVEL`                                               | API                     | No                    | Winston log threshold; defaults to `info`.                                                                                                                      |
| `ADMIN_NAME`                                              | Admin seed command      | Required to seed      | Display name for the bootstrap administrator.                                                                                                                   |
| `ADMIN_EMAIL`                                             | Admin seed command      | Required to seed      | Administrator account email.                                                                                                                                    |
| `ADMIN_PASSWORD`                                          | Admin seed command      | Required to seed      | Initial password, or replacement password when reset is explicitly enabled. Remove it from the deployment environment after the operation.                      |
| `ADMIN_PHONE`                                             | Admin seed command      | No                    | Optional phone number for the administrator.                                                                                                                    |
| `ADMIN_RESET_PASSWORD`                                    | Admin seed command      | No                    | Defaults to `false`; set to the exact string `true` only when intentionally rotating the seeded administrator password.                                         |
| `VITE_API_URL`                                            | Client build            | No                    | API origin embedded into the Vite bundle; defaults to `http://localhost:5000`. Set it in Vercel to the HTTPS API origin without a trailing slash.               |
| `CI_ADMIN_NAME`, `CI_ADMIN_EMAIL`, `CI_ADMIN_PASSWORD`    | CI account seed         | CI only               | Credentials for an administrator in the disposable CI MongoDB database.                                                                                         |
| `CI_EXPERT_NAME`, `CI_EXPERT_EMAIL`, `CI_EXPERT_PASSWORD` | CI account seed         | CI only               | Credentials for an expert in the disposable CI MongoDB database.                                                                                                |

The CI account values are defined only in the workflow and must never be used for a deployed environment. Local server values are listed in `server/.env.example`; the client build value is in `client/.env.example`.

## Development

Run the API and client in separate terminals:

```powershell
npm run dev --prefix server
npm run dev --prefix client
```

The API listens on `http://localhost:5000` by default and exposes `GET /health`. The Vite client listens on `http://localhost:5173`.

## Checks

```powershell
npm run lint
npm test
npm run build
```

## API collection (Task 16)

Import `postman/Agri-Tech-API.postman_collection.json` and `postman/Agri-Tech-Local.postman_environment.json` into Postman, select the environment, and set the admin/expert credentials to provisioned accounts in a dedicated test database. The Farmer folder can register its configured farmer account on first use. Create and approve a resource before exercising checkout; create a matching farm before testing regional-alert notifications. The collection captures IDs from successful create/list responses. The consultations image request expects a valid consultation ID and a valid image filename; it returns 404 when the consultation has no uploaded image.

Start the API against a disposable test database (never production), then run `npm run test:api`. Newman executes the collection and checks each configured status code and the common success/error response envelope. Use `npm run postman:generate` after editing the collection source. Server integration coverage can be reported with `npm run test:coverage`.

The environment file contains placeholder credentials only. Do not put real secrets in the exported environment or commit a populated environment file.

## Query performance checks (Task 17)

See [docs/query-performance.md](./docs/query-performance.md) for the five highest-impact list-query `explain()` checks, expected indexes, and how to interpret the execution plan.

## CI and deployment (Task 18)

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on pull requests and manual dispatch. It installs the root/server/client lockfiles, lints, runs server and client tests, builds the client, starts the API against a disposable MongoDB service, and runs the Newman collection with seeded CI-only administrator and expert accounts. No production credentials are needed in GitHub Secrets.

The included deployment targets are Render for the API (`render.yaml` at the repository root) and Vercel for the client (`client/vercel.json`). MongoDB Atlas hosts the production database. Deploy the repository from scratch as follows:

1. Create an Atlas project and cluster, then create a dedicated database user with access only to the application database. Add the Render service's outbound IP ranges to the Atlas IP access list (or configure a private/dedicated network path). Do not use `0.0.0.0/0` for a production database. Copy the Atlas application connection string for `MONGO_URI`, including the database name and URL-encoded credentials.
2. In Render, create a Blueprint from this repository and deploy the `agri-tech-api` web service. The blueprint builds from `server/`, uses `npm ci`/`npm start`, and configures `/health` as its health check. Add `MONGO_URI` and `CLIENT_URL` in the Render environment settings. Set `CLIENT_URL` to the final Vercel custom-domain origin. Render generates independent `JWT_SECRET` and `JWT_REFRESH_SECRET` values; keep them private.
3. In Vercel, import the same repository and set the project Root Directory to `client`. The checked-in Vercel config builds `dist` and rewrites client-side routes to `index.html`. Set `VITE_API_URL` to the Render API's HTTPS origin. Set the Vercel custom domain to `app.example.com` and the API custom domain to `api.example.com` (replace with domains you own), so the strict refresh cookie remains same-site while requests are cross-origin. Both domains must use HTTPS.
4. Confirm `GET https://api.example.com/health` returns `success: true`, then load the client and verify login, refresh after a reload, and logout. Ensure the API's `CLIENT_URL` exactly matches the browser origin, including scheme and subdomain, and redeploy after changing environment variables.

### Operations runbook

- **Seed the first administrator:** set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `MONGO_URI` in the Render service environment. Open the service shell and run `npm run seed:admin`. The command creates the account if absent and does not replace the password of an existing account unless reset is explicitly enabled. Remove `ADMIN_PASSWORD` from the environment when done.
- **Rotate JWT signing secrets:** generate two independent high-entropy values, replace `JWT_SECRET` and `JWT_REFRESH_SECRET` in Render, and redeploy. Existing access and refresh tokens will stop validating, requiring users to authenticate again. Never reuse one secret for both variables.
- **Rotate the admin password:** set the desired `ADMIN_PASSWORD`, temporarily set `ADMIN_RESET_PASSWORD=true`, and run `npm run seed:admin` in the Render shell. Immediately unset both variables (or restore `ADMIN_RESET_PASSWORD=false`) after confirming the new password works.
- **Rotate Atlas credentials:** create a replacement least-privilege Atlas database user, update `MONGO_URI` in Render and deploy, verify health and database-backed functionality, then remove the old database user. Avoid printing the URI in shell output or logs.
- **View logs:** open the Render service and use its Logs view; filter by deploy/time and check the health endpoint and Mongo connection messages. Vercel build/runtime deployment logs are available from the relevant project deployment. Never paste secrets or full database URIs into support logs.

For platform-specific configuration, see the [Render Blueprint reference](https://render.com/docs/blueprint-spec), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), and [MongoDB Atlas IP access list guidance](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## Project guidance

Read [AGENTS.md](./AGENTS.md) before making changes. Work is delivered task-by-task from the build plan, with tests and lint passing before moving on.
