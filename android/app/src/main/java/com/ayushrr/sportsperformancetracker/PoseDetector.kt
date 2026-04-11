package com.ayushrr.sportsperformancetracker

import android.content.Context
import androidx.camera.core.ImageProxy
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult

class PoseLandmarkerHelper(context: Context, private val listener: (PoseLandmarkerResult) -> Unit) {
    private var poseLandmarker: PoseLandmarker? = null

    init {
        val options = PoseLandmarker.PoseLandmarkerOptions.builder()
            .setBaseOptions(BaseOptions.builder()
                .setModelAssetPath("pose_landmarker_lite.task")
                .build())
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setResultListener { result, _ -> listener(result) }
            .build()
        poseLandmarker = PoseLandmarker.createFromOptions(context, options)
    }


    fun detect(imageProxy: ImageProxy) {
        val mpImage = BitmapImageBuilder(imageProxy.toBitmap()).build()
        poseLandmarker?.detectAsync(mpImage, System.currentTimeMillis())
        imageProxy.close()
    }

    fun stop() {
        poseLandmarker?.close()
    }
}

