import { PlaceholderContent } from '@/types/app';

// Unified analysis data format (works with both on-device and server results)
export interface AnalysisDataFormat {
  status: string;
  analysis_id: string;
  user_id?: string;
  exercise_type: string;
  metrics: {
    form_score: number;
    rep_count: number;
    failed_reps: number;
    good_rep_count?: number;
    bad_rep_count?: number;
    bad_rep_numbers?: number[];
    rep_scores: number[];
    avg_depth_score?: number;
    avg_hip_score?: number;
  };
  corrections: string[];
  video_info?: {
    fps: number;
  };
  processing_mode?: 'on-device' | 'server';
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignInAs: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Analysis: undefined;
  RecordingInstructions: undefined;
  VideoUpload: undefined;
  AnalysisResults: {
    analysisData: AnalysisDataFormat;
  };
  History: undefined;
  Tests: { content: PlaceholderContent };
  Notifications: { content: PlaceholderContent };
  Profile: { content: PlaceholderContent };
  Settings: { content: PlaceholderContent };
  More: { content: PlaceholderContent };
};
