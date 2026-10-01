import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { AppUser, AccountType } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: (accountType?: AccountType, inviteCode?: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, accountType: AccountType, inviteCode?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  const signUpWithEmail = async (email: string, pass: string, accountType: AccountType, inviteCode?: string) => {
    try {
      // If company, validate invite code first
      if (accountType === 'company') {
        if (!inviteCode) {
          throw new Error("Company accounts require an invite code for validation. Please contact your administrator.");
        }
        const inviteRef = doc(db, 'staffing_invitations', inviteCode.toUpperCase());
        const inviteSnap = await getDoc(inviteRef);
        if (!inviteSnap.exists() || inviteSnap.data().status !== 'pending') {
          throw new Error("Invalid or expired invite code.");
        }
      }

      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = result.user;
      const userRef = doc(db, 'users', firebaseUser.uid);

      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        accountType,
        profileCompleted: false,
        settings: {
          autoApply: false,
          matchThreshold: 0.8,
          notifications: true,
        },
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      // If invite code used, mark it as accepted
      if (inviteCode && accountType === 'company') {
        const inviteData = (await getDoc(doc(db, 'staffing_invitations', inviteCode.toUpperCase()))).data();
        newUser.staffingFirmName = inviteData?.targetFirmName;
        newUser.staffingRole = inviteData?.role;
        
        await setDoc(doc(db, 'staffing_invitations', inviteCode.toUpperCase()), {
          status: 'accepted',
          acceptedByUid: firebaseUser.uid,
          acceptedAt: serverTimestamp()
        }, { merge: true });
      }

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      setAppUser(newUser);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = result.user;
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        await setDoc(doc(db, 'users', firebaseUser.uid), { lastLogin: serverTimestamp() }, { merge: true });
        setAppUser({
          ...data,
          lastLogin: new Date(),
        } as AppUser);
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (accountType?: AccountType, inviteCode?: string) => {
    try {
      // If company signup, validate invite code first
      if (accountType === 'company') {
        if (!inviteCode) {
          throw new Error("Company accounts require an invite code for validation. Please contact your administrator.");
        }
        const inviteRef = doc(db, 'staffing_invitations', inviteCode.toUpperCase());
        const inviteSnap = await getDoc(inviteRef);
        if (!inviteSnap.exists() || inviteSnap.data().status !== 'pending') {
          throw new Error("Invalid or expired invite code.");
        }
      }

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

        // If invite code used, mark it as accepted and link firm
        if (inviteCode && accountType === 'company') {
          const inviteData = (await getDoc(doc(db, 'staffing_invitations', inviteCode.toUpperCase()))).data();
          newUser.staffingFirmName = inviteData?.targetFirmName;
          newUser.staffingRole = inviteData?.role;
          
          await setDoc(doc(db, 'staffing_invitations', inviteCode.toUpperCase()), {
            status: 'accepted',
            acceptedByUid: firebaseUser.uid,
            acceptedAt: serverTimestamp()
          }, { merge: true });
        }

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
    <AuthContext.Provider value={{ 
      user, 
      appUser, 
      loading, 
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logout, 
      updateAccountType 
    }}>
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
