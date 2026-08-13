*** Begin Patch
*** Update File: server/middleware/auth.js
@@
-import jwt from "jsonwebtoken";
-
-const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
+import jwt from "jsonwebtoken";
+
+const JWT_SECRET = process.env.JWT_SECRET;
+if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
+  throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
+}
+const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h';
@@
-  return jwt.sign(
-    { id: (user._id || user.id).toString(), role: role || user.role },
-    JWT_SECRET,
-    { expiresIn: "7d" }
-  );
+  return jwt.sign(
+    { id: (user._id || user.id).toString(), role: role || user.role },
+    JWT_SECRET,
+    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
+  );
*** End Patch
