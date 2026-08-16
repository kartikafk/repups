# Codex change log

This file records changes made by Codex in this workspace. Each entry explains what changed and why.

## 2026-08-13 — Source repair and admin panel

### Application repairs

- Restored JavaScript and JSX files that had accidentally been replaced with raw patch markers such as `*** Begin Patch` and `@@`.
  - This fixed server startup syntax errors in authentication and route modules.
  - This fixed Vite parsing errors in the client components.
- Restored the missing server dependencies in `server/package.json` and installed them.
  - The server previously failed at startup because imports such as `helmet` were absent from `node_modules`.
- Restored the client API configuration helpers and authentication-header helper.
  - This fixed client imports of `apiUrl`, `API_ORIGIN`, and `authHeaders`.
- Restored compatible versions of the trainer dashboard and workout-session player.
  - This fixed unresolved imports and a truncated JSX component.

### Admin backend

- Added the `admin` user role, account status, and soft-deletion timestamp to `server/models/User.js`.
- Added an `AuditLog` model and audit utility for recording administrative actions.
- Added `server/routes/admin.js`, protected by the existing JWT authentication and `admin` role guard.
  - Includes health and dashboard statistics.
  - Includes searchable/paginated user lists and user suspension/reactivation.
  - Includes user anonymization and user-data export.
  - Includes session, booking, and audit-log retrieval.
- Mounted the admin API at `/api/admin` in `server/server.js`.
- Added `accountStatus` to trainer records so admin account controls work for trainers too.
- Added `server/scripts/createAdmin.js` for provisioning an administrator from the command line:

  ```cmd
  npm run admin:create -- "Name" admin@example.com "strong-password"
  ```

### Admin frontend

- Added `client/src/admin/AdminPanel.jsx`.
  - Admin sign-in page: `/admin/login`.
  - Protected admin dashboard: `/admin`.
  - Dashboard statistics, user search/filtering, account suspension controls, and audit-log list.
- Registered the admin routes in `client/src/App.jsx`.

### Verification

- Ran server JavaScript syntax checks successfully.
- Ran `npm run build` in `client` successfully.

### Pending

- The branch/commit/push/PR step is pending explicit approval to upload the current full `client` and `server` change set to `github.com/kartikafk/repups`.

## 2026-08-16 — Deployment dependencies and service inventory

### Packages installed or corrected for deployment

- `client/@vitejs/plugin-basic-ssl@1.2.0` is now declared in `client/package.json`.
  - It is imported by `client/vite.config.js` for local HTTPS development and must be present whenever Vite loads that configuration during a production build.
  - Version 1.2.0 is compatible with this project's Vite 5 version.
- `client/react-router-dom@7.18.2` was updated from 7.18.1 to remove the audited production vulnerability.
  - It provides browser routing for client, trainer, and admin pages.
- `client/dompurify@3.4.13` was added at a patched version to resolve the audited transitive DOMPurify vulnerability.
  - It is included through the PDF/UI dependency tree.

Verification after these changes:

- `server`: production dependency audit reports 0 vulnerabilities.
- `client`: production dependency audit reports 0 vulnerabilities.
- `client`: `npm run build` completes successfully.

### Application dependencies already required in production

| Area | Dependency | Used for |
| --- | --- | --- |
| Client | React, React DOM, React Router | Browser UI and role-based routes. |
| Client | Vite and `@vitejs/plugin-react` | Building the static frontend bundle. |
| Client | `@mediapipe/tasks-vision` | Browser-side pose landmarks for posture and exercise tracking. |
| Client | jsPDF and html2canvas | Generating posture assessment PDFs in the browser. |
| Client | Socket.IO client | Real-time client/trainer messages. |
| Server | Node.js 22+ | Express API runtime; enforced by `server/package.json`. |
| Server | Express, Mongoose, JWT, bcryptjs | API routing, MongoDB access, authenticated roles, and passwords. |
| Server | Socket.IO | Real-time message transport. |
| Server | BullMQ and IORedis | Nightly cohort-range recalculation and ML export/retrain scheduling. |
| Server | Multer and Streamifier | Profile/community upload handling. |
| Server | Helmet, CORS, express-rate-limit, Pino | HTTP hardening, origin control, rate limits, and structured logs. |
| ML service | Python 3.11, FastAPI, Uvicorn | ML HTTP service and runtime. |
| ML service | pandas, PyArrow, PyMongo | Exporting derived assessment/session features from MongoDB to Parquet. |
| ML service | scikit-learn and Joblib | Isolation Forest training, persistence, and prediction. |

`multer` is currently listed in `client/package.json` but is not imported by client source. It is not required for the browser deployment; retain the server copy only if cleaning dependencies later.

### Deployment infrastructure (not npm/pip packages)

| Service | Required state | Used by |
| --- | --- | --- |
| Static hosting/CDN | Required | Hosts the generated `client/dist` files. |
| Node container/host | Required | Runs `server/server.js` on `PORT`. |
| Python container/host | Required for ML | Runs `ml-service` on port 8000. |
| MongoDB Atlas | Required | Stores users, posture records, sessions, plans, messages, and ML metadata. |
| Redis/Upstash Redis | Required for scheduled ML jobs | BullMQ queue used by `server/jobs/mlSchedule.js`. Set `REDIS_URL`; the code does not read `UPSTASH_REDIS_URL`. |
| HTTPS and reverse proxy/platform TLS | Required | Terminates public HTTPS and routes the frontend/API safely. |
| Persistent storage/volume | Required when ML models must survive container replacement | Keeps `ml-service/app/models_store` and exported datasets. |

