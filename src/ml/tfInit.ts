/**
 * TensorFlow.js initialization for React Native
 * Must be called before using any TF operations
 */
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initializeTensorFlow(): Promise<void> {
  if (isInitialized) return;
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    console.log('[TF] Initializing TensorFlow.js...');
    
    // Wait for TF.js to be ready
    await tf.ready();
    
    // Set backend to 'rn-webgl' for React Native
    await tf.setBackend('rn-webgl');
    
    console.log(`[TF] Backend: ${tf.getBackend()}`);
    console.log('[TF] TensorFlow.js initialized successfully');
    
    isInitialized = true;
  })();
  
  return initPromise;
}

export function isTensorFlowReady(): boolean {
  return isInitialized;
}

export { tf };
