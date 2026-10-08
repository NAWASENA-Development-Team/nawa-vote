/**
 * sounds.ts
 * Web Audio API sound engine — zero external files, zero network requests.
 * All sounds synthesized via OscillatorNode / AudioBuffer.
 * Muted by default; call unlock() after first user gesture.
 */

let ctx: AudioContext | null = null;
let muted = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return ctx;
}

/** Call once after a user gesture (click/touch) to unlock audio. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') {
    c.resume();
  }
  muted = false;
}

export function muteAudio(): void {
  muted = true;
}

export function isMuted(): boolean {
  return muted;
}

function playTone(
  frequency: number,
  endFrequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
): void {
  if (muted) return;
  const c = getCtx();
  if (!c) return;

  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.connect(gain);
  gain.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime);
  osc.frequency.linearRampToValueAtTime(endFrequency, c.currentTime + duration);

  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

/** Balloon entry — ascending triangle tone */
export function playBalloonRise(delayMs = 0): void {
  if (muted) return;
  setTimeout(() => playTone(220, 440, 0.3, 0.12, 'triangle'), delayMs);
}

/** New vote received via Realtime — short chirp */
export function playVoteBurst(): void {
  playTone(440, 880, 0.15, 0.1, 'sine');
}

/** User taps balloon — pop */
export function playBalloonPop(): void {
  const c = getCtx();
  if (!c || muted) return;

  // White noise burst for pop
  const bufferSize = c.sampleRate * 0.12;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = c.createBufferSource();
  source.buffer = buffer;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.4, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);

  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  source.start();
}

/** Interface cycle transition — soft whoosh */
export function playInterfaceSwitch(): void {
  const c = getCtx();
  if (!c || muted) return;

  const bufferSize = c.sampleRate * 0.25;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.15;
  }

  const source = c.createBufferSource();
  source.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  source.start();
}

/** Identity reveal — short ascending arpeggio (3 notes) */
export function playReveal(): void {
  if (muted) return;
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, freq, 0.18, 0.15, 'triangle'), i * 150);
  });
}

/** Counter tick — every 5 votes */
export function playCounterTick(): void {
  playTone(1200, 1200, 0.02, 0.06, 'sine');
}
