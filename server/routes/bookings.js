*** Begin Patch
*** Update File: server/routes/bookings.js
@@
-  } catch (err) {
-    // avoid logging raw error objects that may contain PII
-    const msg = err && err.message ? err.message : 'Unknown error';
-    console.error('❌ Publish Slots Error:', msg);
-    return res.status(500).json({ success: false, error: 'Server error while publishing slots.' });
-  }
+  } catch (err) {
+    // avoid logging raw error objects that may contain PII
+    const msg = err && err.message ? err.message : 'Unknown error';
+    logger.error({ msg: 'Publish Slots Error', err: msg });
+    return res.status(500).json({ success: false, error: 'Server error while publishing slots.' });
+  }
 });
*** End Patch
