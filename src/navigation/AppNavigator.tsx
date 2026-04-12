import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AnalysisScreen } from '@/screens/AnalysisScreen';
import { AnalysisResultsScreen } from '@/screens/AnalysisResultsScreen';
import { VideoUploadScreen } from '@/screens/VideoUploadScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { TestsScreen } from '@/screens/TestsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { TrainingScreen } from '@/screens/TrainingScreen';
import { RecordAndUploadScreen } from '@/screens/RecordAndUploadScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { RealTimeAnalysisScreen } from '@/screens/RealTimeAnalysisScreen';
import { BottomNav } from '@/components/navigation/BottomNav';
import { placeholderRouteContent, routes } from '@/constants/routes';
import { RootStackParamList } from '@/types/navigation';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';

import { RoleSelectionScreen } from '@/screens/RoleSelectionScreen';
import { RoleSuccessScreen } from '@/screens/RoleSuccessScreen';
import { ProfileSetupScreen } from '@/screens/ProfileSetupScreen';

import { CoachHomeScreen } from '@/screens/coach/CoachHomeScreen';
import { CoachInboxScreen } from '@/screens/coach/CoachInboxScreen';
import { CoachAthletesScreen } from '@/screens/coach/CoachAthletesScreen';
import { CoachReportsScreen } from '@/screens/coach/CoachReportsScreen';
import { CoachProfileScreen } from '@/screens/coach/CoachProfileScreen';
import { CoachEditProfileScreen } from '@/screens/coach/CoachEditProfileScreen';

import { AthleteCoachScreen } from '@/screens/AthleteCoachScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { CoachReviewScreen } from '@/screens/CoachReviewScreen';
import { AthletePerformanceReportScreen } from '@/screens/AthletePerformanceReportScreen';
import { CoachSetupScreen } from '@/screens/CoachSetupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator<RootStackParamList>();

function MainTabNavigator() {
  return (
    <View style={styles.tabWrapper}>
      <Tab.Navigator
        tabBar={(props) => (
          <View style={styles.navContainer} pointerEvents='box-none'>
            <BottomNav {...props} />
          </View>
        )}
        tabBarPosition='bottom'
        initialRouteName={routes.home}
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
        }}
      >
        <Tab.Screen name={routes.home} component={HomeScreen} />
        <Tab.Screen name={routes.analysis} component={AnalysisScreen} />
        <Tab.Screen name={routes.athleteCoach} component={AthleteCoachScreen} />
        <Tab.Screen name={routes.tests} component={TestsScreen} />
        <Tab.Screen name={routes.training} component={TrainingScreen} />
      </Tab.Navigator>
    </View>
  );
}

function CoachTabNavigator() {
  return (
    <View style={styles.tabWrapper}>
      <Tab.Navigator
        tabBar={(props) => (
          <View style={styles.navContainer} pointerEvents='box-none'>
            <BottomNav {...props} />
          </View>
        )}
        tabBarPosition='bottom'
        initialRouteName={routes.coachHome}
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
        }}
      >
        <Tab.Screen name={routes.coachHome} component={CoachHomeScreen} />
        <Tab.Screen name={routes.coachInbox} component={CoachInboxScreen} />
        <Tab.Screen name={routes.coachAthletes} component={CoachAthletesScreen} />
        <Tab.Screen name={routes.coachReports} component={CoachReportsScreen} />
      </Tab.Navigator>
    </View>
  );
}

export function AppNavigator() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 350,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      {!user ? (
        <Stack.Group>
          <Stack.Screen name={routes.splash} component={SplashScreen} />
          <Stack.Screen name={routes.onboarding} component={OnboardingScreen} />
          <Stack.Screen name={routes.login} component={LoginScreen} />
          <Stack.Screen name={routes.signUp} component={SignUpScreen} />
        </Stack.Group>
      ) : !profile?.role ? (
        <Stack.Group>
          <Stack.Screen name={routes.roleSelection} component={RoleSelectionScreen} />
          <Stack.Screen name={routes.roleSuccess} component={RoleSuccessScreen} />
        </Stack.Group>
      ) : (!profile?.username && profile?.role === 'athlete') ? (
        <Stack.Group>
          <Stack.Screen name={routes.profileSetup} component={ProfileSetupScreen} />
        </Stack.Group>
      ) : (!profile?.username && profile?.role === 'coach') ? (
        <Stack.Group>
          <Stack.Screen name={routes.coachSetup} component={CoachSetupScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          {profile.role === 'athlete' ? (
            <Stack.Screen name="Main" component={MainTabNavigator} />
          ) : (
            <Stack.Screen name={routes.coachDashboard} component={CoachTabNavigator} />
          )}
          <Stack.Screen name={routes.roleSuccess} component={RoleSuccessScreen} />
          <Stack.Screen name={routes.profileSetup} component={ProfileSetupScreen} />
          <Stack.Screen name={routes.coachSetup} component={CoachSetupScreen} />
          <Stack.Screen name={routes.profile} component={ProfileScreen} />
          <Stack.Screen name={routes.coachProfile} component={CoachProfileScreen} />
          <Stack.Screen name={routes.coachEditProfile} component={CoachEditProfileScreen} />
          <Stack.Screen name={routes.notifications} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.notifications] }} />
          <Stack.Screen name={routes.videoUpload} component={VideoUploadScreen} />
          <Stack.Screen name={routes.analysisResults} component={AnalysisResultsScreen} />
          <Stack.Screen name={routes.realTimeAnalysis} component={RealTimeAnalysisScreen} />
          <Stack.Screen name={routes.recordAndUpload} component={RecordAndUploadScreen} />
          <Stack.Screen name={routes.chat} component={ChatScreen} />
          <Stack.Screen name={routes.coachReview} component={CoachReviewScreen} />
          <Stack.Screen name={routes.athletePerformanceReport} component={AthletePerformanceReportScreen} />
          <Stack.Screen name={routes.settings} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.settings] }} />
          <Stack.Screen name={routes.more} component={PlaceholderScreen} initialParams={{ content: placeholderRouteContent[routes.more] }} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40, // Match AppShell's floating position
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

