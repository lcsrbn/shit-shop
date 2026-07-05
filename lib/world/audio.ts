// The radio. No audio files — the song is synthesized with WebAudio,
// so the world stays asset-free until real songs replace it.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;
let stepTimer: number | null = null;
let playing = false;

// A slow arpeggio in A minor, like something remembered badly.
const NOTES = [220.0, 261.63, 329.63, 440.0, 392.0, 329.63, 261.63, 246.94];
const STEP_MS = 340;

function ensureContext() {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    ctx = new AC();
  }

  return ctx;
}

export function isRadioOn() {
  return playing;
}

export function startRadio() {
  if (playing) return;

  const ac = ensureContext();
  if (ac.state === "suspended") void ac.resume();

  master = ac.createGain();
  master.gain.value = 0.5;

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 950;

  const delay = ac.createDelay(1.5);
  delay.delayTime.value = 0.42;

  const feedback = ac.createGain();
  feedback.gain.value = 0.32;

  filter.connect(master);
  filter.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);
  master.connect(ac.destination);

  // Low drone under everything.
  droneOsc = ac.createOscillator();
  droneOsc.type = "sine";
  droneOsc.frequency.value = 110;

  const droneGain = ac.createGain();
  droneGain.gain.value = 0.045;

  droneOsc.connect(droneGain);
  droneGain.connect(master);
  droneOsc.start();

  let step = 0;

  const playStep = () => {
    if (!ctx || !playing) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = NOTES[step % NOTES.length];

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.11, now + 0.03);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(env);
    env.connect(filter);
    osc.start(now);
    osc.stop(now + 0.7);

    step += 1;
  };

  playing = true;
  playStep();
  stepTimer = window.setInterval(playStep, STEP_MS);
}

export function stopRadio() {
  if (!playing) return;

  playing = false;

  if (stepTimer !== null) {
    window.clearInterval(stepTimer);
    stepTimer = null;
  }

  if (droneOsc) {
    try {
      droneOsc.stop();
    } catch {}
    droneOsc = null;
  }

  if (master && ctx) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    const m = master;
    window.setTimeout(() => m.disconnect(), 400);
    master = null;
  }
}
