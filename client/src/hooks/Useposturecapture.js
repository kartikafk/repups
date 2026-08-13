@@
-      } catch (err) {
-      console.error('Posture capture detection failed:', err);
-      return { landmarks: null, imageDataUrl };
-    }
+      } catch (err) {
+      console.error('Posture capture detection failed');
+      return { landmarks: null, imageDataUrl };
+    }
*** End Patch
