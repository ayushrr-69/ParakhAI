package com.ayushrr.sportsperformancetracker

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import androidx.lifecycle.LifecycleOwner

class RepCounterModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var cameraService: CameraService? = null
    private var poseDetector: PoseLandmarkerHelper? = null
    private var repCount = 0

    override fun getName() = "RepCounterModule"

    @ReactMethod
    fun start() {
        val activity = currentActivity as? LifecycleOwner ?: return
        
        poseDetector = PoseLandmarkerHelper(reactContext) { result ->
            if (result.landmarks().isNotEmpty()) {
                sendEvent("onRep", (++repCount).toDouble())
            }
        }


        cameraService = CameraService(reactContext)
        cameraService?.start(activity) { image ->
            poseDetector?.detect(image)
        }
    }

    @ReactMethod
    fun stop() {
        cameraService?.stop()
        poseDetector?.stop()
    }

    private fun sendEvent(eventName: String, params: Double) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
    }
}
