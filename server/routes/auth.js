*** Begin Patch
*** Update File: server/routes/auth.js
@@
   } catch (err) {
-    console.error("❌ Registration Error:", err);
+    console.error("❌ Registration Error:", err && err.message ? err.message : 'Unknown error');
     return res.status(500).json({
       success: false,
       error: "Server error during registration.",
     });
   }
 });
@@
   } catch (err) {
-    console.error("❌ Sign In Error:", err);
+    console.error("❌ Sign In Error:", err && err.message ? err.message : 'Unknown error');
     return res.status(500).json({
       success: false,
       error: "Server error during sign in.",
     });
   }
 });
*** End Patch
