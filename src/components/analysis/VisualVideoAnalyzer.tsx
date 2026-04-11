import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { GLView } from 'expo-gl';
import { localAnalyzer } from '@/services/analysis/localAnalyzer';
import { visualAnalysisBridge } from '@/services/analysis/visualAnalysisBridge';

/**
 * VisualVideoAnalyzer (Sequential Decoder Edition).
 * Instead of playing the video live, this engine "slices" the file 
 * into high-quality JPEGs, ensuring 100% pixel visibility on Android.
 */
export const VisualVideoAnalyzer: React.FC = () => {
  const glRef = useRef<any>(null);
  const isAnalyzing = useRef(false);

  useEffect(() => {
    visualAnalysisBridge.register(async ({ videoUri, exerciseType, duration, onProgress }) => {
      if (isAnalyzing.current) throw new Error('Analysis already in progress');
      if (!glRef.current) throw new Error('GL Control not initialized');

      console.log(`[Revamp] Starting Sequential Decoder: ${videoUri}`);
      isAnalyzing.current = true;
      
      try {
        await localAnalyzer.init(exerciseType, duration);
        
        // --- THE SEQUENTIAL LOOP ---
        // We take 10 frames per second (100ms intervals)
        // This is 100% stable regardless of Android hardware layers.
        const interval = 0.033; 
        const totalFrames = Math.floor((duration + 10) / interval);
        
        for (let i = 0; i < totalFrames; i++) {
            if (!isAnalyzing.current) break;

            const timeMs = i * interval * 1000;
            
            // 1. Extract high-quality frame
            const thumbnail = await getThumbnailAsync(videoUri, {
                time: timeMs,
                quality: 0.8
            });

            // 2. Convert JPEG to AI Tensor via GL Bridge
            await localAnalyzer.processImage(glRef.current, thumbnail.uri, thumbnail.width, thumbnail.height);

            // 3. Update Progress
            if (onProgress) {
                const progress = Math.round(((i + 1) / totalFrames) * 100);
                onProgress(progress);
            }
        }

        console.log(`[Revamp] Analysis complete.`);
        isAnalyzing.current = false;
        return localAnalyzer.finalizeAnalysis();

      } catch (err: any) {
        isAnalyzing.current = false;
        console.error(`[Revamp] Error:`, err);
        throw err;
      }
    });

    return () => visualAnalysisBridge.unregister();
  }, []);

  const onContextCreate = (gl: any) => {
    glRef.current = gl;
  };

  return (
    <View style={styles.hiddenContainer}>
      {/* Tiny 256x256 GL processor (No VideoView needed anymore) */}
      <GLView
        style={styles.processor}
        onContextCreate={onContextCreate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    width: 256,
    height: 256,
    left: -500, // Totally off-screen
    top: 0,
    opacity: 0.1,
    zIndex: -1,
  },
  processor: {
    width: '100%',
    height: '100%',
  }
});
