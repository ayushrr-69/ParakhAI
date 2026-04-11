import { PlaceholderContent } from '@/types/app';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignInAs: undefined;
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  RoleSelection: undefined;
  RoleSuccess: { role: 'athlete' | 'coach' };
  CoachDashboard: undefined;
  Home: undefined;
  Analysis: undefined;
  VideoUpload: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  AnalysisResults: { 
    results?: any;
    exerciseType: 'pushups' | 'squats' | 'bicep_curls';
    session?: any;
  };
  RealTimeAnalysis: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  Tests: undefined;
  Notifications: { content: PlaceholderContent };
  Profile: undefined;
  Settings: { content: PlaceholderContent };
  More: { content: PlaceholderContent };
  Training: undefined;
  RecordAndUpload: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  ProfileSetup: undefined;
};
