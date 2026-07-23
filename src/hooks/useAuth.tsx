import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { AppUser, AccountType } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: (accountType?: AccountType) => Promise<void>;
  logout: () => Promise<void>;
  updateAccountType: (type: AccountType) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence to local to ensure session persists across refreshes
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log("Firebase user detected:", firebaseUser.uid);
        try {
          // Fetch custom user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            console.log("User doc found for:", firebaseUser.uid);
            setAppUser({
              ...userDoc.data(),
              createdAt: userDoc.data().createdAt?.toDate(),
              lastLogin: userDoc.data().lastLogin?.toDate(),
            } as AppUser);
          } else {
            console.warn("User doc not found for:", firebaseUser.uid);
            setAppUser(null);
          }
        } catch (err) {
          console.error("Error fetching user doc in hook:", err);
          setAppUser(null);
        }
      } else {
        console.log("No Firebase user detected");
        setAppUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (accountType?: AccountType) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists() && accountType) {
        const newUser: Partial<AppUser> = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          accountType,
          profileCompleted: false,
          settings: {
            autoApply: false,
            matchThreshold: 0.8,
            notifications: true,
          }
        };

        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });

        setAppUser({
          ...newUser,
          createdAt: new Date(),
          lastLogin: new Date(),
        } as AppUser);
      } else if (!userDoc.exists() && !accountType) {
        // They tried to sign in without an account type and they don't have an account
        await signOut(auth);
        throw new Error("You don't have an account yet. Please select an account type above to join.");
      } else if (userDoc.exists()) {
        const data = userDoc.data();
        if (accountType && data.accountType && data.accountType !== accountType) {
          await signOut(auth);
          throw new Error(`You already have an account as a ${data.accountType === 'company' ? 'Company' : 'Job Seeker'}. Please sign in without selecting a different role or select your existing role.`);
        }
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        setAppUser({
          ...data,
          lastLogin: new Date(),
        } as AppUser);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const updateAccountType = async (type: AccountType) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { accountType: type }, { merge: true });
    setAppUser(prev => prev ? { ...prev, accountType: type } : null);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signInWithGoogle, logout, updateAccountType }}>
      {children}
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
