import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { OperationType, FirestoreErrorInfo } from './types';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth();

// Initialize Google OAuth provider with workspace calendar scope
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');

// Caching for OAuth Access Token using localStorage for seamless persistence
let isSigningIn = false;
let cachedAccessToken: string | null = null;
const TOKEN_LIFETIME_MS = 3500 * 1000; // 3500 seconds (slightly less than 1 hour for safety)

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== 'undefined') {
        const token = localStorage.getItem('google_access_token');
        const expiresAtStr = localStorage.getItem('google_access_token_expires_at');
        const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

        if (token && expiresAt > Date.now()) {
          cachedAccessToken = token;
        } else {
          cachedAccessToken = null;
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_access_token_expires_at');
        }
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_access_token_expires_at');
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google OAuth.');
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', cachedAccessToken);
      const expiresAt = Date.now() + TOKEN_LIFETIME_MS;
      localStorage.setItem('google_access_token_expires_at', expiresAt.toString());
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const guestSignIn = async (): Promise<{ user: User } | null> => {
  try {
    isSigningIn = true;
    const result = await signInAnonymously(auth);
    return { user: result.user };
  } catch (error: any) {
    console.error('Guest signing in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('google_access_token');
    const expiresAtStr = localStorage.getItem('google_access_token_expires_at');
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

    if (token && expiresAt > Date.now()) {
      cachedAccessToken = token;
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_access_token_expires_at');
    }
  }
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_access_token_expires_at');
  }
};

/**
 * Handle firestore authorization rules errors robustly according to standard skill rules.
 * Throws a JSON-serialized Error that the preview runner can inspect to refine firestore rules automatically.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Rule Violation or Network Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
