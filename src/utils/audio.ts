import { Note, TrackData } from "../types";

export function noteToFreq(note: string): number {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const parsed = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!parsed) return 440;
  const name = parsed[1];
  const octave = parseInt(parsed[2], 10);
  const semitones = notes.indexOf(name) + (octave - 4) * 12;
  return 440 * Math.pow(2, (semitones - 9) / 12);
}

// Global audio context manager
let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 2.0; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

export interface SynthParams {
  waveform: OscillatorType;
  filterCutoff: number; // 200 to 8000
  filterQ: number; // 0.1 to 15
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0 to 1
  release: number; // seconds
  echoTime: number; // seconds
  echoFeedback: number; // 0 to 0.8
}

export const DEFAULT_SYNTH_PARAMS: SynthParams = {
  waveform: "sawtooth",
  filterCutoff: 2000,
  filterQ: 1.5,
  attack: 0.05,
  decay: 0.15,
  sustain: 0.6,
  release: 0.3,
  echoTime: 0.25,
  echoFeedback: 0.35,
};

// Scheduler & Playback Engine
export class SequencePlayer {
  private ctx: AudioContext;
  private isPlaying = false;
  private tempo = 120;
  private startTime = 0;
  private sequenceLengthBeats = 32;
  private activeScheduledNodes: { stop: () => void }[] = [];
  private onBeatUpdate?: (beat: number) => void;
  private onPlaybackEnded?: () => void;
  private playheadTimer?: number;

  constructor() {
    this.ctx = getAudioContext();
  }

  public setCallbacks(onBeat: (beat: number) => void, onEnd: () => void) {
    this.onBeatUpdate = onBeat;
    this.onPlaybackEnded = onEnd;
  }

  public getPlaybackState(): boolean {
    return this.isPlaying;
  }

  public getPlayheadBeat(): number {
    if (!this.isPlaying) return 0;
    const elapsedSeconds = this.ctx.currentTime - this.startTime;
    const beatsPerSecond = this.tempo / 60;
    const elapsedBeats = elapsedSeconds * beatsPerSecond;
    return elapsedBeats % this.sequenceLengthBeats;
  }

  public playSeq(tracks: TrackData, tempo: number, lengthBeats: number, synthParams: SynthParams) {
    this.stopSeq();
    this.ctx = getAudioContext();
    this.isPlaying = true;
    this.tempo = tempo;
    this.sequenceLengthBeats = lengthBeats;
    this.startTime = this.ctx.currentTime + 0.1; // Add small buffer to avoid jitter

    const beatsPerSecond = this.tempo / 60;
    const secondsPerBeat = 60 / this.tempo;
    const totalDurationSeconds = lengthBeats * secondsPerBeat;

    // Set up master nodes for this playback
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    // Filter node
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(synthParams.filterCutoff, this.ctx.currentTime);
    filter.Q.setValueAtTime(synthParams.filterQ, this.ctx.currentTime);

    // Delay/Echo node
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(synthParams.echoTime, this.ctx.currentTime);
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(synthParams.echoFeedback, this.ctx.currentTime);

    // Wire up master effects
    masterGain.connect(filter);
    filter.connect(this.ctx.destination);

    // Wire up delay feedback
    filter.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(this.ctx.destination);

    this.activeScheduledNodes.push({
      stop: () => {
        try {
          masterGain.disconnect();
          filter.disconnect();
          delay.disconnect();
          delayFeedback.disconnect();
        } catch (_) {}
      },
    });

    // Schedule Melody (Lead synth)
    tracks.melody.forEach((note) => {
      const noteStartSeconds = note.time * secondsPerBeat;
      if (noteStartSeconds >= totalDurationSeconds) return;

      const scheduleTime = this.startTime + noteStartSeconds;
      const durationSeconds = note.duration * secondsPerBeat;

      this.scheduleSynthNote(
        note.pitch,
        scheduleTime,
        durationSeconds,
        note.velocity * 0.4, // Keep volume balanced
        synthParams,
        masterGain
      );
    });

    // Schedule Harmony (Arpeggiated pads)
    tracks.harmony.forEach((note) => {
      const noteStartSeconds = note.time * secondsPerBeat;
      if (noteStartSeconds >= totalDurationSeconds) return;

      const scheduleTime = this.startTime + noteStartSeconds;
      const durationSeconds = note.duration * secondsPerBeat;

      // Soft triangle waves for ambient bed
      this.scheduleSynthNote(
        note.pitch,
        scheduleTime,
        durationSeconds,
        note.velocity * 0.25,
        { ...synthParams, waveform: "triangle", attack: 0.1, release: 0.5 },
        masterGain
      );
    });

    // Schedule Drums
    const drumGain = this.ctx.createGain();
    drumGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
    drumGain.connect(this.ctx.destination);
    this.activeScheduledNodes.push({
      stop: () => {
        try {
          drumGain.disconnect();
        } catch (_) {}
      },
    });

    tracks.drums.forEach((note) => {
      const noteStartSeconds = note.time * secondsPerBeat;
      if (noteStartSeconds >= totalDurationSeconds) return;

      const scheduleTime = this.startTime + noteStartSeconds;
      this.scheduleDrumNote(note.pitch, scheduleTime, note.velocity, drumGain);
    });

    // Setup visual update timers
    const updateTick = () => {
      if (!this.isPlaying) return;
      const currentBeat = this.getPlayheadBeat();
      if (this.onBeatUpdate) {
        this.onBeatUpdate(currentBeat);
      }

      const elapsed = this.ctx.currentTime - this.startTime;
      if (elapsed >= totalDurationSeconds) {
        this.stopSeq();
        if (this.onPlaybackEnded) this.onPlaybackEnded();
      } else {
        this.playheadTimer = requestAnimationFrame(updateTick);
      }
    };
    this.playheadTimer = requestAnimationFrame(updateTick);
  }

