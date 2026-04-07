/**
 * Hook for on-device ML analysis
 * Provides easy interface for pose detection and analysis
 */
import { useState, useCallback } from 'react';
import { 
  isOnDeviceAvailable, 
  analyzeVideoOnDevice,
  type ExerciseType,
  type AnalysisResult,
  type ProcessingProgress,
} from '@/ml';

interface UseMLAnalysisOptions {
  onProgress?: (progress: ProcessingProgress) => void;
}

export function useMLAnalysis(options?: UseMLAnalysisOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeVideo = useCallback(async (
    videoUri: string,
    exerciseType: ExerciseType
  ): Promise<AnalysisResult | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress(null);

    try {
      const result = await analyzeVideoOnDevice(
        videoUri,
        exerciseType,
        (prog) => {
          setProgress(prog);
          options?.onProgress?.(prog);
        }
      );
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      console.error('[useMLAnalysis] Error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  return {
    analyzeVideo,
    isProcessing,
    progress,
    error,
    isAvailable: isOnDeviceAvailable(),
  };
}
