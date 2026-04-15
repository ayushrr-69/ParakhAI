import { PlaceholderContent } from '@/types/app';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignInAs: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Analysis: undefined;
  VideoUpload: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  AnalysisResults: { 
    results?: any;
    session?: import('@/services/history').Session;
    exerciseType: 'pushups' | 'squats' | 'bicep_curls';
    coachFeedback?: string;
    coachName?: string;
  };
  RealTimeAnalysis: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  Tests: { content: PlaceholderContent };
  Notifications: { content: PlaceholderContent };
  Profile: { content: PlaceholderContent };
  Settings: { content: PlaceholderContent };
  More: { content: PlaceholderContent };
  RoleSelection: undefined;
  RoleSuccess: { role: string };
  ProfileSetup: { mode?: 'setup' | 'edit' | 'changeCoach'; step?: number };
  CoachSetup: undefined;
  CoachHome: undefined;
  Chat: { targetName: string; targetId: string } | { coachName: string; athleteId: string };
  CoachAthletes: undefined;
  CoachInbox: undefined;
  CoachReview: { submissionId: string; athleteName: string; sessionData: any };
  CoachProfile: undefined;
  CoachEditProfile: undefined;
  RecordAndUpload: { exerciseType: 'pushups' | 'squats' | 'bicep_curls' };
  AthleteCoach: undefined;
  Main: undefined;
};

export type AthleteTabParamList = {
  Home: undefined;
  Analysis: undefined;
  AthleteCoach: undefined;
  Tests: { content: PlaceholderContent };
  Training: undefined;
};

export type CoachTabParamList = {
  CoachHome: undefined;
  CoachInbox: undefined;
  CoachAthletes: undefined;
  CoachReports: undefined;
};
