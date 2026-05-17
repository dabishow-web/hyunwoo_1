import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { initializeFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, Timestamp, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfigInternal from '../firebase-applet-config.json';

// Use environment variables if available (prefixed with VITE_), fallback to the bundled config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigInternal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigInternal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigInternal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigInternal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigInternal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigInternal.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigInternal.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || firebaseConfigInternal.firestoreDatabaseId,
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to bypass potential proxy/connection issues
// This is critical for environments with restrictive networking or proxy layers.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// Connection Test as per Integration Guidelines
async function testConnection() {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    console.log(`[Firebase] Testing connection to Project: ${firebaseConfig.projectId}, Database: ${dbId}`);
    
    // Attempt a direct server fetch to verify connectivity
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    console.log('[Firebase] Connection test successful.');
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || 'unknown';
    
    console.error(`[Firebase] Connection test failed (Code: ${errorCode}):`, errorMessage);
    
    if (errorCode === 'unavailable') {
      console.error(">>> HINT: 'unavailable' often means the client cannot reach Google servers. This can be caused by network restrictions or the project being in a suspended/billing-required state.");
    } else if (errorCode === 'permission-denied') {
      console.error(">>> HINT: 'permission-denied' means the Security Rules are blocking access. Check firestore.rules.");
    }
  }
}
testConnection();

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const switchGoogleAccount = async () => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error switching Google account:', error);
    throw error;
  }
};

export { onAuthStateChanged };

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
