@@
-      } catch (err) {
-        console.error("❌ Failed to fetch trainer profile:", err);
-      }
+      } catch (err) {
+        console.warn('Failed to fetch trainer profile');
+      }
     };
     fetchTrainerProfile();
   }, [initialTrainerId]);
*** End Patch
