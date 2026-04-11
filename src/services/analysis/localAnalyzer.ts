import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

export interface LocalAnalysisResult {
  summary: { total_reps: number; good_reps: number; bad_reps: number; };
  metadata: { duration_processed: number; consistency_score: number; exercise_type: string; };
}

const MN_LM = { SH_L: 5, SH_R: 6, EL_L: 7, EL_R: 8, WR_L: 9, WR_R: 10, HI_L: 11, HI_R: 12, KN_L: 13, KN_R: 14, AN_L: 15, AN_R: 16 };

class LocalAnalyzer {
  private model: TensorflowModel | null = null;
  private currentExercise: string = 'pushups';
  private totalDuration: number = 0;
  private lastAngles: number[] = [];
  private counter: number = 0;
  private state: 'UP' | 'DOWN' = 'UP';
  private framesProcessed: number = 0;

  // Adaptive Vision State
  private isCalibrated: boolean = false;
  private bestConfig = { yFlip: false, isBGR: false, isNormalized: true };
  private winningConfig = { yFlip: false, isBGR: false, isNormalized: true };
  private maxSeenScore: number = -1;

  // Recovery Engine
  private lastValidAngle: number = 180;
  private framesSinceValid: number = 0;
  private readonly RECOVERY_LIMIT = 15; // 0.5s at 30FPS

  // GPU Resizer State
  private program: any = null;
  private quadBuffer: any = null;

  async init(exerciseType: string, duration: number) {
    this.currentExercise = exerciseType;
    this.totalDuration = duration;
    this.reset();
    if (!this.model) {
      this.model = await loadTensorflowModel(require('@/assets/models/movenet_lightning.tflite'), 'cpu' as any);
    }
  }

  private reset() {
    this.lastAngles = []; this.counter = 0; this.state = 'UP'; this.framesProcessed = 0;
    this.isCalibrated = false; this.maxSeenScore = -1;
    this.lastValidAngle = 180; this.framesSinceValid = 0;
  }

