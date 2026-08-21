# Events & Gyms implementation audit — 2026-08-17

## Existing architecture

1. **Events:** `server/models/Feature.js` contains a minimal `Event` schema and `server/routes/features.js` exposes `GET /api/events` and a direct client-only `POST /api/events/:id/register` endpoint. The existing client screen is `client/src/components/client/EventsGymsPage.jsx` at `/client/events-gyms`.
2. **Gyms:** the same model file contains a minimal `Gym` schema. `GET /api/gyms` lists all gyms. No detail, filtering, plans, saved-gym, map-data, membership, or checkout endpoint exists.
3. **Payments:** Razorpay is installed in `server/package.json` and the `.env` pattern has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, but the existing events/gyms functionality does not create orders or verify payments.
4. **Reusable pieces:** JWT middleware (`requireAuth`, `requireRole`), `Notification` model, existing `/api/features` router mounting, `apiUrl()` and `authHeaders()` client helpers, and the existing Razorpay environment variables.

## Missing dependencies/features being added

- Event detail, quote, pending registration, secure Razorpay order and verification, confirmation lookup, and client-owned registration APIs.
- Gym list filters, detail, membership-plan quote/order/verification, saved gyms, and client-owned membership APIs.
- Event registration and gym membership records, richer Event/Gym fields and indexes.
- Mobile-first pages for the supplied events and gyms flow, registered under the existing `/client/...` paths.
- A development-only seed script, never run automatically.

## Files planned for modification/creation

- `server/models/Feature.js`
- `server/routes/features.js`
- `server/scripts/seedEventsGyms.js`
- `client/src/components/client/EventsGymsPage.jsx`
- `client/src/components/client/EventsGymsFlow.jsx`
- `client/src/App.jsx`
- `CODEX_CHANGES.md` (final implementation and test notes)
