import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// This function initializes Firebase Admin
function initializeFirebaseAdmin() {
  // If the app is already initialized, don't do it again.
  if (admin.apps.length > 0) {
    return;
  }

  // Render and other platforms store environment variables as strings.
  // We check if the service account key is in an environment variable first.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "life-ludo-d89c0.appspot.com",
      });
      console.log("[Server] Firebase Admin initialized using environment variable.");
    } catch (e) {
      console.error("[Server] Error parsing FIREBASE_SERVICE_ACCOUNT env var:", e);
    }
  } else {
    // Fallback for local development: read from a file.
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "life-ludo-d89c0.appspot.com",
      });
      console.log("[Server] Firebase Admin initialized using file.");
    } else {
      console.error("[Server] Firebase service account key file not found and FIREBASE_SERVICE_ACCOUNT env var is not set.");
    }
  }
}

initializeFirebaseAdmin();

export default admin;
