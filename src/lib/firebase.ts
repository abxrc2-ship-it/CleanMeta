import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { UserProfile } from '../types';

// Default configuration provided for CleanMeta project
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyCSoheNCR1iHSQi5SYleqwM0fvaq8u4TCY",
  authDomain: "cleanmeta-5ccc2.firebaseapp.com",
  projectId: "cleanmeta-5ccc2",
  storageBucket: "cleanmeta-5ccc2.firebasestorage.app",
  messagingSenderId: "416818303439",
  appId: "1:416818303439:web:169a70e876ae8c696ec2ba",
  measurementId: "G-NXFS2L7QVS",
};

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_CONFIG.apiKey;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.authDomain;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_CONFIG.projectId;
const appId = import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_CONFIG.appId;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.storageBucket;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_CONFIG.messagingSenderId;

export const isFirebaseConfigured = Boolean(apiKey && projectId && authDomain);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0
      ? initializeApp({
          apiKey,
          authDomain,
          projectId,
          storageBucket,
          messagingSenderId,
          appId,
        })
      : getApps()[0];

    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

/**
 * Friendly error message parser for Firebase authentication errors
 */
export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে। আবার চেষ্টা করুন।';
    case 'auth/email-already-in-use':
      return 'এই ইমেইলটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।';
    case 'auth/invalid-email':
      return 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।';
    case 'auth/operation-not-allowed':
      return 'Firebase Console-এ Email/Password অথেন্টিকেশন সক্রিয় (Enable) করা নেই। Authentication > Sign-in method-এ গিয়ে Email/Password এনাবল করুন।';
    case 'auth/unauthorized-domain':
      return 'বর্তমান ডোমেইনটি Firebase-এ অনুমোদিত নয়। Firebase Console > Authentication > Settings > Authorized Domains-এ আপনার ডোমেইনটি যোগ করুন।';
    case 'auth/popup-blocked':
      return 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ অনুমোদন করুন।';
    case 'auth/network-request-failed':
      return 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। আপনার সংযোগ পরীক্ষা করুন।';
    case 'auth/too-many-requests':
      return 'অতিরিক্ত ব্যর্থ চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
    default:
      return 'অথেন্টিকেশন ব্যর্থ হয়েছে। কোড: ' + errorCode;
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase configuration missing.');
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return formatUserProfile(credential.user);
}

/**
 * Register a new user with Email and Password
 */
export async function signUpWithEmail(email: string, pass: string, name?: string): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase configuration missing.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name && name.trim()) {
    try {
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch {
      // Non-blocking
    }
  }
  return formatUserProfile(credential.user);
}

/**
 * Initiates Google Sign-In. Uses popup on desktop and supports redirect fallback if preferred or blocked.
 */
export async function signInWithGoogle(): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error('Firebase configuration missing.');
  }

  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return formatUserProfile(result.user);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, googleProvider);
          return null;
        }
        throw popupErr;
      }
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return formatUserProfile(result.user);
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return null; // User cancelled, harmless
    }
    throw error;
  }
}

/**
 * Signs the user out of Firebase.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await fbSignOut(auth);
}

/**
 * Listens for Auth state changes.
 */
export function subscribeToAuthState(callback: (user: UserProfile | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user ? formatUserProfile(user) : null);
  });
}

function formatUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}
