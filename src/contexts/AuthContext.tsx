import React, { createContext, useContext, useEffect, useState } from 'react';
import { InteractionManager, AppState } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { historyService } from '@/services/history';

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: 'athlete' | 'coach' | null;
  goals: string[] | null;
  weight: string | null;
  height: string | null;
  pref_units: 'metric' | 'imperial';
  coach_id: string | null;
  coach_name: string | null;
  bio: string | null;
  location?: string | null;
  specialties?: string[] | null;
  experience?: string | null;
  rating?: number;
  reviews_count?: number;
  specialties: string[] | null;
  expertise_level: string | null;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfileState: (updates: Partial<UserProfile>) => void;
  updateFullProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
        console.error('Error fetching profile:', error);
      }

      setProfile(data || null);
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('[Auth] Refreshing profile from DB...');
      await fetchProfile(user.id);
    }
  };

  const updateFullProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user session' };

    console.log('[Auth] Attempting profile upsert for:', user.id, updates);
    try {
      const { error, data } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          avatar_url: updates.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[Auth] Upsert error:', error);
      } else {
        console.log('[Auth] Upsert successful');
        // Optimistically update local state
        updateProfileState(updates);
      }
      return { error };
    } catch (err) {
      console.error('[Auth] Upsert catch error:', err);
      return { error: err };
    }
  };

  const updateProfileState = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      if (prev) return { ...prev, ...updates };
      // Fallback if prev is null (e.g. fresh registration)
      return {
        id: user?.id || '',
        full_name: null,
        username: null,
        avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
        role: null,
        goals: null,
        weight: null,
        height: null,
        pref_units: 'metric',
        bio: null,
        specialties: [],
        expertise_level: null,
        updated_at: new Date().toISOString(),
        ...updates
      } as UserProfile;
    });
  };

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      setLoading(false);
    });

    // 2. Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '64354112639-njlln67o7pa3m1l7gq40992flvara2qa.apps.googleusercontent.com',
      offlineAccess: true,
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // 1. Clear local session cache while we still have auth context
    await historyService.clearHistory();

    // 2. Sign out from Supabase & Google
    await supabase.auth.signOut();
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignored
    }
  };

  const signInWithGoogle = async () => {
    try {
      // 1. Ensure Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // 2. Wait for UI to be stable and Activity to be available
      await new Promise((resolve) => {
        InteractionManager.runAfterInteractions(async () => {
          // Additional safety delay for Android Activity lifecycle
          setTimeout(resolve, 500);
        });
      });

      // 3. Final check that app is actually active
      if (AppState.currentState !== 'active') {
        console.warn('[Google Auth] App not active, aborting');
        return;
      }

      console.log('[Google Auth] Initiating sign-in picker...');
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token present');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
    } catch (error: any) {
      // Silence cancellation errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Google Auth] Sign-in cancelled by user');
        return;
      }
      
      // Log other errors for debugging
      console.error('[Google Auth Error]', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      loading, 
      signOut, 
      signInWithGoogle, 
      refreshProfile, 
      updateProfileState,
      updateFullProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