The supplied Docker Compose stack starts Mongo and Redis for local development. In production, the server and ML service read `server/.env`; use Atlas and a managed Redis instance rather than exposing local database ports publicly.

### Environment variables and API/service keys

#### Required for the deployed application

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Node server | Must be `production` in a live environment. |
| `PORT` | Node server | API listener port. |
| `MONGODB_URI` | Node server and ML service | Atlas database connection. |
| `TRAINER_MONGO_URI` | Trainer model connection | Trainer database connection; can be a distinct Atlas database. |
| `JWT_SECRET` | Auth and sockets | Signs and verifies login tokens; use a new long random secret. |
| `CLIENT_ORIGIN` | CORS | Comma-separated public frontend origins. |
| `VITE_API_URL` | Browser bundle | Public API base URL, normally `https://api.your-domain/api`. |
| `REDIS_URL` | BullMQ | Redis connection string for scheduled ML work. |
| `ML_SERVICE_URL` | Node server | Internal URL of the FastAPI ML service. |

#### Present in the environment template but currently missing values

| Variable(s) | Service | Current code status |
| --- | --- | --- |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary | Empty. Package exists, but current upload code uses local `uploads/`; configure and wire storage before relying on Cloudinary in production. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay | Empty. Package exists; no active payment API route was found. |
| `RESEND_API_KEY` | Resend | Empty. Package exists; no active email-send integration was found. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Twilio | Empty. Package exists; no active SMS/WhatsApp send integration was found. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push | Public/private keys are empty. Package exists; active push-send wiring was not found. |
| `LLM_API_KEY`, `LLM_PROVIDER_URL` | AI Coach | Optional. The current AI Coach deliberately returns an offline/mock response; these variables do not yet invoke a provider. |
| `DAILY_API_KEY` | Video sessions | Optional. `server/services/videoProvider.js` is currently a stub returning example room URLs/tokens. |

`EMAIL_FROM`, `PUBLIC_BASE_URL`, and `LOG_LEVEL` are configured operational values, not third-party API keys. `MIN_NEW_ROWS_FOR_RETRAIN` controls ML retraining cadence after the first trained model.

### Secret-handling rule

Never put any of these values in `client/.env` unless they are intentionally public `VITE_*` values. Keep server secrets in the hosting platform's secret manager or `server/.env`, do not commit `.env`, and rotate any key that has been pasted into a chat, terminal screenshot, or repository history.

### Docker and ML data inspection commands

Run these commands from the repository root in **Command Prompt** (`cmd`). They use the ML container's configured Atlas connection and do not require pasting a database URI into the terminal.

#### Container status and health

```cmd
docker compose ps
curl http://localhost:5001/api/health
curl http://localhost:8000/ml/v1/health
docker compose logs --tail=100 server ml-service
```

#### Latest saved posture assessment

This displays the latest posture record without the large base64 camera images. It includes joint/plane data, findings, `featureVector`, `baseline`, and `ml` fields.

```cmd
docker compose exec ml-service python -c "from app.data.mongo_client import database; from bson.json_util import dumps; r=database().posturerecords.find_one({}, sort=[('createdAt',-1)]); r.pop('images',None); print(dumps(r, indent=2))"
```

#### All stored posture/session counts

```cmd
docker compose exec ml-service python -c "from app.data.mongo_client import database; d=database(); print({'postureRecords':d.posturerecords.count_documents({}),'sessions':d.sessions.count_documents({}),'bodyProportions':d.bodyproportions.count_documents({}),'cohortRanges':d.cohortranges.count_documents({})})"
```

#### Saved body-proportion metadata

```cmd
docker compose exec ml-service python -c "from app.data.mongo_client import database; from bson.json_util import dumps; print(dumps(list(database().bodyproportions.find()), indent=2))"
```

#### Export data for the ML service and inspect it

Force an export/training check after saving a posture assessment or workout session:

```cmd
curl -X POST http://localhost:8000/ml/v1/pipeline/export-train
```

View the numeric posture feature dataset used for Isolation Forest training:

```cmd
docker compose exec ml-service python -c "import pandas as pd; df=pd.read_parquet('app/datasets/posture_features_v1.parquet'); print('Rows:',len(df)); print('Columns:',list(df.columns)); print(df.to_string(index=False))"
```

List persisted dataset/model files:

```cmd
docker compose exec ml-service sh -c "ls -lah app/datasets app/models_store"
```

#### Training thresholds

- Every saved assessment/session can produce a `featureVector` immediately.
- Cohort z-scores require at least 30 comparable body-proportion profiles.
- A first Isolation Forest model requires 500 usable numeric rows per data key (for example `posture` or `Bench Press`).
- Once a model exists, retraining requires at least 50 new rows, controlled by `MIN_NEW_ROWS_FOR_RETRAIN`.
