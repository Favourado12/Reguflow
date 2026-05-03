import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let db: Firestore | undefined;
let auth: Auth | undefined;
let isFirebaseConfigured = false;

try {
  // Check if config has placeholders - No longer placeholders after set_up_firebase
  if (firebaseConfig.projectId && !firebaseConfig.projectId.includes('remixed-')) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    isFirebaseConfigured = true;
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db, auth, isFirebaseConfigured };
