import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * Call this from auth.js / trainerAuth.js after a successful
 * register/signin and include the result in the JSON response as `token`.
 */
export function signToken(user, role) {
  return jwt.sign(
    { id: (user._id || user.id).toString(), role: role || user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * requireAuth
 * Verifies the bearer token and attaches { id, role } to req.user.
 * Every protected route should read identity from req.user — never
 * from req.body/req.query — or "trainer/client specific" is just a
 * UI convention, not an actual guarantee.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing bearer token." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token." });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, error: `Only ${role}s can do this.` });
    }
    next();
  };
}

/** True if the authenticated user is the trainer or the client in this pair. */
export function isPairMember(req, trainerId, clientId) {
  return (
    (req.user.role === "trainer" && String(req.user.id) === String(trainerId)) ||
    (req.user.role === "client" && String(req.user.id) === String(clientId))
  );
}