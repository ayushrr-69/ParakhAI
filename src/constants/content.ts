import { colors } from '@/theme/colors';
import { AnalysisRange, CalendarDay, ChartSeriesPoint, OnboardingSlide, RoleOption, TestAction } from '@/types/app';

export const splashContent = {
  brand: 'NutriAI',
  tagline: 'Sports Performance Tracking',
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    key: 'skills',
    backgroundColor: colors.lavender,
    title: 'Test your skills and performance',
    subtitle: 'Measure movement quality and consistency with athlete-first guided tests.',
    accent: 'purple',
    ctaLabel: 'Next',
  },
  {
    key: 'compete',
    backgroundColor: colors.success,
    title: 'Compete against other players',
    subtitle: 'See how your numbers compare to national athlete benchmarks over time.',
    accent: 'green',
    ctaLabel: 'Next',
  },
  {
    key: 'journey',
    backgroundColor: colors.accentOrange,
    title: 'Record your journey',
    subtitle: 'Keep a clear timeline of training effort, trends, and next targets.',
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
    key: 'official',
    title: 'Official',
    imageAccent: colors.accentOrange,
  },
];

export const calendarDays: CalendarDay[] = [
  { key: 'mon', day: 'Mon', date: '12' },
  { key: 'tue', day: 'Tue', date: '13' },
  { key: 'wed', day: 'Wed', date: '14' },
  { key: 'thu', day: 'Thu', date: '15', isSelected: true },
  { key: 'fri', day: 'Fri', date: '16' },
  { key: 'sat', day: 'Sat', date: '17' },
  { key: 'sun', day: 'Sun', date: '18' },
];

export const homeTestActions: TestAction[] = [
  {
    key: 'repeat',
    title: 'Repeat Last Test',
    backgroundColor: colors.success,
  },
  {
    key: 'history',
    title: 'Test History',
    backgroundColor: colors.lavender,
  },
  {
    key: 'personalized',
    title: 'Personalized Test',
    backgroundColor: colors.accentOrange,
  },
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
