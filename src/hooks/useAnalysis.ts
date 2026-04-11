import { useState, useCallback } from 'react';
import { AnalysisResult } from '@/types/analysis';

export const useAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const startAnalysis = useCallback(async (
    videoUri: string,
    _filename: string,
    exerciseType: string,
    duration: number,
    onProgress?: (progress: number) => void,
    _glContext?: any
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      // 1. Simulate "Deep Neural Analysis" Delay with progress steps (5.0s total)
      const steps = 20;
      for (let i = 1; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, 250)); // 250ms * 20 = 5000ms
        onProgress?.(i / steps);
      }

      // 2. Generate randomized mock results (requested: 5-15 reps)
      const totalReps = Math.floor(Math.random() * 11) + 5; 
      const goodReps = Math.floor(totalReps * (0.75 + Math.random() * 0.25));
      const badReps = totalReps - goodReps;
      const consistency = Math.floor(78 + Math.random() * 18);
      const avgPower = Math.floor(62 + Math.random() * 32);
      const avgSpeed = Number((0.9 + Math.random() * 0.5).toFixed(2));

      const result: AnalysisResult = {
        success: true,
        filename: _filename,
        analysis: {
          metadata: {
            total_frames_processed: Math.floor(duration * 30),
            fps: 30,
            duration_processed: duration,
            consistency_score: consistency
          },
          summary: {
            total_reps: totalReps,
            good_reps: goodReps,
            bad_reps: badReps,
            avg_power: avgPower,
            avg_speed: avgSpeed,
          },
          frames: []
        }
      };

      setResults(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred during analysis';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    error,
    results,
    startAnalysis,
    clearResults,
  };
};
