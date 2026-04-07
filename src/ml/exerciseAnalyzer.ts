/**
 * Exercise Analyzer - On-device rep counting and form analysis
 */
import { Keypoint, KEYPOINTS, calculateAngle } from './poseDetector';

export interface RepResult {
  repNumber: number;
  maxPercentage: number;
  rangeOfMotion: number;
  score: number;
  isGood: boolean;
}

export interface AnalysisResult {
  repCount: number;
  formScore: number;
  goodRepCount: number;
  badRepCount: number;
  badRepNumbers: number[];
  repScores: number[];
  corrections: string[];
}

// Exercise joint configurations
const EXERCISE_CONFIG = {
  pushup: {
    joints: [
      [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_ELBOW, KEYPOINTS.LEFT_WRIST],
      [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_ELBOW, KEYPOINTS.RIGHT_WRIST],
    ],
    angleName: 'elbow',
  },
  bicep_curl: {
    joints: [
      [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_ELBOW, KEYPOINTS.LEFT_WRIST],
      [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_ELBOW, KEYPOINTS.RIGHT_WRIST],
    ],
    angleName: 'elbow',
  },
  squat: {
    joints: [
      [KEYPOINTS.LEFT_HIP, KEYPOINTS.LEFT_KNEE, KEYPOINTS.LEFT_ANKLE],
      [KEYPOINTS.RIGHT_HIP, KEYPOINTS.RIGHT_KNEE, KEYPOINTS.RIGHT_ANKLE],
    ],
    angleName: 'knee',
  },
};

// Thresholds for different exercises (RELAXED for different camera angles)
const EXERCISE_THRESHOLDS = {
  pushup: {
    MIN_ANGLE_RANGE: 15,  // LOWERED from 25 - allow more camera angles
    PEAK_THRESHOLD: 45,
    VALLEY_THRESHOLD: 40,
    MIN_REP_DURATION: 3,
    COUNT_BOTH_DIRECTIONS: true,  // Pushup = down + up = 1 rep
  },
  squat: {
    MIN_ANGLE_RANGE: 20,  // LOWERED from 30 - allow more camera angles
    PEAK_THRESHOLD: 55,
    VALLEY_THRESHOLD: 35,
    MIN_REP_DURATION: 3,
    COUNT_BOTH_DIRECTIONS: false, // Squat = down only = 1 rep
  },
  bicep_curl: {
    MIN_ANGLE_RANGE: 20,  // Optimized for SIDE VIEW recording
    PEAK_THRESHOLD: 60,
    VALLEY_THRESHOLD: 30,
    MIN_REP_DURATION: 3,
    COUNT_BOTH_DIRECTIONS: false, // Curl = up only = 1 rep
  },
};

const GOOD_REP_THRESHOLD = 30;  // LOWERED from 50 - Score threshold for "good" rep

export type ExerciseType = keyof typeof EXERCISE_CONFIG;

/**
 * Extract angle from keypoints for a specific exercise
 * Tries both left and right side joints and picks the one with higher confidence
 */
export function extractAngle(keypoints: Keypoint[], exerciseType: ExerciseType): number | null {
  const config = EXERCISE_CONFIG[exerciseType];
  
  // Try all configured joint combinations (left and right)
  let bestAngle: number | null = null;
  let bestConfidence = 0;
  
  for (const [p1, p2, p3] of config.joints) {
    // Get keypoints
    const kp1 = keypoints[p1];
    const kp2 = keypoints[p2];
    const kp3 = keypoints[p3];
    
    // Calculate average confidence for this joint set
    const avgConfidence = (kp1.score + kp2.score + kp3.score) / 3;
    
    // Only consider if confidence is better than current best
    if (avgConfidence > bestConfidence) {
      const angle = calculateAngle(keypoints, p1, p2, p3, 0.2); // Lower confidence threshold
      if (angle !== null) {
        bestAngle = angle;
        bestConfidence = avgConfidence;
      }
    }
  }
  
  return bestAngle;
}

