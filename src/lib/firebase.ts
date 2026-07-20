import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs,
  where
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || (import.meta as any).env?.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.log('Firebase credentials missing. Running in client-side fallback mode with password persistence.');
}

export { auth, db, isFirebaseConfigured };

// Fallback password authentication and Firestore simulation using localStorage
export const localAuth = {
  signUp: async (email: string, pass: string) => {
    const users = JSON.parse(localStorage.getItem('local_users') || '{}');
    if (!users['samdonckels@gmail.com']) {
      users['samdonckels@gmail.com'] = 'Doing4ever!';
    }
    if (users[email]) {
      throw new Error('User already exists!');
    }
    users[email] = pass;
    localStorage.setItem('local_users', JSON.stringify(users));
    return { email };
  },
  signIn: async (email: string, pass: string) => {
    const users = JSON.parse(localStorage.getItem('local_users') || '{}');
    if (!users['samdonckels@gmail.com']) {
      users['samdonckels@gmail.com'] = 'Doing4ever!';
      localStorage.setItem('local_users', JSON.stringify(users));
    }
    if (!users[email] || users[email] !== pass) {
      throw new Error('Invalid email or password.');
    }
    return { email };
  }
};
