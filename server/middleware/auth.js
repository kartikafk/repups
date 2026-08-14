import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production.");
}

/** Creates a signed session token for an authenticated user. */
export function signToken(user, role) {
  return jwt.sign(
    { id: (user._id || user.id).toString(), role: role || user.role },
    JWT_SECRET || "development-only-secret",
    { expiresIn: "7d" }
  );
}

/** Verifies the bearer token and attaches its identity to req.user. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Missing bearer token." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET || "development-only-secret");
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token." });
  }
}

/** Requires the authenticated user to have a particular role. */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, error: `Only ${role}s can do this.` });
    }
    next();
  };
}

/** True when the authenticated user belongs to the supplied trainer/client pair. */
export function isPairMember(req, trainerId, clientId) {
  return (
    (req.user.role === "trainer" && String(req.user.id) === String(trainerId)) ||
    (req.user.role === "client" && String(req.user.id) === String(clientId))
  );
}