/**
 * Smooth angle data with moving average
 */
function smoothAngles(angles: number[], windowSize: number = 3): number[] {
  const smoothed: number[] = [];
  
  for (let i = 0; i < angles.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(angles.length, i + windowSize + 1);
    const window = angles.slice(start, end);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    smoothed.push(avg);
  }
  
  return smoothed;
}

/**
 * Count reps using ZERO-CROSSING algorithm - simpler and more accurate
 * 
 * Algorithm:
 * 1. Smooth the angle data
 * 2. Normalize to 0-100% scale  
 * 3. Find midpoint (50%)
 * 4. Count complete cycles when signal crosses above AND below midpoint
 */
export function countReps(angles: number[], exerciseType: ExerciseType = 'pushup'): RepResult[] {
  if (angles.length < 10) {
    console.log(`[Analyzer] Not enough data points: ${angles.length} angles (need at least 10)`);
    return [];
  }
  
  const thresholds = EXERCISE_THRESHOLDS[exerciseType];
  
  // Smooth angles to filter noise
  const smoothed = smoothAngles(angles, 3);
  
  // Find angle range
  const minAngle = Math.min(...smoothed);
  const maxAngle = Math.max(...smoothed);
  const angleRange = maxAngle - minAngle;
  
  console.log(`[Analyzer] ============ ${exerciseType.toUpperCase()} ANALYSIS ============`);
  console.log(`[Analyzer] Total angles: ${angles.length}`);
  console.log(`[Analyzer] Angle range: ${minAngle.toFixed(1)}° to ${maxAngle.toFixed(1)}° (spread: ${angleRange.toFixed(1)}°)`);
  console.log(`[Analyzer] Required min range: ${thresholds.MIN_ANGLE_RANGE}°`);
  
  // Sample some raw angles for debugging
  if (angles.length > 0) {
    const sampleIndices = [0, Math.floor(angles.length * 0.25), Math.floor(angles.length * 0.5), Math.floor(angles.length * 0.75), angles.length - 1];
    const samples = sampleIndices.map(i => angles[Math.min(i, angles.length - 1)]?.toFixed(1)).join(', ');
    console.log(`[Analyzer] Sample angles: ${samples}`);
  }
  
  if (angleRange < thresholds.MIN_ANGLE_RANGE) {
    console.log(`[Analyzer] ⚠️ ANGLE RANGE TOO SMALL: ${angleRange.toFixed(1)}° < ${thresholds.MIN_ANGLE_RANGE}°`);
    console.log(`[Analyzer] This can happen if:`);
    console.log(`[Analyzer]   - Camera angle doesn't show arm/leg bend properly`);
    console.log(`[Analyzer]   - Person is too far from camera`);
    console.log(`[Analyzer]   - Joints not visible in frame`);
    return [];
  }
  
  // Normalize to 0-100%
  const percentages = smoothed.map(angle => 
    ((angle - minAngle) / angleRange) * 100
  );
  
  // Calculate dynamic thresholds based on actual data
  const median = [...percentages].sort((a, b) => a - b)[Math.floor(percentages.length / 2)];
  const upperThreshold = Math.min(75, median + 15);
  const lowerThreshold = Math.max(25, median - 15);
  
  console.log(`[Analyzer] Median: ${median.toFixed(1)}%, Thresholds: ${lowerThreshold.toFixed(1)}% - ${upperThreshold.toFixed(1)}%`);
  
  // Count reps using state machine
  // For pushups: count both H→L and L→H (down+up = 1 rep counted as 2 half-reps)
  // For curls/squats: count only L→H (one direction = 1 rep)
  const reps: RepResult[] = [];
  let state: 'low' | 'high' | 'neutral' = 'neutral';
  let cycleMax = 0;
  let cycleMin = 100;
  let lastTransition = 0;
  const countBoth = thresholds.COUNT_BOTH_DIRECTIONS;
  
  for (let i = 0; i < percentages.length; i++) {
    const pct = percentages[i];
    
    // Track extremes within current cycle
    cycleMax = Math.max(cycleMax, pct);
    cycleMin = Math.min(cycleMin, pct);
    
    if (state === 'neutral') {
      // Initialize state
      if (pct >= upperThreshold) {
        state = 'high';
        lastTransition = i;
      } else if (pct <= lowerThreshold) {
        state = 'low';
        lastTransition = i;
      }
    } else if (state === 'high') {
      // Looking for signal to go LOW
      if (pct <= lowerThreshold) {
        const rom = cycleMax - cycleMin;
        
        // Count H→L transition only for pushups (countBoth=true)
        if (countBoth && rom > 15 && i - lastTransition >= 2) {
          const romScore = Math.min(60, rom * 0.8);
          const peakScore = Math.min(40, cycleMax * 0.5);
          const score = Math.round(romScore + peakScore);
          
          reps.push({
            repNumber: reps.length + 1,
            maxPercentage: cycleMax,
            rangeOfMotion: rom,
            score,
            isGood: score >= GOOD_REP_THRESHOLD,
          });
          
          console.log(`[Analyzer] ✓ Rep ${reps.length} (H→L): ROM=${rom.toFixed(1)}%`);
        }
        
        state = 'low';
        cycleMax = pct;
        cycleMin = pct;
        lastTransition = i;
      }
    } else if (state === 'low') {
      // Looking for signal to go HIGH - always counts as rep
      if (pct >= upperThreshold) {
        const rom = cycleMax - cycleMin;
        
        if (rom > 15 && i - lastTransition >= 2) {
          const romScore = Math.min(60, rom * 0.8);
          const peakScore = Math.min(40, cycleMax * 0.5);
          const score = Math.round(romScore + peakScore);
          
          reps.push({
            repNumber: reps.length + 1,
            maxPercentage: cycleMax,
            rangeOfMotion: rom,
            score,
            isGood: score >= GOOD_REP_THRESHOLD,
          });
          
          console.log(`[Analyzer] ✓ Rep ${reps.length} (L→H): ROM=${rom.toFixed(1)}%`);
        }
        
        state = 'high';
        cycleMax = pct;
        cycleMin = pct;
        lastTransition = i;
      }
    }
  }
  
  console.log(`[Analyzer] FINAL: ${reps.length} reps counted`);
  return reps;
}

