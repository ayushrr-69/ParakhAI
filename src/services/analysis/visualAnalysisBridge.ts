import { AnalysisResult } from '@/types/analysis';

export interface VisualAnalysisRequest {
  videoUri: string;
  exerciseType: string;
  duration: number;
  onProgress?: (progress: number) => void;
}

type AnalysisFunction = (request: VisualAnalysisRequest) => Promise<any>;

class VisualAnalysisBridge {
  private static instance: VisualAnalysisBridge;
  private analyzeFn: AnalysisFunction | null = null;

  private constructor() {}

  static getInstance(): VisualAnalysisBridge {
    if (!VisualAnalysisBridge.instance) {
      VisualAnalysisBridge.instance = new VisualAnalysisBridge();
    }
    return VisualAnalysisBridge.instance;
  }

  register(fn: AnalysisFunction) {
    this.analyzeFn = fn;
  }

  unregister() {
    this.analyzeFn = null;
  }

  async startAnalysis(request: VisualAnalysisRequest): Promise<any> {
    if (!this.analyzeFn) {
      throw new Error('Visual Analyzer component is not mounted. Please ensure <VisualVideoAnalyzer /> is rendered at the root of your application.');
    }
    return this.analyzeFn(request);
  }
}

export const visualAnalysisBridge = VisualAnalysisBridge.getInstance();
