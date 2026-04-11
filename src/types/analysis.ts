export interface AnalysisSummary {
  total_reps: number;
  good_reps: number;
  bad_reps: number;
  avg_power?: number;
  avg_speed?: number;
  max_right_knee_angle?: number;
  min_right_knee_angle?: number;
  max_left_knee_angle?: number;
  min_left_knee_angle?: number;
}

export interface AnalysisMetadata {
  total_frames_processed?: number;
  fps?: number;
  duration_processed: number;
  consistency_score: number;
}

export interface AnalysisResult {
  success: boolean;
  filename: string;
  analysis: {
    metadata: AnalysisMetadata;
    summary: AnalysisSummary;
    frames?: any[];
  };
}
