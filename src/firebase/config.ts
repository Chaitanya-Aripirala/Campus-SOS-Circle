import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Firebase Client Configuration
const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || 'restful-idea-4ghtt',
  appId: firebaseConfigJson.appId || '1:966844642031:web:20d119fc1135200d27611a',
  apiKey: firebaseConfigJson.apiKey || 'AIzaSyC49KAK7BeMJ-JS2H7WMLPUQlGutT8caBI',
  authDomain: firebaseConfigJson.authDomain || 'restful-idea-4ghtt.firebaseapp.com',
  storageBucket: firebaseConfigJson.storageBucket || 'restful-idea-4ghtt.firebasestorage.app',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '966844642031',
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with the provisioned database ID
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const db = initializeFirestore(app, {}, databaseId);

// Verify Cloud Firestore connection on initial boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Firestore client indicates offline mode. Checking network credentials.');
      return false;
    }
    // Permission denied or not-found confirms server-level connectivity
    return true;
  }
}

// Initial test trigger
testFirestoreConnection();
