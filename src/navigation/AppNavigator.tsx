import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';
import { AnalysisScreen } from '@/screens/AnalysisScreen';
import { AnalysisResultsScreen } from '@/screens/AnalysisResultsScreen';
import { VideoUploadScreen } from '@/screens/VideoUploadScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { SignInAsScreen } from '@/screens/SignInAsScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { RoleSelectionScreen } from '@/screens/RoleSelectionScreen';
import { RoleSuccessScreen } from '@/screens/RoleSuccessScreen';
import { ProfileSetupScreen } from '@/screens/ProfileSetupScreen';
import { CoachSetupScreen } from '@/screens/CoachSetupScreen';
import { RealTimeAnalysisScreen } from '@/screens/RealTimeAnalysisScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { RecordAndUploadScreen } from '@/screens/RecordAndUploadScreen';
import { AthleteCoachScreen } from '@/screens/AthleteCoachScreen';
import { CoachReviewScreen } from '@/screens/CoachReviewScreen';
import { CoachProfileScreen } from '@/screens/coach/CoachProfileScreen';
import { CoachEditProfileScreen } from '@/screens/coach/CoachEditProfileScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { AthleteNavigator, CoachNavigator } from './MainNavigator';
import { placeholderRouteContent, routes } from '@/constants/routes';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';
import { View, StyleSheet, Platform } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

function OfflineBanner() {
  const { isConnected } = useNetwork();
  if (isConnected) return null;

  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineDot} />
      <AppText variant="tiny" weight="bold" color={theme.colors.placeholder}>
        OFFLINE MODE • RESULTS SAVED LOCALLY
      </AppText>
    </View>
  );
}

export function AppNavigator() {
  const { session, profile, loading } = useAuth();

  // 1. While auth state is loading, just show Splash
  if (loading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={routes.splash} component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
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
      >
        {!session ? (
          // 2. Auth Stack (User is not logged in)
          <>
            <Stack.Screen name={routes.onboarding} component={OnboardingScreen} />
            <Stack.Screen name={routes.login} component={LoginScreen} />
            <Stack.Screen name={routes.signUp} component={SignUpScreen} />
            <Stack.Screen name={routes.signInAs} component={SignInAsScreen} />
          </>
        ) : !profile?.role ? (
          // 3. Setup Stack (User is logged in but has no profile/role)
          <>
            <Stack.Screen name={routes.roleSelection} component={RoleSelectionScreen} />
            <Stack.Screen name={routes.roleSuccess} component={RoleSuccessScreen} />
          </>
        ) : profile?.role === 'athlete' ? (
          // 4. Athlete Stack
          <>
            {!profile?.username && (
              <Stack.Screen name={routes.profileSetup} component={ProfileSetupScreen} />
            )}
            <Stack.Screen name={routes.main} component={AthleteNavigator} />
            
            <Stack.Screen name={routes.analysis} component={AnalysisScreen} />
            <Stack.Screen name={routes.videoUpload} component={VideoUploadScreen} />
            <Stack.Screen name={routes.analysisResults} component={AnalysisResultsScreen} />
            <Stack.Screen name={routes.realTimeAnalysis} component={RealTimeAnalysisScreen} />
            <Stack.Screen name={routes.chat} component={ChatScreen} />
            <Stack.Screen name={routes.recordAndUpload} component={RecordAndUploadScreen} />
            <Stack.Screen name={routes.profile} component={ProfileScreen} />
            <Stack.Screen 
              name={routes.notifications} 
              component={PlaceholderScreen} 
              initialParams={{ content: placeholderRouteContent[routes.notifications] }} 
            />
          </>
        ) : (
          // 5. Coach Stack
          <>
            {!profile?.username && (
              <Stack.Screen name={routes.coachSetup} component={CoachSetupScreen} />
            )}
            <Stack.Screen name={routes.main} component={CoachNavigator} />
            
            <Stack.Screen name={routes.coachReview} component={CoachReviewScreen as any} />
            <Stack.Screen name={routes.coachProfile} component={CoachProfileScreen} />
            <Stack.Screen name={routes.coachEditProfile} component={CoachEditProfileScreen} />
            <Stack.Screen name={routes.chat} component={ChatScreen} />
            <Stack.Screen 
              name={routes.notifications} 
              component={PlaceholderScreen} 
              initialParams={{ content: placeholderRouteContent[routes.notifications] }} 
            />
          </>
        )}
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  offlineBanner: {
    height: Platform.OS === 'ios' ? 44 : 32,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingTop: Platform.OS === 'ios' ? 12 : 0,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accentOrange,
  },
});
