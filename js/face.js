// ===================================================
//  얼굴 감지 — MediaPipe FaceMesh (CDN)
// ===================================================

class FaceDetectionService {
  constructor(videoEl, canvasEl) {
    this.video  = videoEl;
    this.canvas = canvasEl;
    this.ctx    = canvasEl?.getContext('2d');

    this.isRunning = false;
    this.result    = { faceDetected: false, isLookingAtCamera: false, gazeScore: 0 };
    this.onResult  = null; // (result) => void

    this._faceMesh  = null;
    this._animFrame = null;
  }

  // ── 카메라 시작 ───────────────────────────────
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      this.video.srcObject = stream;
      await this.video.play();
      return true;
    } catch (e) {
      console.warn('카메라 접근 실패:', e.message);
      return false;
    }
  }

  stopCamera() {
    this.isRunning = false;
    cancelAnimationFrame(this._animFrame);
    const stream = this.video?.srcObject;
    stream?.getTracks().forEach(t => t.stop());
    if (this.video) this.video.srcObject = null;
  }

  // ── MediaPipe FaceMesh 초기화 ─────────────────
  async initFaceMesh() {
    // MediaPipe가 로드되어 있지 않으면 폴백
    if (typeof FaceMesh === 'undefined') {
      console.warn('MediaPipe FaceMesh 미로드 — 간이 감지 모드 사용');
      this._startSimpleDetection();
      return;
    }

    this._faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    this._faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this._faceMesh.onResults((results) => this._processResults(results));
    this.isRunning = true;
    this._runFaceMeshLoop();
  }

  _runFaceMeshLoop() {
    const loop = async () => {
      if (!this.isRunning) return;
      if (this.video.readyState === 4) {
        await this._faceMesh.send({ image: this.video });
      }
      this._animFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  _processResults(results) {
    const detected = !!(results.multiFaceLandmarks?.length);

    let gazeScore = 0;
    if (detected) {
      // 간이 시선 추정: 눈의 중앙 랜드마크가 코 중앙 근처인지 확인
      const lm = results.multiFaceLandmarks[0];
      // 왼눈 중심 (468), 오른눈 중심 (473), 코 끝 (4)
      const leftEye  = lm[468] || lm[33];
      const rightEye = lm[473] || lm[263];
      const nose     = lm[4];
      if (leftEye && rightEye && nose) {
        const eyeMidX = (leftEye.x + rightEye.x) / 2;
        const eyeMidY = (leftEye.y + rightEye.y) / 2;
        const distX = Math.abs(eyeMidX - nose.x);
        const distY = Math.abs(eyeMidY - 0.35);
        gazeScore = Math.max(0, 1 - distX * 4 - distY * 3);
      }
    }

    this.result = {
      faceDetected: detected,
      isLookingAtCamera: gazeScore > 0.5,
      gazeScore,
    };
    this.onResult?.(this.result);

    // 캔버스 오버레이 (선택)
    if (this.canvas && this.ctx && detected) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // 얼굴 외곽선 점 그리기 (간략화)
    }
  }

  // ── 폴백: 비디오 밝기 기반 간이 감지 ─────────
  _startSimpleDetection() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 64; tempCanvas.height = 48;
    const tempCtx = tempCanvas.getContext('2d');
    this.isRunning = true;

    const detect = () => {
      if (!this.isRunning) return;
      if (this.video.readyState === 4) {
        tempCtx.drawImage(this.video, 0, 0, 64, 48);
        const data = tempCtx.getImageData(0, 0, 64, 48).data;
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4)
          brightness += (data[i] + data[i+1] + data[i+2]) / 3;
        brightness /= (data.length / 4);

        const detected = brightness > 30 && brightness < 240;
        this.result = {
          faceDetected: detected,
          isLookingAtCamera: detected,
          gazeScore: detected ? 0.75 : 0,
        };
        this.onResult?.(this.result);
      }
      this._animFrame = requestAnimationFrame(detect);
    };
    detect();
  }
}
