import { colors } from '@/theme/colors';
import { AnalysisRange, CalendarDay, ChartSeriesPoint, OnboardingSlide, RoleOption, TestAction } from '@/types/app';

export const splashContent = {
  brand: 'ParakhAI',
  tagline: 'AI-powered training and performance analysis',
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    key: 'skills',
    backgroundColor: colors.lavender,
    title: 'Analyze every rep with clarity',
    subtitle: 'Use guided exercise analysis to measure movement quality and consistency.',
    accent: 'purple',
    ctaLabel: 'Next',
  },
  {
    key: 'compete',
    backgroundColor: colors.success,
    title: 'Compare sessions over time',
    subtitle: 'Track how your reps, form, and performance change across workouts.',
    accent: 'green',
    ctaLabel: 'Next',
  },
  {
    key: 'journey',
    backgroundColor: colors.accentOrange,
    title: 'Record your training journey',
    subtitle: 'Keep a clean timeline of results, trends, and next targets in one place.',
    accent: 'orange',
    ctaLabel: 'Get Started',
  },
];

export const roleOptions: RoleOption[] = [
  {
    key: 'athlete',
    title: 'Athlete',
    imageAccent: colors.lavender,
  },
  {
    key: 'coach',
    title: 'Official',
    imageAccent: colors.accentOrange,
  },
];

export const homeTestActions: TestAction[] = [
  {
    key: 'pushups',
    title: 'Push-ups',
    backgroundColor: colors.lavender,
  },
  {
    key: 'squats',
    title: 'Squats',
    backgroundColor: colors.success,
  },
  {
    key: 'bicep_curls',
    title: 'Bicep Curls',
    backgroundColor: colors.accentOrange,
  },
];

export const calendarDays: CalendarDay[] = [
  { key: 'sun', day: 'Sun', date: '5' },
  { key: 'mon', day: 'Mon', date: '6' },
  { key: 'tue', day: 'Tue', date: '7' },
  { key: 'wed', day: 'Wed', date: '8' },
  { key: 'thu', day: 'Thu', date: '9' },
  { key: 'fri', day: 'Fri', date: '10' },
  { key: 'sat', day: 'Sat', date: '11', isSelected: true },
];

export const analysisTabs: AnalysisRange[] = ['weekly', 'monthly', 'yearly'];

export const chartData: Record<AnalysisRange, ChartSeriesPoint[]> = {
  weekly: [
    { label: 'Mon', national: 280, athlete: 190 },
    { label: 'Tue', national: 300, athlete: 220 },
    { label: 'Wed', national: 250, athlete: 205 },
    { label: 'Thu', national: 310, athlete: 235 },
    { label: 'Fri', national: 290, athlete: 225 },
    { label: 'Sat', national: 330, athlete: 245 },
    { label: 'Sun', national: 315, athlete: 240 },
  ],
  monthly: [
    { label: 'Jan', national: 240, athlete: 220 },
    { label: 'Feb', national: 260, athlete: 210 },
    { label: 'Mar', national: 280, athlete: 205 },
    { label: 'Apr', national: 295, athlete: 190 },
    { label: 'May', national: 310, athlete: 185 },
    { label: 'Jun', national: 325, athlete: 180 },
    { label: 'Jul', national: 340, athlete: 175 },
  ],
  yearly: [],
};

export const analysisCopy: Record<AnalysisRange, string> = {
  weekly: 'You are losing points due to lower core strength and inconsistent acceleration in sprint transitions. Improving those two areas can lift your weekly output.',
  monthly: 'Monthly performances are depreciating compared with benchmark athletes. Recovery consistency and explosive training volume need attention.',
  yearly: 'Monthly performances are depreciating compared with benchmark athletes. Recovery consistency and explosive training volume need attention.',
};

export const subroutineBreakdown = [
  { key: 'pushups', title: 'Push-ups', percentage: '53%', backgroundColor: colors.lavender },
  { key: 'sprint', title: 'Sprint', percentage: '28%', backgroundColor: colors.success },
  { key: 'jump', title: 'Jump', percentage: '19%', backgroundColor: colors.accentOrange },
];
