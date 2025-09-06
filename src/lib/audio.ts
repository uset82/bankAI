export async function recordOnceMs(ms = 5000): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  
  return new Promise((resolve) => {
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      resolve(new Blob(chunks, { type: "audio/webm" }));
    };
    rec.start();
    setTimeout(() => rec.stop(), ms);
  });
}

export async function playBase64Mp3(b64: string) {
  const src = `data:audio/mpeg;base64,${b64}`;
  const audio = new Audio(src);
  await audio.play();
}

export function getMediaRecorderMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'audio/webm'; // fallback
}