*** Begin Patch
*** Update File: server/routes/auth.js
@@
-import express from "express";
-import bcrypt from "bcryptjs";
+import express from "express";
+import bcrypt from "bcryptjs";
+import rateLimit from 'express-rate-limit';
+import logger from '../utils/logger.js';
@@
-const router = express.Router();
+const router = express.Router();
+
+// Rate limiters
+const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { success: false, error: 'Too many login attempts, try again later.' } });
+const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, error: 'Too many signup attempts, try again later.' } });
@@
-router.post("/register", async (req, res) => {
+router.post("/register", signupLimiter, async (req, res) => {
@@
-  } catch (err) {
-    console.error("❌ Registration Error:", err && err.message ? err.message : 'Unknown error');
-    return res.status(500).json({
-      success: false,
-      error: "Server error during registration.",
-    });
-  }
+  } catch (err) {
+    logger.error({ msg: 'Registration Error', err: err && err.message ? err.message : 'Unknown' });
+    return res.status(500).json({ success: false, error: 'Server error during registration.' });
+  }
 });
@@
-router.post("/signin", async (req, res) => {
+router.post("/signin", loginLimiter, async (req, res) => {
@@
-  } catch (err) {
-    console.error("❌ Sign In Error:", err && err.message ? err.message : 'Unknown error');
-    return res.status(500).json({
-      success: false,
-      error: "Server error during sign in.",
-    });
-  }
+  } catch (err) {
+    logger.error({ msg: 'Sign In Error', err: err && err.message ? err.message : 'Unknown' });
+    return res.status(500).json({ success: false, error: 'Server error during sign in.' });
+  }
 });
*** End Patch
