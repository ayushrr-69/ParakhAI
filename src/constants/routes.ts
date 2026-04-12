import { PlaceholderContent } from '@/types/app';

export const routes = {
  splash: 'Splash',
  onboarding: 'Onboarding',
  signInAs: 'SignInAs',
  login: 'Login',
  signUp: 'SignUp',
  main: 'Main',
  roleSelection: 'RoleSelection',
  roleSuccess: 'RoleSuccess',
  coachDashboard: 'CoachDashboard',
  home: 'Home',
  analysis: 'Analysis',
  videoUpload: 'VideoUpload',
  analysisResults: 'AnalysisResults',
  realTimeAnalysis: 'RealTimeAnalysis',
  tests: 'Tests',
  notifications: 'Notifications',
  profile: 'Profile',
  training: 'Training',
  recordAndUpload: 'RecordAndUpload',
  settings: 'Settings',
  more: 'More',
  profileSetup: 'ProfileSetup',
  athleteCoach: 'AthleteCoach',
  chat: 'Chat',
  coachReview: 'CoachReview',
  athletePerformanceReport: 'AthletePerformanceReport',
  coachSetup: 'CoachSetup',
  coachHome: 'CoachHome',
  coachInbox: 'CoachInbox',
  coachAthletes: 'CoachAthletes',
  coachReports: 'CoachReports',
  coachProfile: 'CoachProfile',
  coachEditProfile: 'CoachEditProfile',
} as const;


export const placeholderRouteContent: Record<string, PlaceholderContent> = {
  [routes.tests]: {
    title: 'Tests',
    message: 'Your test library and previous sessions will appear here once connected to the assessment service.',
  },
  [routes.notifications]: {
    title: 'Notifications',
    message: 'Performance alerts, reminders, and coach updates will show up here.',
  },
  [routes.profile]: {
    title: 'Profile',
    message: 'Athlete details, achievements, and preferences are being prepared for your account flow.',
  },
  [routes.settings]: {
    title: 'Settings',
    message: 'App preferences, privacy controls, and connected devices will live here.',
  },
  [routes.more]: {
    title: 'More',
    message: 'Secondary tools, resources, and admin options will be added here.',
  },
};
