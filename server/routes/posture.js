*** Begin Patch
*** Update File: server/routes/posture.js
@@
-  } catch (err) {
-    logger.error('Posture Save Error: ' + (err && err.message));
-    return res.status(500).json({ success: false, error: 'Internal server error while saving posture report.' });
-  }
+  } catch (err) {
+    logger.error({ msg: 'Posture Save Error', err: err && err.message ? err.message : 'Unknown' });
+    return res.status(500).json({ success: false, error: 'Internal server error while saving posture report.' });
+  }
 });
@@
-  } catch (err) {
-    logger.error('Posture Fetch Error: ' + (err && err.message));
-    return res.status(500).json({ success: false, error: 'Server error while fetching posture record.' });
-  }
+  } catch (err) {
+    logger.error({ msg: 'Posture Fetch Error', err: err && err.message ? err.message : 'Unknown' });
+    return res.status(500).json({ success: false, error: 'Server error while fetching posture record.' });
+  }
 });
*** End Patch
