import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { historyService } from '@/services/history';

GoogleSignin.configure({
  webClientId: '64354112639-njlln67o7pa3m1l7gq40992flvara2qa.apps.googleusercontent.com',
});

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  role: 'athlete' | 'coach' | null;
  goals: string[] | null;
  weight: string | null;
  height: string | null;
  pref_units: 'metric' | 'imperial';
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileState: (updates: Partial<UserProfile>) => void;
  updateFullProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
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
      await fetchProfile(user.id);
    }
  };

  const updateFullProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user session' };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (!error) {
        // Optimistically update local state
        updateProfileState(updates);
      }
      return { error };
    } catch (err) {
      console.error('Error updating full profile:', err);
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
        role: null,
        goals: null,
        weight: null,
        height: null,
        pref_units: 'metric',
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

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
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
      await GoogleSignin.hasPlayServices();
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
