import { PlaceholderContent } from '@/types/app';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignInAs: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Analysis: undefined;
  Tests: { content: PlaceholderContent };
  Notifications: { content: PlaceholderContent };
  Profile: { content: PlaceholderContent };
  Settings: { content: PlaceholderContent };
  More: { content: PlaceholderContent };
};
