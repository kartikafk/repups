@@
-    console.log("📥 [WorkoutSessionPlayer] Fetching sets for userId:", userId);
+    // avoid logging user identifiers to console (PII)
@@
-        const res = await fetch(`/api/sessions?${query.toString()}`);
+        const res = await fetch(`/api/sessions?${query.toString()}`);
@@
-      } catch (err) {
-        console.error('Failed to load set history:', err);
-      }
+      } catch (err) {
+        console.error('Failed to load set history');
+      }
*** End Patch
