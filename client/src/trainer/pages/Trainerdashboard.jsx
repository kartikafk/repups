@@
-    try {
-      const storedUser = localStorage.getItem("user");
-      if (storedUser) {
-        const parsed = JSON.parse(storedUser);
-        trainerId = parsed._id || parsed.id;
-      }
-    } catch (err) {
-      console.error("Error reading stored user from localStorage", err);
-    }
+    try {
+      const storedUser = localStorage.getItem('user');
+      if (storedUser) {
+        const parsed = JSON.parse(storedUser);
+        trainerId = parsed._id || parsed.id;
+      }
+    } catch (err) {
+      console.warn('Error reading stored user from localStorage');
+    }
*** End Patch
