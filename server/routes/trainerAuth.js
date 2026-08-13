*** Begin Patch
*** Update File: server/routes/trainerAuth.js
@@
-  } catch (err) {
-    console.error('❌ Nearby Trainers Error:', err);
-    return res.status(500).json({ success: false, error: 'Server error while fetching nearby trainers.' });
-  }
+  } catch (err) {
+    logger.error({ msg: 'Nearby Trainers Error', err: err && err.message ? err.message : 'Unknown' });
+    return res.status(500).json({ success: false, error: 'Server error while fetching nearby trainers.' });
+  }
 });
*** End Patch
