import { TrackData, Note } from "../types";

// Helper to convert note pitch text into standard MIDI number representations
export function noteToMidiNumber(pitch: string): number {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const parsed = pitch.match(/^([A-G]#?)(-?\d+)$/);
  if (!parsed) {
    if (pitch === "KICK") return 36; // General MIDI Bass drum 1
    if (pitch === "SNARE") return 40; // Electric snare 
    if (pitch === "HIHAT") return 42; // Closed hihat
    return 60; // Default C4
  }
  const name = parsed[1];
  const octave = parseInt(parsed[2], 10);
  const semitones = notes.indexOf(name) + (octave + 1) * 12;
  return Math.min(127, Math.max(0, semitones));
}

// Write Variable-length Quantity for MIDI delta times
function toVariableLength(value: number): number[] {
  let val = Math.round(value);
  if (val < 0) val = 0;
  const buffer: number[] = [];
  buffer.push(val & 0x7f);
  while (val > 0x7f) {
    val = val >> 7;
    buffer.push((val & 0x7f) | 0x80);
  }
  return buffer.reverse();
}

// Convert track data to actual MIDI standard multitrack Blob
export function generateMidiFile(tracks: TrackData, tempoBPM: number): Blob {
  const ticksPerBeat = 120; // Time division

  // Helper to construct a single track payload
  const createSubTrack = (notes: Note[], isDrum = false): number[] => {
    interface AbsoluteEvent {
      absoluteTick: number;
      type: "on" | "off";
      midiPitch: number;
      velocity: number;
    }

    const events: AbsoluteEvent[] = [];
    notes.forEach((note) => {
      const startTick = Math.round(note.time * ticksPerBeat);
      const endTick = Math.round((note.time + note.duration) * ticksPerBeat);
      const mPitch = noteToMidiNumber(note.pitch);
      const vel = Math.round((note.velocity || 0.8) * 127);

      events.push({ absoluteTick: startTick, type: "on", midiPitch: mPitch, velocity: vel });
      events.push({ absoluteTick: endTick, type: "off", midiPitch: mPitch, velocity: 0 });
    });

    // Sort events strictly by absolute ticking times
    events.sort((a, b) => {
      if (a.absoluteTick !== b.absoluteTick) {
        return a.absoluteTick - b.absoluteTick;
      }
      return a.type === "off" ? -1 : 1; // Prioritize note-offs over note-ons at the same tick
    });

    const trackBytes: number[] = [];
    let lastTick = 0;

    events.forEach((ev) => {
      const delta = ev.absoluteTick - lastTick;
      lastTick = ev.absoluteTick;

      trackBytes.push(...toVariableLength(delta));

      const channel = isDrum ? 9 : 0; // MIDI Channel 10 for drums (9 in 0-indexed), Channel 1 for synths (0)
      if (ev.type === "on") {
        trackBytes.push(0x90 | channel); // note on
        trackBytes.push(ev.midiPitch);
        trackBytes.push(ev.velocity);
      } else {
        trackBytes.push(0x80 | channel); // note off
        trackBytes.push(ev.midiPitch);
        trackBytes.push(0x00); // zero velocity
      }
    });

    // Add End of Track metadata event: [Delta=0, FF 2F 00]
    trackBytes.push(0x00, 0xff, 0x2f, 0x00);
    return trackBytes;
  };

  // 1. MIDI Header Chunk
  // MThd (4 bytes) + block length (0x00000006) + format 1 multi-track (0x0001) + tracks count (4) + time division ticksPerBeat
  const countsOfTracks = 4; // Conductor tempo track + Melody + Harmony + Drums
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // chunk length
    0x00, 0x01,             // multi-track format
    0x00, CountsOfTracks(countsOfTracks), // number of tracks (4)
    0x00, ticksPerBeat,     // division ticks per beat
  ];

  // 2. Conductor Track (Track 0) - Contains Tempo Event
  const microsecondsPerBeat = Math.round(60000000 / tempoBPM);
  const conductorBytes = [
    0x00, 0xff, 0x51, 0x03, // Delta=0, Meta event, Tempo type, 3 bytes len
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff,
    0x00, 0xff, 0x2f, 0x00 // Delta=0, End of track
  ];

  const tracksPayloads = [
    conductorBytes,
    createSubTrack(tracks.melody, false),
    createSubTrack(tracks.harmony, false),
    createSubTrack(tracks.drums, true),
  ];

  // Assemble full byte buffer
  const outBytes: number[] = [...header];

  tracksPayloads.forEach((payload) => {
    const len = payload.length;
    outBytes.push(0x4d, 0x54, 0x72, 0x6b); // "MTrk"
    outBytes.push((len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff);
    outBytes.push(...payload);
  });

  return new Blob([new Uint8Array(outBytes)], { type: "audio/midi" });
}

function CountsOfTracks(cnt: number): number {
  return cnt;
}
