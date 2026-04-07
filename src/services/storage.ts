/**
 * Local Storage Service
 * Handles persisting workout history using AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  WORKOUT_HISTORY: '@parakh_workout_history',
  USER_PREFERENCES: '@parakh_user_preferences',
};

export interface WorkoutRecord {
  id: string;
  date: string;  // ISO string
  exerciseType: 'pushup' | 'squat' | 'bicep_curl';
  repCount: number;
  formScore: number;
  goodRepCount: number;
  badRepCount: number;
  duration?: number; // seconds
  corrections: string[];
  repScores: number[];
}

export interface UserPreferences {
  name?: string;
  defaultExercise?: string;
  notificationsEnabled?: boolean;
}

/**
 * Save a workout to history
 */
export async function saveWorkout(workout: Omit<WorkoutRecord, 'id' | 'date'>): Promise<WorkoutRecord> {
  try {
    const history = await getWorkoutHistory();
    
    const newRecord: WorkoutRecord = {
      ...workout,
      id: generateId(),
      date: new Date().toISOString(),
    };
    
    history.unshift(newRecord); // Add to beginning (most recent first)
    
    // Keep only last 100 workouts
    const trimmedHistory = history.slice(0, 100);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.WORKOUT_HISTORY, 
      JSON.stringify(trimmedHistory)
    );
    
    console.log(`[Storage] Saved workout: ${newRecord.exerciseType}, ${newRecord.repCount} reps`);
    return newRecord;
  } catch (error) {
    console.error('[Storage] Failed to save workout:', error);
    throw error;
  }
}

/**
 * Get all workout history
 */
export async function getWorkoutHistory(): Promise<WorkoutRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Storage] Failed to get workout history:', error);
    return [];
  }
}

/**
 * Get workout by ID
 */
export async function getWorkoutById(id: string): Promise<WorkoutRecord | null> {
  try {
    const history = await getWorkoutHistory();
    return history.find(w => w.id === id) || null;
  } catch (error) {
    console.error('[Storage] Failed to get workout:', error);
    return null;
  }
}

/**
 * Get workouts filtered by exercise type
 */
export async function getWorkoutsByExercise(
  exerciseType: WorkoutRecord['exerciseType']
): Promise<WorkoutRecord[]> {
  const history = await getWorkoutHistory();
  return history.filter(w => w.exerciseType === exerciseType);
}

/**
 * Get workout stats summary
 */
export async function getWorkoutStats(): Promise<{
  totalWorkouts: number;
  totalReps: number;
  averageScore: number;
  byExercise: Record<string, { count: number; totalReps: number; avgScore: number }>;
  thisWeek: number;
  thisMonth: number;
}> {
  const history = await getWorkoutHistory();
  
  if (history.length === 0) {
    return {
      totalWorkouts: 0,
      totalReps: 0,
      averageScore: 0,
      byExercise: {},
      thisWeek: 0,
      thisMonth: 0,
    };
  }
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const totalReps = history.reduce((sum, w) => sum + w.repCount, 0);
  const averageScore = Math.round(
    history.reduce((sum, w) => sum + w.formScore, 0) / history.length
  );
  
  const byExercise: Record<string, { count: number; totalReps: number; avgScore: number }> = {};
  
  for (const workout of history) {
    if (!byExercise[workout.exerciseType]) {
      byExercise[workout.exerciseType] = { count: 0, totalReps: 0, avgScore: 0 };
    }
    byExercise[workout.exerciseType].count++;
    byExercise[workout.exerciseType].totalReps += workout.repCount;
  }
  
  // Calculate average scores per exercise
  for (const type of Object.keys(byExercise)) {
    const exerciseWorkouts = history.filter(w => w.exerciseType === type);
    byExercise[type].avgScore = Math.round(
      exerciseWorkouts.reduce((sum, w) => sum + w.formScore, 0) / exerciseWorkouts.length
    );
  }
  
  const thisWeek = history.filter(w => new Date(w.date) >= weekAgo).length;
  const thisMonth = history.filter(w => new Date(w.date) >= monthAgo).length;
  
  return {
    totalWorkouts: history.length,
    totalReps,
    averageScore,
    byExercise,
    thisWeek,
    thisMonth,
  };
}

/**
 * Delete a workout from history
 */
export async function deleteWorkout(id: string): Promise<boolean> {
  try {
    const history = await getWorkoutHistory();
    const filtered = history.filter(w => w.id !== id);
    
    if (filtered.length === history.length) {
      return false; // Not found
    }
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.WORKOUT_HISTORY, 
      JSON.stringify(filtered)
    );
    
    return true;
  } catch (error) {
    console.error('[Storage] Failed to delete workout:', error);
    return false;
  }
}

/**
 * Clear all workout history
 */
export async function clearWorkoutHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.WORKOUT_HISTORY);
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.USER_PREFERENCES,
    JSON.stringify(prefs)
  );
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
