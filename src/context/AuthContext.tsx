import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithPhonePassword: (phone: string, pass: string) => Promise<void>;
  signUpWithPhonePassword: (phone: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setError(null);
      
      if (user) {
        // Automatically ensure user profile document exists in Firestore users collection
        const userDocRef = doc(db, "users", user.uid);
        try {
          const isPhoneEmail = user.email?.endsWith('@phone.findora.app');
          const phoneFromEmail = isPhoneEmail ? user.email?.split('@')[0] : '';
          const resolvedPhone = user.phoneNumber || phoneFromEmail || '';

          const updateData: any = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "Findora Protected User",
            createdAt: new Date().toISOString()
          };

          if (resolvedPhone) {
            updateData.phoneNumber = resolvedPhone;
          }

          await setDoc(userDocRef, updateData, { merge: true });
        } catch (err) {
          // Gracefully log or throw as required by Section 3 guidelines
          console.warn("User Firestore profile sync deferred or blocked:", err);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err?.message || "Google single sign-on failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      let friendlyError = err?.message || "Failed to sign in.";
      if (err?.code === "auth/operation-not-allowed") {
        friendlyError = "Email/Password sign-in is disabled in your Firebase console. Please enable it under Auth -> Sign-in method, or sign in using the Google Account button.";
      } else if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        friendlyError = "Invalid email or password. Please try again.";
      }
      setError(friendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Force sync with custom display name
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: email,
        displayName: name,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (err: any) {
      let friendlyError = err?.message || "Failed to create an account.";
      if (err?.code === "auth/operation-not-allowed") {
        friendlyError = "Email/Password sign-up is disabled in your Firebase console. Please enable it under Auth -> Sign-in method, or sign in using the Google Account button.";
      } else if (err?.code === "auth/email-already-in-use") {
        friendlyError = "This email is already in use.";
      } else if (err?.code === "auth/weak-password") {
        friendlyError = "Password should be at least 6 characters.";
      }
      setError(friendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhonePassword = async (phone: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const email = `${phone.replace(/[^0-9+]/g, '')}@phone.findora.app`;
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      let friendlyError = err?.message || "Failed to sign in.";
      if (err?.code === "auth/operation-not-allowed") {
        friendlyError = "Phone/Password sign-in is disabled in your Firebase console. Please enable Email/Password under Auth -> Sign-in method, or sign in using the Google Account button.";
      } else if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        friendlyError = "Invalid phone number or password. Please try again.";
      }
      setError(friendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPhonePassword = async (phone: string, pass: string, name?: string) => {
    setError(null);
    setLoading(true);
    try {
      const email = `${phone.replace(/[^0-9+]/g, '')}@phone.findora.app`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const resolvedName = name?.trim() || phone;
      await updateProfile(userCredential.user, { displayName: resolvedName });
      
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        phoneNumber: phone,
        displayName: resolvedName,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (err: any) {
      let friendlyError = err?.message || "Failed to create an account.";
      if (err?.code === "auth/operation-not-allowed") {
        friendlyError = "Phone/Password sign-up is disabled in your Firebase console. Please enable Email/Password under Auth -> Sign-in method, or sign in using the Google Account button.";
      } else if (err?.code === "auth/email-already-in-use") {
        friendlyError = "This phone number is already registered.";
      } else if (err?.code === "auth/weak-password") {
        friendlyError = "Password should be at least 6 characters.";
      }
      setError(friendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err?.message || "Sign out failed.");
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    setError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhonePassword,
    signUpWithPhonePassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