  private setupShader(gl: any) {
    if (this.program) return;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, `attribute vec2 pos; varying vec2 v; void main() { v = pos * 0.5 + 0.5; gl_Position = vec4(pos, 0, 1); }`);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, `precision highp float; uniform sampler2D t; uniform vec2 scale; uniform vec2 offset; varying vec2 v; void main() { vec2 uv = v * scale + offset; gl_FragColor = texture2D(t, uv); }`);
    gl.compileShader(fs);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs); gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  }

  async processImage(gl: any, uri: string, w: number, h: number) {
    if (!this.model || !gl) return;
    this.setupShader(gl);

    try {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, { localUri: uri });
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        const drawTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, drawTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 192, 192, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, drawTex, 0);

        let sX = 1, sY = 1, oX = 0, oY = 0;
        if (w > h) { sX = h / w; oX = (1 - sX) / 2; } else { sY = w / h; oY = (1 - sY) / 2; }
        gl.viewport(0, 0, 192, 192); gl.useProgram(this.program);
        gl.uniform2f(gl.getUniformLocation(this.program, 'scale'), sX, sY); gl.uniform2f(gl.getUniformLocation(this.program, 'offset'), oX, oY);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const pL = gl.getAttribLocation(this.program, 'pos');
        gl.enableVertexAttribArray(pL); gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.vertexAttribPointer(pL, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        const pixels = new Uint8Array(192 * 192 * 4);
        gl.readPixels(0, 0, 192, 192, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.deleteFramebuffer(fb); gl.deleteTexture(texture); gl.deleteTexture(drawTex);

        if (!this.isCalibrated && this.framesProcessed < 8) {
            this.bestConfig.yFlip = (this.framesProcessed % 2 === 0);
            this.bestConfig.isBGR = (Math.floor(this.framesProcessed / 2) % 2 === 1);
            this.bestConfig.isNormalized = (this.framesProcessed < 4);
        }

        const config = this.isCalibrated ? this.winningConfig : this.bestConfig;
        const isFloat = this.model.inputs[0].dataType === 'float32';
        const input = isFloat ? new Float32Array(192 * 192 * 3) : new Uint8Array(192 * 192 * 3);

        for (let y = 0; y < 192; y++) {
            for (let x = 0; x < 192; x++) {
                const srcIdx = ((config.yFlip ? 191 - y : y) * 192 + x) * 4;
                const destIdx = (y * 192 + x) * 3;
                const r = pixels[srcIdx], g = pixels[srcIdx+1], b = pixels[srcIdx+2];
                const c1 = config.isBGR ? b : r, c3 = config.isBGR ? r : b;
                input[destIdx] = (isFloat && config.isNormalized) ? c1/255 : c1;
                input[destIdx+1] = (isFloat && config.isNormalized) ? g/255 : g;
                input[destIdx+2] = (isFloat && config.isNormalized) ? c3/255 : c3;
            }
        }

        const output = await this.model.run([input]);
        const lms = output[0]; if (!lms) return;

        let totalConf = 0;
        for (let i = 0; i < 17; i++) {
            totalConf += Number(lms[i * 3 + 2] ?? 0);
        }
        const avgConf = totalConf / 17;

        if (!this.isCalibrated) {
            if (avgConf > this.maxSeenScore) { this.maxSeenScore = avgConf; this.winningConfig = { ...this.bestConfig }; }
            if (this.framesProcessed === 7) { this.isCalibrated = true; }
        }

        this.processPose(lms);
        this.framesProcessed++;
    } catch (err) { console.error('[Revamp] Error:', err); }
  }

  private processPose(lms: any) {
    const getLM = (idx: number) => ({ y: lms[idx * 3], x: lms[idx * 3 + 1], score: lms[idx * 3 + 2] });
    const configMap: any = {
      pushups: { left: [5, 7, 9], right: [6, 8, 10], up: 155, down: 140 },
      squats: { left: [11, 13, 15], right: [12, 14, 16], up: 160, down: 120 },
      curls: { left: [5, 7, 9], right: [6, 8, 10], up: 160, down: 50 }
    };
    const ex = configMap[this.currentExercise] || configMap.pushups;
    const lS = (getLM(ex.left[0]).score + getLM(ex.left[1]).score + getLM(ex.left[2]).score) / 3;
    const rS = (getLM(ex.right[0]).score + getLM(ex.right[1]).score + getLM(ex.right[2]).score) / 3;

    const useLeft = lS >= rS;
    const joints = useLeft ? ex.left : ex.right;
    const p1 = getLM(joints[0]), p2 = getLM(joints[1]), p3 = getLM(joints[2]);
    const currentScore = (p1.score + p2.score + p3.score) / 3;

    let finalAngle = this.lastValidAngle;
    if (currentScore > 0.15) {
        const angle = Math.abs((Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x)) * 180 / Math.PI);
        finalAngle = angle > 180 ? 360 - angle : angle;
        this.lastValidAngle = finalAngle;
        this.framesSinceValid = 0;
    } else {
        this.framesSinceValid++;
        if (this.framesSinceValid > this.RECOVERY_LIMIT) return; // Ghosted too long
    }

    this.lastAngles.push(finalAngle);

    if (this.state === 'UP' && finalAngle < ex.down) {
      this.state = 'DOWN';
    } else if (this.state === 'DOWN' && finalAngle > ex.up) {
      this.state = 'UP';
      this.counter++;
    }
  }

  finalizeAnalysis() {
    return {
      summary: { total_reps: this.counter, good_reps: this.counter, bad_reps: 0 },
      metadata: { duration_processed: this.totalDuration, consistency_score: this.counter > 0 ? 95 : 0, exercise_type: this.currentExercise }
    };
  }
}

export const localAnalyzer = new LocalAnalyzer();
