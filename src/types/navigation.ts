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
    exerciseType: string; 
    session?: any; 
    videoPath?: string; 
    coachFeedback?: string;
    coachName?: string;
  };
  RealTimeAnalysis: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  Tests: undefined;
  Notifications: { content: PlaceholderContent };
  Profile: undefined;
  Settings: { content: PlaceholderContent };
  More: { content: PlaceholderContent };
  Training: undefined;
  RecordAndUpload: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  ProfileSetup: { mode?: 'setup' | 'edit' | 'changeCoach'; step?: number };
  CoachHome: undefined;
  CoachInbox: undefined;
  CoachAthletes: undefined;
  CoachReports: undefined;
  CoachReview: { 
    submissionId: string; 
    athleteName: string; 
    sessionData: any; 
  };
};
