export type AppTabKey = 'home' | 'analysis' | 'tests' | 'notifications' | 'profile';
export type AnalysisRange = 'weekly' | 'monthly' | 'yearly';

export type OnboardingSlide = {
  key: string;
  backgroundColor: string;
  title: string;
  subtitle: string;
  accent: 'purple' | 'green' | 'orange';
  ctaLabel: string;
};

export type RoleOption = {
  key: string;
  title: string;
  imageAccent: string;
};

export type CalendarDay = {
  key: string;
  day: string;
  date: string;
  isSelected?: boolean;
};

export type TestAction = {
  key: string;
  title: string;
  backgroundColor: string;
};

export type ChartSeriesPoint = {
  label: string;
  national: number;
  athlete: number;
};

export type PlaceholderContent = {
  title: string;
  message: string;
};
