import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { HomeScreen } from '@/screens/HomeScreen';
import { AnalysisScreen } from '@/screens/AnalysisScreen';
import { AthleteCoachScreen } from '@/screens/AthleteCoachScreen';
import { TestsScreen } from '@/screens/TestsScreen';
import { TrainingScreen } from '@/screens/TrainingScreen';
import { CoachHomeScreen } from '@/screens/coach/CoachHomeScreen';
import { CoachInboxScreen } from '@/screens/coach/CoachInboxScreen';
import { CoachAthletesScreen } from '@/screens/coach/CoachAthletesScreen';
import { CoachReportsScreen } from '@/screens/coach/CoachReportsScreen';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { BottomNav } from '@/components/navigation/BottomNav';
import { routes, placeholderRouteContent } from '@/constants/routes';
import { AthleteTabParamList, CoachTabParamList } from '@/types/navigation';

const AthleteTab = createMaterialTopTabNavigator<AthleteTabParamList>();
const CoachTab = createMaterialTopTabNavigator<CoachTabParamList>();

export function AthleteNavigator() {
  return (
    <AthleteTab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        swipeEnabled: true,
      }}
    >
      <AthleteTab.Screen name="Home" component={HomeScreen} />
      <AthleteTab.Screen name="Analysis" component={AnalysisScreen} />
      <AthleteTab.Screen name="AthleteCoach" component={AthleteCoachScreen} />
      <AthleteTab.Screen name="Tests" component={TestsScreen} />
      <AthleteTab.Screen name="Training" component={TrainingScreen} />
    </AthleteTab.Navigator>
  );
}

export function CoachNavigator() {
  return (
    <CoachTab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        swipeEnabled: true,
      }}
    >
      <CoachTab.Screen name="CoachHome" component={CoachHomeScreen} />
      <CoachTab.Screen name="CoachInbox" component={CoachInboxScreen} />
      <CoachTab.Screen name="CoachAthletes" component={CoachAthletesScreen} />
      <CoachTab.Screen name="CoachReports" component={CoachReportsScreen} />
    </CoachTab.Navigator>
  );
}