/**
 * Generate analysis result from reps with DETAILED form feedback
 */
export function generateAnalysisResult(
  reps: RepResult[],
  exerciseType: ExerciseType
): AnalysisResult {
  if (reps.length === 0) {
    return {
      repCount: 0,
      formScore: 0,
      goodRepCount: 0,
      badRepCount: 0,
      badRepNumbers: [],
      repScores: [],
      corrections: ['No reps detected. Make sure your full body is visible and movements are clear.'],
    };
  }
  
  const repScores = reps.map(r => r.score);
  const formScore = Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length);
  const goodReps = reps.filter(r => r.isGood);
  const badReps = reps.filter(r => !r.isGood);
  
  // Analyze patterns for specific feedback
  const avgROM = reps.reduce((a, r) => a + r.rangeOfMotion, 0) / reps.length;
  const avgPeak = reps.reduce((a, r) => a + r.maxPercentage, 0) / reps.length;
  const consistency = calculateConsistency(reps);
  
  const corrections = generateDetailedFeedback(
    exerciseType,
    formScore,
    avgROM,
    avgPeak,
    consistency,
    badReps,
    reps.length
  );
  
  return {
    repCount: reps.length,
    formScore,
    goodRepCount: goodReps.length,
    badRepCount: badReps.length,
    badRepNumbers: badReps.map(r => r.repNumber),
    repScores,
    corrections,
  };
}

