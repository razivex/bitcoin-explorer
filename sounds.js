const SOUNDS_ENABLED_KEY = "bitcoin-explorer-sounds-enabled";

let audioContext = null;
let soundsEnabled = true;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

async function ensureAudioReady() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx;
}

function loadSoundsPreference() {
  try {
    const stored = localStorage.getItem(SOUNDS_ENABLED_KEY);
    if (stored !== null) {
      soundsEnabled = stored === "true";
    }
  } catch (err) {
    console.error(err);
  }
}

function setSoundsEnabled(enabled) {
  soundsEnabled = enabled;
  try {
    localStorage.setItem(SOUNDS_ENABLED_KEY, String(enabled));
  } catch (err) {
    console.error(err);
  }
  updateSoundToggleUi();
}

function toggleSoundsEnabled() {
  setSoundsEnabled(!soundsEnabled);
}

function updateSoundToggleUi() {
  const btn = document.getElementById("soundToggleBtn");
  if (!btn) return;

  btn.classList.toggle("is-muted", !soundsEnabled);
  btn.setAttribute("aria-pressed", String(soundsEnabled));
  btn.setAttribute(
    "aria-label",
    soundsEnabled ? t("muteSounds") : t("unmuteSounds"),
  );
  btn.title = soundsEnabled ? t("soundsOn") : t("soundsOff");
}

function initSoundToggle() {
  loadSoundsPreference();
  updateSoundToggleUi();

  const btn = document.getElementById("soundToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleSoundsEnabled);
}

function playBellSound() {
  if (!soundsEnabled) return;

  ensureAudioReady().then((ctx) => {
    const now = ctx.currentTime;
    const duration = 1.4;

    const partials = [
      { freq: 660, gain: 0.35 },
      { freq: 990, gain: 0.22 },
      { freq: 1320, gain: 0.16 },
      { freq: 1760, gain: 0.1 },
      { freq: 2340, gain: 0.06 },
    ];

    partials.forEach(({ freq, gain: peak }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + duration);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    });
  });
}

function playConfirmedSound() {
  if (!soundsEnabled) return;

  ensureAudioReady().then((ctx) => {
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.06);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      const decay = Math.exp(-i / (bufferSize * 0.12));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    const clicks = [
      { time: 0, freq: 220, peak: 0.28, length: 0.07 },
      { time: 0.11, freq: 310, peak: 0.22, length: 0.06 },
      { time: 0.2, freq: 180, peak: 0.18, length: 0.09 },
    ];

    clicks.forEach(({ time, freq, peak, length }) => {
      const start = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, start + length);

      gain.gain.setValueAtTime(peak, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + length);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + length + 0.02);
    });
  });
}

initSoundToggle();