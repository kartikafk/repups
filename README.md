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

## 4. Test it on your phone

**Important:** phone browsers only allow camera access (`getUserMedia`) over a secure (`https://`)
connection, or on `localhost` itself. Your computer's `http://192.168.x.x:5173` address is **not**
secure, so the phone's camera will be blocked if you open that link directly. The fastest fix is a
free tunnel:

### Step-by-step (ngrok — recommended for quick testing)

1. Install [ngrok](https://ngrok.com/download) on your computer and sign up for a free account.
2. With the client dev server still running (Step 3), open a **third terminal** and run:
   ```bash
   ngrok http 5173
   ```
3. ngrok prints a URL like `https://a1b2-c3d4.ngrok-free.app` — that's a secure, internet-reachable
   address for your local dev server.
4. On your phone, open that `https://...ngrok-free.app` URL in Safari (iPhone) or Chrome (Android).
5. Tap **"Start camera & begin set"** and allow camera permission when prompted.
6. Do a few reps — you should see the skeleton overlay, live rep count, tempo, and voice cues.
7. Tap **"End Set → Report"** to see your form score. It'll try to save to your backend — since the
   backend is only reachable on your local network (not through the ngrok tunnel), you can either:
   - run `ngrok http 5000` in a fourth terminal too, and update `VITE_API_URL` in `client/.env` to
     that ngrok URL + `/api`, then restart `npm run dev`, **or**
   - ignore the save error for now — the report still displays fully either way.

### Install it like an app (optional, once you're testing over https)

- **Android/Chrome:** you'll see an "Install FormCoach to home screen" button on the start screen.
- **iPhone/Safari:** tap the Share icon → "Add to Home Screen".

Either way it opens full-screen without browser chrome, and (after first load) works offline for
everything except saving/loading reports.

### Longer-term: real hosting instead of tunnels

For something more permanent than an ngrok session:
- Deploy `client/` to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (free, automatic https)
- Deploy `server/` to [Render](https://render.com) or [Railway](https://railway.app) (free tier, automatic https)
- Use MongoDB Atlas for the database (already set up in Step 2)
- Set `VITE_API_URL` in the client's environment variables to your deployed backend's URL + `/api`

Then the URL just works on any phone, permanently, no tunnel needed.

---

## 5. Editing the app

- **Rep-counting / scoring logic:** `client/src/hooks/usePoseTracker.js`
- **Form-mistake rules & thresholds:** `client/src/exercises.js`
- **Screens:** `client/src/components/StartScreen.jsx`, `CameraView.jsx`, `ReportView.jsx`
- **Styling / colors:** `client/src/styles.css`
- **API routes:** `server/routes/sessions.js`
- **Database schema:** `server/models/Session.js`

To add a new exercise, add an entry to `EXERCISES` in `client/src/exercises.js` with its driving
joint angle and top/bottom/depth thresholds, then add a matching card in `StartScreen.jsx`.

---

## 6. Viewing saved history (API only for now)

The backend already stores every set. To check saved sessions directly:

```bash
curl http://localhost:5000/api/sessions
```

A dedicated "History" screen in the UI isn't built yet — the API and schema are ready for it if you
want to add one.
