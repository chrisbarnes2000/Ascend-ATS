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
import { doc, getDoc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { AppUser, AccountType } from '../types';
import { normalizeEmail, checkRoleSwitchRateLimit, generateArchiveProfilePath } from '../utils/identityGovernance';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  isProfileConfigured: boolean;
  profileCheckLoading: boolean;
  signInWithGoogle: (accountType?: AccountType, inviteCode?: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, accountType: AccountType, inviteCode?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAccountType: (type: AccountType) => Promise<void>;
  resetProfileSetup: (newAccountType: AccountType) => Promise<void>;
  recheckProfileConfigured: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileConfigured, setIsProfileConfigured] = useState<boolean>(true);
  const [profileCheckLoading, setProfileCheckLoading] = useState<boolean>(false);

  const checkProfileConfigured = async (uid: string, accountType?: AccountType, email?: string | null): Promise<boolean> => {
    const isAdmin = email === 'Chris.Barnes.2000@me.com' || uid === '393uzPXnOdPW3CE3rdhmDMEldzm1' || accountType === 'admin';
    if (isAdmin) return true;
    if (!accountType) return false;

    try {
      if (accountType === 'jobSeeker') {
        const snap = await getDoc(doc(db, `users/${uid}/profiles/main`));
        return snap.exists();
      } else if (accountType === 'recruiter') {
        const snap = await getDoc(doc(db, `users/${uid}/profiles/recruiter`));
        return snap.exists();
      } else if (accountType === 'company' || accountType === 'companyOwner' || accountType === 'staffingFirm') {
        const snap = await getDoc(doc(db, `users/${uid}/profiles/company`));
        return snap.exists();
      }
      return false;
    } catch (e) {
      console.error("Error verifying profile configuration in hook:", e);
      return false;
    }
  };

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
            const appUserData = {
              ...userDoc.data(),
              createdAt: userDoc.data().createdAt?.toDate(),
              lastLogin: userDoc.data().lastLogin?.toDate(),
            } as AppUser;
            setAppUser(appUserData);

            // Verify role-based profile configuration
            const configured = await checkProfileConfigured(firebaseUser.uid, appUserData.accountType, firebaseUser.email);
            setIsProfileConfigured(configured);

            // Mirror session for browser extension bridge
            const sessionPayload = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || appUserData.email?.split('@')[0],
              accountType: appUserData.accountType || 'jobSeeker',
              isAdmin: firebaseUser.email === 'Chris.Barnes.2000@me.com' || firebaseUser.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1',
              profileCompleted: appUserData.profileCompleted || false
            };
            try {
              localStorage.setItem('ascend_auth_session', JSON.stringify(sessionPayload));
              window.dispatchEvent(new CustomEvent('ascend-auth-change', { detail: sessionPayload }));
            } catch (e) {
              console.warn("Could not sync session to localStorage:", e);
            }
          } else {
            console.warn("User doc not found for:", firebaseUser.uid);
            setAppUser(null);
            const isAdmin = firebaseUser.email === 'Chris.Barnes.2000@me.com' || firebaseUser.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1';
            setIsProfileConfigured(isAdmin);
          }
        } catch (err) {
          console.error("Error fetching user doc in hook:", err);
          setAppUser(null);
          setIsProfileConfigured(false);
        }
      } else {
        console.log("No Firebase user detected");
        setAppUser(null);
        setIsProfileConfigured(true);
        try {
          localStorage.removeItem('ascend_auth_session');
          window.dispatchEvent(new CustomEvent('ascend-auth-change', { detail: null }));
        } catch (e) {}
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (email: string, pass: string, accountType: AccountType, inviteCode?: string) => {
    try {
      let resolvedCompanyId: string | undefined;
      let resolvedCompanyName: string | undefined;
      let resolvedStaffingRole: 'admin' | 'recruiter' | 'owner' | undefined;
      let isCompanyRecruiterInvite = false;

      // Validate invite codes for recruiter or company if provided
      if (inviteCode) {
        const cleanCode = inviteCode.toUpperCase().trim();
        // Check company_recruiter_invitations first
        const compInviteRef = doc(db, 'company_recruiter_invitations', cleanCode);
        const compInviteSnap = await getDoc(compInviteRef);
        if (compInviteSnap.exists() && compInviteSnap.data().status === 'pending') {
          const compData = compInviteSnap.data();
          resolvedCompanyId = compData.companyId;
          resolvedCompanyName = compData.companyName;
          resolvedStaffingRole = 'recruiter';
          isCompanyRecruiterInvite = true;
        } else {
          // Check staffing_invitations
          const inviteRef = doc(db, 'staffing_invitations', cleanCode);
          const inviteSnap = await getDoc(inviteRef);
          if (inviteSnap.exists() && inviteSnap.data().status === 'pending') {
            const inviteData = inviteSnap.data();
            resolvedCompanyName = inviteData.targetFirmName;
            resolvedStaffingRole = inviteData.role;
          } else if (accountType === 'company') {
            throw new Error("Invalid or expired invite code. Please verify your code or contact your administrator.");
          }
        }
      }

      const canonicalEmail = normalizeEmail(email);
      const result = await createUserWithEmailAndPassword(auth, canonicalEmail, pass);
      const firebaseUser = result.user;
      const userRef = doc(db, 'users', firebaseUser.uid);

      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: canonicalEmail,
        emailOriginal: email.trim(),
        linkedProviders: ['password'],
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

      if (resolvedCompanyName) {
        newUser.companyName = resolvedCompanyName;
        newUser.activeCompanyName = resolvedCompanyName;
        newUser.staffingFirmName = resolvedCompanyName;
      }
      if (resolvedCompanyId) {
        newUser.companyId = resolvedCompanyId;
        newUser.activeCompanyId = resolvedCompanyId;
        newUser.claimedCompanyId = resolvedCompanyId;
      }
      if (resolvedStaffingRole) {
        newUser.staffingRole = resolvedStaffingRole;
        newUser.companyRole = resolvedStaffingRole;
      }

      // Mark invite as accepted if used
      if (inviteCode) {
        const cleanCode = inviteCode.toUpperCase().trim();
        if (isCompanyRecruiterInvite) {
          await setDoc(doc(db, 'company_recruiter_invitations', cleanCode), {
            status: 'accepted',
            acceptedByUid: firebaseUser.uid,
            acceptedByEmail: firebaseUser.email,
            acceptedAt: serverTimestamp()
          }, { merge: true });

          if (resolvedCompanyId) {
            const { arrayUnion } = await import('firebase/firestore');
            await setDoc(doc(db, 'companies', resolvedCompanyId), {
              recruiterUids: arrayUnion(firebaseUser.uid)
            }, { merge: true });
          }
        } else {
          await setDoc(doc(db, 'staffing_invitations', cleanCode), {
            status: 'accepted',
            acceptedByUid: firebaseUser.uid,
            acceptedAt: serverTimestamp()
          }, { merge: true });
        }
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
      let resolvedCompanyId: string | undefined;
      let resolvedCompanyName: string | undefined;
      let resolvedStaffingRole: 'admin' | 'recruiter' | 'owner' | undefined;
      let isCompanyRecruiterInvite = false;

      // Validate invite code if provided
      if (inviteCode) {
        const cleanCode = inviteCode.toUpperCase().trim();
        // Check company_recruiter_invitations first
        const compInviteRef = doc(db, 'company_recruiter_invitations', cleanCode);
        const compInviteSnap = await getDoc(compInviteRef);
        if (compInviteSnap.exists() && compInviteSnap.data().status === 'pending') {
          const compData = compInviteSnap.data();
          resolvedCompanyId = compData.companyId;
          resolvedCompanyName = compData.companyName;
          resolvedStaffingRole = 'recruiter';
          isCompanyRecruiterInvite = true;
        } else {
          // Check staffing_invitations
          const inviteRef = doc(db, 'staffing_invitations', cleanCode);
          const inviteSnap = await getDoc(inviteRef);
          if (inviteSnap.exists() && inviteSnap.data().status === 'pending') {
            const inviteData = inviteSnap.data();
            resolvedCompanyName = inviteData.targetFirmName;
            resolvedStaffingRole = inviteData.role;
          } else if (accountType === 'company') {
            throw new Error("Invalid or expired invite code. Please verify your code or contact your administrator.");
          }
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

        if (resolvedCompanyName) {
          newUser.companyName = resolvedCompanyName;
          newUser.activeCompanyName = resolvedCompanyName;
          newUser.staffingFirmName = resolvedCompanyName;
        }
        if (resolvedCompanyId) {
          newUser.companyId = resolvedCompanyId;
          newUser.activeCompanyId = resolvedCompanyId;
          newUser.claimedCompanyId = resolvedCompanyId;
        }
        if (resolvedStaffingRole) {
          newUser.staffingRole = resolvedStaffingRole;
          newUser.companyRole = resolvedStaffingRole;
        }

        // If invite code used, mark it as accepted and link firm/company
        if (inviteCode) {
          const cleanCode = inviteCode.toUpperCase().trim();
          if (isCompanyRecruiterInvite) {
            await setDoc(doc(db, 'company_recruiter_invitations', cleanCode), {
              status: 'accepted',
              acceptedByUid: firebaseUser.uid,
              acceptedByEmail: firebaseUser.email,
              acceptedAt: serverTimestamp()
            }, { merge: true });

            if (resolvedCompanyId) {
              const { arrayUnion } = await import('firebase/firestore');
              await setDoc(doc(db, 'companies', resolvedCompanyId), {
                recruiterUids: arrayUnion(firebaseUser.uid)
              }, { merge: true });
            }
          } else {
            await setDoc(doc(db, 'staffing_invitations', cleanCode), {
              status: 'accepted',
              acceptedByUid: firebaseUser.uid,
              acceptedAt: serverTimestamp()
            }, { merge: true });
          }
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
    const configured = await checkProfileConfigured(user.uid, type, user.email);
    setIsProfileConfigured(configured);
  };

  const resetProfileSetup = async (newAccountType: AccountType) => {
    if (!user) throw new Error("No authenticated user to reset profile setup.");
    setProfileCheckLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentRole = userSnap.exists() ? userSnap.data()?.accountType : appUser?.accountType;

      // Rate limit validation: max 3 switches per 24 hours (ITIL & Security Safeguard)
      const currentHistory = userSnap.exists() ? (userSnap.data()?.roleSwitchHistory || []) : [];
      const rateLimitCheck = checkRoleSwitchRateLimit(currentHistory);
      if (!rateLimitCheck.allowed) {
        const hoursRemaining = rateLimitCheck.retryAfterMs ? (rateLimitCheck.retryAfterMs / (1000 * 60 * 60)).toFixed(1) : '24';
        throw new Error(`AUTH_ROLE_SWITCH_THROTTLED: Maximum role switches exceeded (limit 3 per 24h). Please wait ${hoursRemaining} hours before switching roles again.`);
      }

      // Archive superseded role profile sub-document atomically to prevent data loss
      if (currentRole && currentRole !== newAccountType) {
        let subPath = '';
        if (currentRole === 'jobSeeker') subPath = `users/${user.uid}/profiles/main`;
        else if (currentRole === 'recruiter') subPath = `users/${user.uid}/profiles/recruiter`;
        else if (currentRole === 'company' || currentRole === 'companyOwner') subPath = `users/${user.uid}/profiles/company`;

        if (subPath) {
          try {
            const oldProfileSnap = await getDoc(doc(db, subPath));
            if (oldProfileSnap.exists()) {
              const archiveDocPath = generateArchiveProfilePath(user.uid, currentRole);
              await setDoc(doc(db, archiveDocPath), {
                ...oldProfileSnap.data(),
                originalRole: currentRole,
                archivedAt: serverTimestamp(),
                archivedByUid: user.uid
              });
            }
          } catch (archiveErr) {
            console.warn("Could not archive prior profile snapshot:", archiveErr);
          }
        }
      }

      await setDoc(userRef, { 
        accountType: newAccountType,
        profileCompleted: false,
        updatedAt: serverTimestamp(),
        roleSwitchHistory: arrayUnion({
          role: newAccountType,
          timestamp: new Date()
        })
      }, { merge: true });

      const freshSnap = await getDoc(userRef);
      if (freshSnap.exists()) {
        const freshAppUser = {
          ...freshSnap.data(),
          createdAt: freshSnap.data().createdAt?.toDate(),
          lastLogin: freshSnap.data().lastLogin?.toDate(),
        } as AppUser;
        setAppUser(freshAppUser);
      }

      const configured = await checkProfileConfigured(user.uid, newAccountType, user.email);
      setIsProfileConfigured(configured);
    } catch (err) {
      console.error("Failed to reset profile setup:", err);
      throw err;
    } finally {
      setProfileCheckLoading(false);
    }
  };

  const recheckProfileConfigured = async (): Promise<boolean> => {
    if (!user) return false;
    setProfileCheckLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const freshAppUser = {
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate(),
          lastLogin: userDoc.data().lastLogin?.toDate(),
        } as AppUser;
        setAppUser(freshAppUser);
      }
      const accType = userDoc.exists() ? userDoc.data()?.accountType : appUser?.accountType;
      const configured = await checkProfileConfigured(user.uid, accType, user.email);
      setIsProfileConfigured(configured);
      return configured;
    } finally {
      setProfileCheckLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('ascend_auth_session');
      window.dispatchEvent(new CustomEvent('ascend-auth-change', { detail: null }));
    } catch (e) {}
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      appUser, 
      loading, 
      isProfileConfigured,
      profileCheckLoading,
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logout, 
      updateAccountType,
      resetProfileSetup,
      recheckProfileConfigured
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
