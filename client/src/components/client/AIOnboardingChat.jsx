@@
-      .then(data => {
-        if (data.success && data.record) {
-          setPostureData(data.record);
-        }
-      })
-      .catch(err => console.log("No posture scan found yet"));
+      .then(data => {
+        if (data.success && data.record) {
+          setPostureData(data.record);
+        }
+      })
+      .catch(() => console.debug('No posture scan found yet'));
*** End Patch
