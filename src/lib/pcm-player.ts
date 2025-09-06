export class PcmPlayer {
  private audioContext: AudioContext;
  private targetSampleRate: number;
  private lastScheduledTime: number;

  constructor(sampleRate: number = 24000) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate,
    });
    this.targetSampleRate = sampleRate;
    this.lastScheduledTime = 0;
  }

  enqueuePcm16(pcm16Buffer: ArrayBuffer) {
    const int16 = new Int16Array(pcm16Buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000; // normalize to [-1, 1]
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, this.targetSampleRate);
    audioBuffer.copyToChannel(float32, 0, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    const startAt = Math.max(now + 0.02, this.lastScheduledTime);
    source.start(startAt);

    this.lastScheduledTime = startAt + audioBuffer.duration;
  }

  reset() {
    try { this.audioContext.close(); } catch { /* noop */ }
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: this.targetSampleRate,
    });
    this.lastScheduledTime = 0;
  }
}