  public stopSeq() {
    this.isPlaying = false;
    if (this.playheadTimer) {
      cancelAnimationFrame(this.playheadTimer);
      this.playheadTimer = undefined;
    }
    this.activeScheduledNodes.forEach((node) => {
      try {
        node.stop();
      } catch (_) {}
    });
    this.activeScheduledNodes = [];
  }

  // Trigger preview notes instantly for interactive Virtual Piano Keyboards
  public triggerLiveNote(pitch: string, params: SynthParams) {
    this.ctx = getAudioContext();
    const now = this.ctx.currentTime;
    const dest = this.ctx.createGain();
    dest.gain.setValueAtTime(0.4, now);
    dest.connect(this.ctx.destination);

    this.scheduleSynthNote(pitch, now, 0.5, 0.4, params, dest);
  }

  // Synthesis engine for notes
  private scheduleSynthNote(
    pitch: string,
    startTime: number,
    duration: number,
    velocity: number,
    params: SynthParams,
    destinationNode: AudioNode
  ) {
    const freq = noteToFreq(pitch);
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = params.waveform;
    osc.frequency.setValueAtTime(freq, startTime);

    // Apply ADSR Envelope
    const gain = gainNode.gain;
    gain.setValueAtTime(0, startTime);
    // Attack
    gain.linearRampToValueAtTime(velocity, startTime + Math.min(params.attack, duration * 0.5));
    // Decay to Sustain
    gain.exponentialRampToValueAtTime(
      velocity * params.sustain,
      startTime + Math.min(params.attack + params.decay, duration * 0.9)
    );
    // Sustain hold duration
    gain.setValueAtTime(velocity * params.sustain, startTime + duration);
    // Release
    gain.exponentialRampToValueAtTime(0.0001, startTime + duration + params.release);

    osc.connect(gainNode);
    gainNode.connect(destinationNode);

    osc.start(startTime);
    osc.stop(startTime + duration + params.release);

    this.activeScheduledNodes.push({
      stop: () => {
        try {
          osc.stop();
          osc.disconnect();
          gainNode.disconnect();
        } catch (_) {}
      },
    });
  }

  // Noise and pitch-swept custom analog oscillators for drums
  private scheduleDrumNote(pitch: string, startTime: number, velocity: number, destination: AudioNode) {
    const now = startTime;

    if (pitch === "KICK") {
      // Swept-sine analog kick drum
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = "sine";
      // Snap pitch from 150Hz down to 45Hz
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gainNode.gain.setValueAtTime(velocity * 0.9, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gainNode);
      gainNode.connect(destination);

      osc.start(now);
      osc.stop(now + 0.2);

      this.activeScheduledNodes.push({
        stop: () => {
          try {
            osc.stop();
            osc.disconnect();
            gainNode.disconnect();
          } catch (_) {}
        },
      });
    } else if (pitch === "SNARE") {
      // Snare drum: highpass and bandpass filtered white noise burst mixed with warm sine body
      try {
        const noise = this.ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(this.ctx);

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(1000, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(destination);

        // Body sine hit
        const bodyOsc = this.ctx.createOscillator();
        const bodyGain = this.ctx.createGain();
        bodyOsc.type = "triangle";
        bodyOsc.frequency.setValueAtTime(180, now);
        bodyOsc.frequency.linearRampToValueAtTime(100, now + 0.08);

        bodyGain.gain.setValueAtTime(velocity * 0.45, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(destination);

        noise.start(now);
        noise.stop(now + 0.2);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.15);

        this.activeScheduledNodes.push({
          stop: () => {
            try {
              noise.stop();
              bodyOsc.stop();
              noise.disconnect();
              noiseFilter.disconnect();
              noiseGain.disconnect();
              bodyOsc.disconnect();
              bodyGain.disconnect();
            } catch (_) {}
          },
        });
      } catch (_) {}
    } else if (pitch === "HIHAT") {
      // Crisp metallic white noise with narrow bandpass around 9000Hz
      try {
        const noise = this.ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(this.ctx);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(8000, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(velocity * 0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(destination);

        noise.start(now);
        noise.stop(now + 0.08);

        this.activeScheduledNodes.push({
          stop: () => {
            try {
              noise.stop();
              noise.disconnect();
              filter.disconnect();
              gainNode.disconnect();
            } catch (_) {}
          },
        });
      } catch (_) {}
    }
  }
}
