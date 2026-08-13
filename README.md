# FormCoach — MERN Stack

Real-time camera-based exercise form tracking: rep counting, tempo (eccentric/pause/concentric),
form-mistake detection with live voice cues, and a form-score report after each set — saved to MongoDB
so you can review past sessions.

**Stack**
- **Frontend:** React (Vite) + `@mediapipe/tasks-vision` for on-device pose detection — this part
  has to run in the browser, since it needs direct access to your phone's camera frame-by-frame.
- **Backend:** Node.js + Express — REST API that stores each set's report.
- **Database:** MongoDB — stores exercise, reps, tempo, form score, and recurring issues per session.

```
formcoach-mern/
├── server/          Express API + MongoDB models
└── client/          React app (camera, pose tracking, UI)
```

---

## 1. Prerequisites

- [Node.js](https://nodejs.org) v18 or newer (includes npm) — installed on your **computer**, not your phone
- A MongoDB database — easiest option is a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (no local install needed). Local MongoDB also works if you already have it.
- Your phone and computer on the **same Wi-Fi network** (for local testing)

---

## 2. Set up the backend

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and set `MONGODB_URI` to your connection string:
- **Atlas:** from your cluster, click "Connect" → "Drivers" → copy the string, replace `<password>`
- **Local Mongo:** `mongodb://127.0.0.1:27017/formcoach`

Start the API:

```bash
npm run dev
```

You should see `MongoDB connected` and `FormCoach API running on port 5000`. Leave this terminal running.

---

## 3. Set up the frontend

Open a **second terminal**:

```bash
cd client
npm install
cp .env.example .env
```

The default `VITE_API_URL=http://localhost:5000/api` is fine for now.

Start the dev server with your computer's network exposed (already configured in `package.json`):

```bash
npm run dev
```

You'll see something like:

```
Local:   http://localhost:5173/
Network: http://192.168.1.42:5173/
```

That `Network` address is what your phone will use.

---

## Security & deployment notes
- Rotate any secrets that were previously committed to git history immediately.
- Ensure .env is in .gitignore and never committed.
- Required production env vars: MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN.
