*** Begin Patch
*** Update File: server/routes/bookings.js
@@
-    return res.status(201).json({ success: true, slots: inserted });
+    return res.status(201).json({ success: true, slots: inserted });
   } catch (err) {
-    console.error("❌ Publish Slots Error:", err);
-    return res.status(500).json({ success: false, error: "Server error while publishing slots." });
+    // avoid logging raw error objects that may contain PII
+    const msg = err && err.message ? err.message : 'Unknown error';
+    console.error('❌ Publish Slots Error:', msg);
+    return res.status(500).json({ success: false, error: 'Server error while publishing slots.' });
   }
 });
*** End Patch
