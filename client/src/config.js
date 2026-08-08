// Central place for environment-driven config.
// In development, create a `.env` file at your project root with:
//   REACT_APP_API_URL=http://localhost:5001
// In production (Vercel/Netlify/your host), set REACT_APP_API_URL to your
// real API domain as an environment variable in the hosting dashboard.


export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";