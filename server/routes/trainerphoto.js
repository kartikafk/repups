*** Begin Patch
*** Update File: server/routes/trainerphoto.js
@@
-router.post('/:id/photo', requireAuth, (req, res) => {
+router.post('/:id/photo', requireAuth, (req, res) => {
@@
-    if (err) {
-      logger.warn('Trainer photo upload error: ' + (err && err.message));
-      return res.status(400).json({ success: false, error: 'Invalid photo upload.' });
-    }
+    if (err) {
+      logger.warn('Trainer photo upload error: ' + (err && err.message));
+      return res.status(400).json({ success: false, error: 'Invalid photo upload.' });
+    }
*** End Patch
