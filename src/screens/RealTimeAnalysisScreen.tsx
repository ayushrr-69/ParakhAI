import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, useCameraFormat } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/common/AppText';
import { BackButton } from '@/components/common/BackButton';
import { theme } from '@/theme';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RealTimeAnalysis'>;

export function RealTimeAnalysisScreen({ route, navigation }: Props) {
  const { exerciseType } = route.params;
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  
  const [displayReps, setDisplayReps] = useState(0);
  const [displayGood, setDisplayGood] = useState(0);
  const [displayBad, setDisplayBad] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Optimized Format: Target 720p (1280x720) for consistent performance
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 }
  ]);

  // Rep Counter Shared Values (Performance)
  const repCount = useSharedValue(0);
  const goodReps = useSharedValue(0);
  const badReps = useSharedValue(0);
  const stage = useSharedValue(0); // 0: Start, 1: Peak
  const frameCounter = useSharedValue(0);
  const isBusy = useSharedValue(false);

  // Load MoveNet Lightning (Expert ML choice: fast, accurate, mobile-optimized)
  const model = useTensorflowModel(require('@/assets/models/movenet_lightning.tflite'), 'cpu' as any);

  // Perspective-Proof 3D Angle Math (Worklet)
  const calculate3DAngle = (p1: any, p2: any, p3: any) => {
    'worklet';
    const BA = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
    const BC = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
    const dotProduct = (BA.x * BC.x) + (BA.y * BC.y) + (BA.z * BC.z);
    const magA = Math.sqrt(BA.x * BA.x + BA.y * BA.y + BA.z * BA.z);
    const magC = Math.sqrt(BC.x * BC.x + BC.y * BC.y + BC.z * BC.z);
    return (Math.acos(dotProduct / (magA * magC)) * 180.0) / Math.PI;
  };

  const updateUI = Worklets.createRunOnJS((newCount: number, newGood: number) => {
    setDisplayReps(newCount);
    setDisplayGood(newGood);
  });

  const triggerHaptic = Worklets.createRunOnJS(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  });

  useEffect(() => {
    async function requestPermission() {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      // Adding a 500ms delay to ensure everything is settled before camera mounts
      setTimeout(() => setIsReady(true), 500);
    }
    requestPermission();
  }, []);

  // Frame Processor for MoveNet Real-Time ML
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    frameCounter.value += 1;
    if (frameCounter.value % 2 !== 0 || isBusy.value) return;
    
    if (!model || model.state !== 'loaded' || !model.model) return;

    try {
      isBusy.value = true;
      const output = (model.model as any).run(frame);
      
      if (!output || !Array.isArray(output) || output.length === 0) {
        isBusy.value = false;
        return;
      }

      // 2. Extract 17 MoveNet Landmarks [y, x, score]
      const landmarks = output[0];
      if (!landmarks || landmarks.length < 51) {
        isBusy.value = false;
        return;
      }
      
      const offset = 3;
      let p1, p2, p3;
      
      // Choose side based on visibility
      const leftVis = (landmarks[5*offset+2] + landmarks[7*offset+2] + landmarks[9*offset+2]) / 3;
      const rightVis = (landmarks[6*offset+2] + landmarks[8*offset+2] + landmarks[10*offset+2]) / 3;
      const base = leftVis > rightVis ? 5 : 6;

      if (exerciseType === 'bicep_curls' || exerciseType === 'pushups') {
          p1 = { x: landmarks[base*offset+1], y: landmarks[base*offset], z: 0 };
          p2 = { x: landmarks[(base+2)*offset+1], y: landmarks[(base+2)*offset], z: 0 };
          p3 = { x: landmarks[(base+4)*offset+1], y: landmarks[(base+4)*offset], z: 0 };
      } else if (exerciseType === 'squats') {
          const hBase = leftVis > rightVis ? 11 : 12;
          p1 = { x: landmarks[hBase*offset+1], y: landmarks[hBase*offset], z: 0 };
          p2 = { x: landmarks[(hBase+2)*offset+1], y: landmarks[(hBase+2)*offset], z: 0 };
          p3 = { x: landmarks[(hBase+4)*offset+1], y: landmarks[(hBase+4)*offset], z: 0 };
      }

      const angle = calculate3DAngle(p1, p2, p3);

      const config: any = {
        pushups: { up: 160, down: 85 },
        squats: { up: 160, down: 90 },
        bicep_curls: { up: 160, down: 40 }
      };
      const ex = config[exerciseType] || config.pushups;

      if (stage.value === 0 && angle < ex.down) {
          stage.value = 1;
          triggerHaptic();
      } else if (stage.value === 1 && angle > ex.up) {
          stage.value = 0;
          repCount.value += 1;
          goodReps.value += 1;
          updateUI(repCount.value, goodReps.value);
          triggerHaptic();
      }
    } catch (err) {
    } finally {
      isBusy.value = false;
    }
  }, [model, exerciseType]);


  if (!hasPermission) return <View style={styles.container}><AppText color="#fff">No Camera Permission</AppText></View>;
  if (!device) return <View style={styles.container}><AppText color="#fff">No Camera Device Found</AppText></View>;
  if (!isReady) return <View style={styles.container}><AppText color="#fff">Initializing Camera...</AppText></View>;

  // Model loading state
  if (model.state === 'loading') {
    return (
      <View style={styles.container}>
        <AppText variant="title">Loading AI Model...</AppText>
      </View>
    );
  }

  if (model.state === 'error') {
     return (
      <View style={styles.container}>
        <AppText color={theme.colors.error}>Error: Model missing in assets/</AppText>
        <AppText variant="bodySmall" style={{marginTop: 10, textAlign: 'center'}}>
          Please add "movenet_lightning.tflite" to "src/assets/models/"
        </AppText>
      </View>
    );
  }


  const handleFinish = () => {
    navigation.navigate('AnalysisResults', {
      exerciseType,
      results: {
        analysis: {
          summary: {
            total_reps: displayReps,
            good_reps: displayGood,
            bad_reps: displayBad,
          },
          metadata: {
            duration_processed: 0, // Real-time session
          }
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        format={format}
        fps={30}
        videoStabilizationMode="auto"
        frameProcessor={frameProcessor}
      />

      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText variant="heading" weight="semibold">
          {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1).replace('_', ' ')}
        </AppText>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
           <View style={styles.countCircle}>
             <AppText variant="heading" weight="semibold" color={theme.colors.textDark}>{displayReps}</AppText>
             <AppText variant="bodySmall" color={theme.colors.textDark}>REPS</AppText>
           </View>
           
           <View style={styles.statsContainer}>
             <View style={styles.statBox}>
               <AppText variant="title" weight="semibold" color={theme.colors.successText}>{displayGood}</AppText>
               <AppText variant="bodySmall" color={theme.colors.placeholder}>GOOD</AppText>
             </View>
             <View style={styles.statBox}>
               <AppText variant="title" weight="semibold" color={theme.colors.error}>{displayBad}</AppText>
               <AppText variant="bodySmall" color={theme.colors.placeholder}>BAD</AppText>
             </View>
           </View>
        </View>

        <Pressable onPress={handleFinish} style={styles.finishButton}>
            <AppText weight="semibold" color={theme.colors.textDark}>Finish</AppText>
        </Pressable>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    gap: theme.spacing.md,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(35, 34, 32, 0.9)',
    borderRadius: 32,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  finishButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },

  countCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
});
