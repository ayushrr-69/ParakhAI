import { documentDirectory, readAsStringAsync, writeAsStringAsync, deleteAsync, getInfoAsync } from 'expo-file-system';
import { Video } from 'react-native-compressor';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

export interface Session {
  id: string;
  date: string; // ISO String
  exerciseType: string;
  totalReps: number;
  goodReps: number;
  consistency: number;
  qualityScore: number;
  avgPower: number;
  avgSpeed: number;
  video_url?: string;
  insights: {
    review: string;
    correction: string;
    validation: string;
  };
}

const getHistoryFile = (userId: string) => `${documentDirectory}history_${userId}.json`;
const LEGACY_HISTORY_FILE = `${documentDirectory}session_history.json`;

export const historyService = {
  async getHistory(): Promise<Session[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const HISTORY_FILE = getHistoryFile(user.id);

      // Clean up legacy files if they exist
      const legacyInfo = await getInfoAsync(LEGACY_HISTORY_FILE);
      if (legacyInfo.exists) {
        await deleteAsync(LEGACY_HISTORY_FILE, { idempotent: true });
      }

      // 1. Try to load local cache first for speed
      let localData: Session[] = [];
      const fileInfo = await getInfoAsync(HISTORY_FILE);
      if (fileInfo.exists) {
        const raw = await readAsStringAsync(HISTORY_FILE);
        localData = JSON.parse(raw);
      }

      // 2. Refresh from Cloud
      const { data: cloudData, error } = await supabase
        .from('exercise_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Cloud Fetch Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return localData; // Fallback to local if offline or error
      }

      if (cloudData) {
        const mappedCloudData: Session[] = cloudData.map(s => ({
          id: s.id,
          date: s.created_at,
          exerciseType: s.exercise_type,
          totalReps: s.total_reps,
          goodReps: s.good_reps,
          consistency: s.consistency_score,
          qualityScore: s.quality_score,
          avgPower: s.avg_power,
          avgSpeed: s.avg_speed,
          video_url: s.video_url,
          insights: s.insights
        }));

        // Use unique ID for merge
        const localOnly = localData.filter(ls => 
          !mappedCloudData.some(cs => cs.id === ls.id)
        );
        
        const combined = [...localOnly, ...mappedCloudData].slice(0, 50);
        
        // Update local cache
        await writeAsStringAsync(HISTORY_FILE, JSON.stringify(combined));
        return combined;
      }

      return localData;
    } catch (e) {
      console.error('Failed to load history:', e);
      return [];
    }
  },

  async addSession(session: Omit<Session, 'id' | 'date'>, videoUri?: string): Promise<string> {
    const base64ToUint8Array = (base64: string) => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      let uploadedVideoUrl: string | undefined = undefined;

      // 1. Handle Video Compression and Upload if URI provided
      if (videoUri) {
        console.log('[historyService] Compressing video:', videoUri);
        try {
          const compressedUri = await Video.compress(videoUri, {
            compressionMethod: 'auto',
          }, (progress) => {
            console.log('[historyService] Compression Progress:', progress);
          });

          console.log('[historyService] Uploading compressed video...');
          const filename = `${user.id}/${Date.now()}_workout.mp4`;
          const fileBase64 = await FileSystem.readAsStringAsync(compressedUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          const { data: uploadRes, error: uploadError } = await supabase.storage
            .from('exercise-videos')
            .upload(filename, base64ToUint8Array(fileBase64), {
              contentType: 'video/mp4',
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('exercise-videos')
            .getPublicUrl(filename);
            
          uploadedVideoUrl = publicUrl;
          console.log('[historyService] Video Upload Success:', publicUrl);
        } catch (err) {
          console.error('[historyService] Video Processing Failed:', err);
          // We continue but without video URL
        }
      }

      // 2. Save to Cloud
      const { data: cloudRes, error: syncError } = await supabase
        .from('exercise_sessions')
        .insert([{
          user_id: user.id,
          exercise_type: session.exerciseType,
          total_reps: Math.round(session.totalReps),
          good_reps: Math.round(session.goodReps),
          bad_reps: Math.round(session.totalReps - session.goodReps),
          quality_score: Math.round(session.qualityScore),
          consistency_score: Math.round(session.consistency),
          avg_power: Number(session.avgPower.toFixed(2)),
          avg_speed: Number(session.avgSpeed.toFixed(2)),
          video_url: uploadedVideoUrl,
          insights: session.insights,
        }])
        .select()
        .single();

      if (syncError) {
        console.error('Supabase Cloud Sync Failed:', {
          message: syncError.message,
          details: syncError.details,
          code: syncError.code,
          hint: syncError.hint
        });
        // We throw here so the UI knows the save failed
        throw syncError;
      }

      console.log('Supabase Sync Success: Session ID', cloudRes.id);

      // 2. Update Local Cache
      const HISTORY_FILE = getHistoryFile(user.id);
      const history = await this.getHistory();
      
      const newSession: Session = {
        ...session,
        id: cloudRes.id,
        date: cloudRes.created_at,
      };

      const updatedHistory = [newSession, ...history.filter(h => h.id !== cloudRes.id)].slice(0, 50);
      await writeAsStringAsync(HISTORY_FILE, JSON.stringify(updatedHistory));

      return cloudRes.id;
    } catch (e) {
      console.error('historyService.addSession failed:', e);
      throw e;
    }
  },

  async clearHistory(): Promise<void> {
    try {
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      
      await deleteAsync(LEGACY_HISTORY_FILE, { idempotent: true });
      if (user) {
        const HISTORY_FILE = getHistoryFile(user.id);
        await deleteAsync(HISTORY_FILE, { idempotent: true });
      }
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }
};
