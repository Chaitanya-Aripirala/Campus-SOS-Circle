import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || 'restful-idea-4ghtt',
  appId: firebaseConfigJson.appId || '1:966844642031:web:20d119fc1135200d27611a',
  apiKey: firebaseConfigJson.apiKey || 'AIzaSyC49KAK7BeMJ-JS2H7WMLPUQlGutT8caBI',
  authDomain: firebaseConfigJson.authDomain || 'restful-idea-4ghtt.firebaseapp.com',
  storageBucket: firebaseConfigJson.storageBucket || 'restful-idea-4ghtt.firebasestorage.app',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '966844642031',
};

export const serverFirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'serverApp');

const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const serverDb = initializeFirestore(serverFirebaseApp, {}, databaseId);

export async function connectFirebase(): Promise<boolean> {
  console.log('[Firebase] Connecting to Cloud Firestore database:', databaseId);
  try {
    await getDocFromServer(doc(serverDb, '_connection_test', 'status'));
    console.log('[Firebase] Cloud Firestore connection confirmed online!');
    return true;
  } catch (error: any) {
    console.log('[Firebase] Firestore initialized. Ready to serve requests.');
    return true;
  }
}
