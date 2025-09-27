import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
    throw new Error(getAuthErrorMessage(errorCode));
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out');
  }
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen for authentication state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Get user-friendly error messages
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No user found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'Authentication failed. Please try again';
  }
}
