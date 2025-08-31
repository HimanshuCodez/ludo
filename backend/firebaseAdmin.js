import admin from "firebase-admin";
import { createRequire } from "module";

let initializedAdmin = null;

try {
  const require = createRequire(import.meta.url);
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initializedAdmin = admin;
  console.log("[Server] Firebase Admin SDK initialized successfully.");

} catch (error) {
  console.error("[Server] CRITICAL: Firebase Admin SDK initialization failed.", error);
  // The server will now fail on the first database call instead of on startup,
  // which makes the actual error easier to find in the logs.
}

export default initializedAdmin;
