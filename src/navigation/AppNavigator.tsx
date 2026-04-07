import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';
import { AnalysisScreen } from '@/screens/AnalysisScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { SignInAsScreen } from '@/screens/SignInAsScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import VideoUploadScreen from '@/screens/VideoUploadScreen';
import AnalysisResultsScreen from '@/screens/AnalysisResultsScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import { RecordingInstructionsScreen } from '@/screens/RecordingInstructionsScreen';
import { placeholderRouteContent, routes } from '@/constants/routes';
import { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardOverlayEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        transitionSpec: {
          open: TransitionSpecs.TransitionIOSSpec,
          close: TransitionSpecs.TransitionIOSSpec,
        },
      }}
      initialRouteName={routes.splash}
    >
      <Stack.Screen name={routes.splash} component={SplashScreen} />
      <Stack.Screen name={routes.onboarding} component={OnboardingScreen} />
      <Stack.Screen name={routes.signInAs} component={SignInAsScreen} />
      <Stack.Screen name={routes.login} component={LoginScreen} />
      <Stack.Screen name={routes.signUp} component={SignUpScreen} />
      <Stack.Screen name={routes.home} component={HomeScreen} />
      <Stack.Screen name={routes.analysis} component={AnalysisScreen} />
      <Stack.Screen name="RecordingInstructions" component={RecordingInstructionsScreen} />
      <Stack.Screen name={routes.videoUpload} component={VideoUploadScreen} />
      <Stack.Screen name={routes.analysisResults} component={AnalysisResultsScreen} />
      <Stack.Screen name={routes.history} component={HistoryScreen} />
      <Stack.Screen name={routes.tests} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.tests] }} />
      <Stack.Screen name={routes.notifications} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.notifications] }} />
      <Stack.Screen name={routes.profile} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.profile] }} />
      <Stack.Screen name={routes.settings} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.settings] }} />
      <Stack.Screen name={routes.more} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.more] }} />
    </Stack.Navigator>
  );
}