/**
 * Calculate rep consistency (how similar each rep is)
 */
function calculateConsistency(reps: RepResult[]): number {
  if (reps.length < 2) return 100;
  
  const roms = reps.map(r => r.rangeOfMotion);
  const avg = roms.reduce((a, b) => a + b, 0) / roms.length;
  const variance = roms.reduce((a, r) => a + Math.pow(r - avg, 2), 0) / roms.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower std dev = more consistent (scale: 0-100)
  return Math.max(0, Math.min(100, 100 - stdDev * 2));
}

/**
 * Generate detailed, exercise-specific feedback
 */
function generateDetailedFeedback(
  exerciseType: ExerciseType,
  formScore: number,
  avgROM: number,
  avgPeak: number,
  consistency: number,
  badReps: RepResult[],
  totalReps: number
): string[] {
  const corrections: string[] = [];
  
  // Exercise-specific feedback
  const exerciseTips = {
    pushup: {
      lowROM: 'Go all the way down until your chest nearly touches the ground.',
      lowPeak: 'Fully extend your arms at the top of each rep.',
      inconsistent: 'Keep your movements steady and controlled throughout.',
      fatigue: 'Your last few reps had less depth. Focus on quality over quantity.',
      perfect: 'Excellent pushup form! Full range of motion and controlled movement.',
      good: 'Good pushups! Try to maintain chest-to-ground depth on every rep.',
    },
    squat: {
      lowROM: 'Squat deeper - aim for thighs parallel to the ground or below.',
      lowPeak: 'Stand fully upright at the top of each squat.',
      inconsistent: 'Maintain the same depth on every rep for best results.',
      fatigue: 'Your depth decreased toward the end. Take a short rest between sets.',
      perfect: 'Great squat form! Full depth with controlled movement.',
      good: 'Good squats! Focus on hitting parallel depth consistently.',
    },
    bicep_curl: {
      lowROM: 'Curl all the way up, bringing the weight toward your shoulder.',
      lowPeak: 'Lower the weight fully to extend your arm completely.',
      inconsistent: 'Use controlled movement - avoid swinging the weight.',
      fatigue: 'Your range decreased on later reps. Try a lighter weight.',
      perfect: 'Excellent curl form! Full contraction and extension.',
      good: 'Good curls! Squeeze at the top for maximum muscle engagement.',
    },
  };
  
  const tips = exerciseTips[exerciseType];
  
  // Analyze and give specific feedback
  if (formScore >= 80 && consistency >= 80) {
    corrections.push(tips.perfect);
  } else if (formScore >= 60) {
    corrections.push(tips.good);
  }
  
  // ROM feedback
  if (avgROM < 40) {
    corrections.push(tips.lowROM);
  } else if (avgROM < 60) {
    corrections.push('Increase your range of motion slightly for better muscle activation.');
  }
  
  // Peak feedback (not reaching full extension/contraction)
  if (avgPeak < 70) {
    corrections.push(tips.lowPeak);
  }
  
  // Consistency feedback
  if (consistency < 60) {
    corrections.push(tips.inconsistent);
  }
  
  // Fatigue detection (last reps worse than first)
  if (totalReps >= 5 && badReps.length > 0) {
    const lastBadRep = Math.max(...badReps.map(r => r.repNumber));
    if (lastBadRep > totalReps * 0.6) {
      corrections.push(tips.fatigue);
    }
  }
  
  // Specific bad rep feedback
  if (badReps.length > 0 && badReps.length <= 3) {
    corrections.push(`Rep${badReps.length > 1 ? 's' : ''} #${badReps.map(r => r.repNumber).join(', ')} had reduced range of motion.`);
  } else if (badReps.length > 3) {
    corrections.push(`${badReps.length} reps had incomplete form. Focus on quality over speed.`);
  }
  
  // Limit to top 3 most relevant corrections
  return corrections.slice(0, 3);
}
