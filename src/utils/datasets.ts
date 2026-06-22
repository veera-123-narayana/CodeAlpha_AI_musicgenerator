import { GeneratedMusicArrangement, Note } from "../types";

// Helper to construct a melody note
const note = (pitch: string, time: number, duration: number, velocity = 0.8): Note => ({
  pitch,
  time,
  duration,
  velocity,
});

export const PRESET_DATASETS: Record<string, GeneratedMusicArrangement> = {
  classical: {
    title: "Chamber Prelude in G Major",
    key: "G Major",
    tempo: 100,
    tracks: {
      melody: [
        // Measure 1
        note("B4", 0.0, 0.5), note("D5", 0.5, 0.5), note("G5", 1.0, 1.0),
        note("F#5", 2.0, 0.5), note("G5", 2.5, 0.5), note("A5", 3.0, 1.0),
        // Measure 2
        note("D5", 4.0, 1.0), note("B4", 5.0, 1.0),
        note("C5", 6.0, 0.5), note("D5", 6.5, 0.5), note("A4", 7.0, 1.0),
        // Measure 3
        note("G4", 8.0, 0.5), note("B4", 8.5, 0.5), note("D5", 9.0, 1.0),
        note("C5", 10.0, 0.5), note("B4", 10.5, 0.5), note("A4", 11.0, 1.0),
        // Measure 4
        note("B4", 12.0, 1.5), note("A4", 13.5, 0.5), note("G4", 14.0, 2.0),
        
        // Measure 5
        note("D5", 16.0, 0.5), note("C5", 16.5, 0.5), note("B4", 17.0, 1.0),
        note("E5", 18.0, 0.5), note("D5", 18.5, 0.5), note("C5", 19.0, 1.0),
        // Measure 6
        note("B4", 20.0, 1.0), note("A4", 21.0, 1.0),
        note("G4", 22.0, 2.0),
        // Measure 7
        note("A4", 24.0, 0.5), note("B4", 24.5, 0.5), note("C5", 25.0, 1.0),
        note("B4", 26.0, 0.5), note("C5", 26.5, 0.5), note("D5", 27.0, 1.0),
        // Measure 8
        note("F#4", 28.0, 1.0), note("A4", 29.0, 1.0), note("G4", 30.0, 2.0),
      ],
      harmony: [
        // Chord sequence: G (0-4), D7 (4-8), G (8-12), C - G (12-16)
        note("G3", 0.0, 2.0, 0.6), note("B3", 0.0, 2.0, 0.6), note("D4", 0.0, 2.0, 0.6),
        note("G3", 2.0, 2.0, 0.6), note("B3", 2.0, 2.0, 0.6), note("D4", 2.0, 2.0, 0.6),
        
        note("F#3", 4.0, 2.0, 0.5), note("A3", 4.0, 2.0, 0.5), note("C4", 4.0, 2.0, 0.5),
        note("D3", 6.0, 2.0, 0.5), note("F#3", 6.0, 2.0, 0.5), note("A3", 6.0, 2.0, 0.5),
        
        note("G3", 8.0, 2.0, 0.6), note("B3", 8.0, 2.0, 0.6), note("D4", 8.0, 2.0, 0.6),
        note("G3", 10.0, 2.0, 0.6), note("C3", 10.0, 2.0, 0.6), note("E3", 10.0, 2.0, 0.6),
        
        note("C3", 12.0, 2.0, 0.6), note("E3", 12.0, 2.0, 0.6), note("G3", 12.0, 2.0, 0.6),
        note("G3", 14.0, 2.0, 0.6), note("B3", 14.0, 2.0, 0.6), note("D4", 14.0, 2.0, 0.6),

        // Measure 5-8: G, E minor, C, D, G
        note("G3", 16.0, 4.0, 0.6), note("B3", 16.0, 4.0, 0.6),
        note("E3", 20.0, 4.0, 0.6), note("G3", 20.0, 4.0, 0.6),
        note("C3", 24.0, 2.0, 0.6), note("E3", 24.0, 2.0, 0.6),
        note("D3", 26.0, 2.0, 0.6), note("F#3", 26.0, 2.0, 0.6),
        note("G3", 28.0, 4.0, 0.7), note("B3", 28.0, 4.0, 0.7), note("D4", 28.0, 4.0, 0.7),
      ],
      drums: [
        // Classical uses woodblocks/triangles
        ...Array.from({ length: 16 }).map((_, i) => note("HIHAT", i * 2.0, 0.1, 0.3)),
      ],
    },
  },
  jazz: {
    title: "Vanguard Blue Syncopation",
    key: "F Minor",
    tempo: 120,
    tracks: {
      melody: [
        // Measure 1 - syncopated lead
        note("F4", 0.5, 0.5), note("Ab4", 1.25, 0.5), note("C5", 2.0, 0.75), note("Eb5", 3.0, 1.0),
        // Measure 2
        note("Db5", 4.5, 0.5), note("C5", 5.0, 0.5), note("Bb4", 5.5, 0.5), note("Ab4", 6.0, 1.5),
        // Measure 3
        note("F#4", 8.5, 0.25), note("G4", 8.75, 0.25), note("Bb4", 9.0, 0.5),
        note("C5", 10.0, 0.5), note("E5", 10.5, 0.5), note("F5", 11.0, 1.5),
        // Measure 4
        note("E5", 13.0, 0.5), note("Eb5", 13.5, 0.5), note("D5", 14.0, 0.5), note("Db5", 14.5, 1.0),

        // Measure 5
        note("F4", 16.5, 0.5), note("Ab4", 17.25, 0.5), note("C5", 18.0, 1.0),
        // Measure 6
        note("Db5", 20.5, 0.5), note("C5", 21.0, 0.5), note("Bb4", 21.5, 0.5), note("F4", 22.0, 1.5),
        // Measure 7
        note("Ab4", 24.5, 0.5), note("Bb4", 25.25, 0.5), note("C5", 26.0, 1.0),
        // Measure 8
        note("G4", 28.5, 0.5), note("C5", 29.0, 0.5), note("F4", 29.5, 2.5),
      ],
      harmony: [
        // Jazz Seventh Chords: Fm7, Bbm7, Gm7b5, C7alt
        note("F3", 0.0, 3.5, 0.5), note("Ab3", 0.0, 3.5, 0.5), note("C4", 0.0, 3.5, 0.5), note("Eb4", 0.0, 3.5, 0.5),
        note("Bb3", 4.0, 3.5, 0.5), note("Db4", 4.0, 3.5, 0.5), note("F4", 4.0, 3.5, 0.5), note("Ab4", 4.0, 3.5, 0.5),
        note("G3", 8.0, 3.5, 0.5), note("Bb3", 8.0, 3.5, 0.5), note("Db4", 8.0, 3.5, 0.5), note("F4", 8.0, 3.5, 0.5),
        note("C3", 12.0, 3.5, 0.5), note("E3", 12.0, 3.5, 0.5), note("Bb3", 12.0, 3.5, 0.5), note("Db4", 12.0, 3.5, 0.5),
        // 2nd half
        note("F3", 16.0, 3.5, 0.5), note("Ab3", 16.0, 3.5, 0.5), note("C4", 16.0, 3.5, 0.5), note("Eb4", 16.0, 3.5, 0.5),
        note("Bb3", 20.0, 3.5, 0.5), note("Db4", 20.0, 3.5, 0.5), note("F4", 20.0, 3.5, 0.5), note("Ab4", 20.0, 3.5, 0.5),
        note("Db3", 24.0, 3.5, 0.5), note("F3", 24.0, 3.5, 0.5), note("Ab3", 24.0, 3.5, 0.5), note("C4", 24.0, 3.5, 0.5),
        note("C3", 28.0, 3.5, 0.5), note("E3", 28.0, 3.5, 0.5), note("Bb3", 28.0, 3.5, 0.5), note("Db4", 28.0, 3.5, 0.5),
      ],
      drums: [
        // Kick on Downbeat 0, 4, 8, 12, etc. Snare rimshot on 2,6... Hihat swing beat
        ...Array.from({ length: 8 }).flatMap((_, measure) => {
          const offset = measure * 4;
          return [
            note("KICK", offset + 0.0, 0.25, 0.8),
            note("KICK", offset + 2.5, 0.25, 0.5),
            note("SNARE", offset + 2.0, 0.25, 0.7),
            note("SNARE", offset + 3.75, 0.25, 0.4),
            // Ride Swing pattern: regular 1/4s + interactive 1/8 triplets
            note("HIHAT", offset + 0.0, 0.1, 0.6),
            note("HIHAT", offset + 1.0, 0.1, 0.6),
            note("HIHAT", offset + 1.66, 0.1, 0.4),
            note("HIHAT", offset + 2.0, 0.1, 0.6),
            note("HIHAT", offset + 3.0, 0.1, 0.6),
            note("HIHAT", offset + 3.66, 0.1, 0.4),
          ];
        }),
      ],
    },
  },
  chiptune: {
    title: "Arcade Speedway Hyperdrive",
    key: "A Major",
    tempo: 140,
    tracks: {
      melody: [
        // High rapid 8-bit sequences
        note("A5", 0.0, 0.25), note("C#6", 0.25, 0.25), note("E6", 0.5, 0.25), note("A5", 0.75, 0.25),
        note("F#5", 1.0, 0.25), note("A5", 1.25, 0.25), note("D6", 1.5, 0.25), note("F#5", 1.75, 0.25),
        note("G#5", 2.0, 0.25), note("B5", 2.25, 0.25), note("E6", 2.5, 0.25), note("G#5", 2.75, 0.25),
        note("A5", 3.0, 0.5), note("B5", 3.5, 0.5),
        // Measure 2
        note("C#6", 4.0, 0.25), note("E6", 4.25, 0.25), note("A6", 4.5, 0.25), note("C#6", 4.75, 0.25),
        note("D6", 5.0, 0.25), note("F#6", 5.25, 0.25), note("A6", 5.5, 0.25), note("D6", 5.75, 0.25),
        note("E6", 6.0, 0.5), note("D6", 6.5, 0.5), note("C#6", 7.0, 1.0),

        // Measure 3
        note("F#5", 8.0, 0.25), note("A5", 8.25, 0.25), note("D6", 8.5, 0.25), note("F#5", 8.75, 0.25),
        note("G#5", 9.0, 0.25), note("B5", 9.25, 0.25), note("E6", 9.5, 0.25), note("G#5", 9.75, 0.25),
        note("A5", 10.0, 0.25), note("C#6", 10.25, 0.25), note("E6", 10.5, 0.25), note("A5", 10.75, 0.25),
        note("B5", 11.0, 1.0),

        // Measure 4 (Retro break)
        note("E6", 12.0, 0.25), note("D#6", 12.25, 0.25), note("E6", 12.5, 0.25), note("D#6", 12.75, 0.25),
        note("E6", 13.0, 0.25), note("B5", 13.25, 0.25), note("D6", 13.5, 0.25), note("C6", 13.75, 0.25),
        note("A5", 14.0, 2.0),

        // Measure 5-8 hyper-looping arps
        note("A5", 16.0, 0.25), note("C#6", 16.25, 0.25), note("E6", 16.5, 0.25), note("A5", 16.75, 0.25),
        note("D5", 17.0, 0.25), note("F#5", 17.25, 0.25), note("A5", 17.5, 0.25), note("D5", 17.75, 0.25),
        note("E5", 18.0, 0.25), note("G#5", 18.25, 0.25), note("B5", 18.5, 0.25), note("E5", 18.75, 0.25),
        note("A5", 19.0, 1.0),

        note("C#6", 20.0, 0.25), note("E6", 20.25, 0.25), note("A6", 20.5, 0.25), note("C#6", 20.75, 0.25),
        note("D6", 21.0, 0.25), note("F#6", 21.25, 0.25), note("A6", 21.5, 0.25), note("D6", 21.75, 0.25),
        note("E6", 22.0, 0.5), note("D#6", 22.5, 0.5), note("E6", 23.0, 1.0),

        note("F#5", 24.0, 0.25), note("A5", 24.25, 0.25), note("D6", 24.5, 0.25), note("F#5", 24.75, 0.25),
        note("G#5", 25.0, 0.25), note("B5", 25.25, 0.25), note("E6", 25.5, 0.25), note("G#5", 25.75, 0.25),
        note("A5", 26.0, 0.5), note("B5", 26.5, 0.5), note("C#6", 27.0, 1.0),
        
        note("B5", 28.0, 0.25), note("A5", 28.25, 0.25), note("G#5", 28.5, 0.25), note("F#5", 28.75, 0.25),
        note("E5", 29.0, 0.25), note("D5", 29.25, 0.25), note("C#5", 29.5, 0.25), note("B4", 29.75, 0.25),
        note("A4", 30.0, 2.0),
      ],
      harmony: [
        // Chiptune power bass riffs: A, F#m, D, E
        note("A2", 0.0, 0.5, 0.7), note("A3", 0.5, 0.5, 0.6), note("A2", 1.0, 0.5, 0.7), note("A3", 1.5, 0.5, 0.6),
        note("F#2", 2.0, 0.5, 0.7), note("F#3", 2.5, 0.5, 0.6), note("F#2", 3.0, 0.5, 0.7), note("F#3", 3.5, 0.5, 0.6),
        note("D2", 4.0, 0.5, 0.7), note("D3", 4.5, 0.5, 0.6), note("D2", 5.0, 0.5, 0.7), note("D3", 5.5, 0.5, 0.6),
        note("E2", 6.0, 0.5, 0.7), note("E3", 6.5, 0.5, 0.6), note("E2", 7.0, 1.0, 0.7),
        
        note("A2", 8.0, 0.5, 0.7), note("A3", 8.5, 0.5, 0.6), note("A2", 9.0, 0.5, 0.7), note("A3", 9.5, 0.5, 0.6),
        note("F#2", 10.0, 0.5, 0.7), note("F#3", 10.5, 0.5, 0.6), note("F#2", 11.0, 0.5, 0.7), note("F#3", 11.5, 0.5, 0.6),
        note("D2", 12.0, 0.5, 0.7), note("D3", 12.5, 0.5, 0.6), note("D2", 13.0, 0.5, 0.7), note("D3", 13.5, 0.5, 0.6),
        note("E2", 14.0, 0.5, 0.7), note("E3", 14.5, 0.5, 0.6), note("A2", 15.0, 1.0, 0.7),

        note("A2", 16.0, 0.5, 0.7), note("A3", 16.5, 0.5, 0.6), note("A2", 17.0, 0.5, 0.7), note("A3", 17.5, 0.5, 0.6),
        note("F#2", 18.0, 0.5, 0.7), note("F#3", 18.5, 0.5, 0.6), note("F#2", 19.0, 0.5, 0.7), note("F#3", 19.5, 0.5, 0.6),
        note("D2", 20.0, 0.5, 0.7), note("D3", 20.5, 0.5, 0.6), note("D2", 21.0, 0.5, 0.7), note("D3", 21.5, 0.5, 0.6),
        note("E2", 22.0, 0.5, 0.7), note("E3", 22.5, 0.5, 0.6), note("E2", 23.0, 1.0, 0.7),

        note("F#2", 24.0, 0.5, 0.7), note("F#3", 24.5, 0.5, 0.6), note("D2", 25.0, 0.5, 0.7), note("D3", 25.5, 0.5, 0.6),
        note("A2", 26.0, 0.5, 0.7), note("A3", 26.5, 0.5, 0.6), note("E2", 27.0, 0.5, 0.7), note("E3", 27.5, 0.5, 0.6),
        note("A2", 28.0, 2.0, 0.7),
      ],
      drums: [
        // Punchy 8bit beats: continuous 4x4 Kick, noisy Snare on 1, 3, 5, 7..., fast Hat
        ...Array.from({ length: 8 }).flatMap((_, measure) => {
          const offset = measure * 4;
          return [
            note("KICK", offset + 0.0, 0.25, 0.9),
            note("KICK", offset + 1.0, 0.25, 0.9),
            note("KICK", offset + 2.0, 0.25, 0.9),
            note("KICK", offset + 3.0, 0.25, 0.9),
            note("SNARE", offset + 1.0, 0.25, 0.8),
            note("SNARE", offset + 3.0, 0.25, 0.8),
            note("HIHAT", offset + 0.0, 0.1, 0.5),
            note("HIHAT", offset + 0.5, 0.1, 0.5),
            note("HIHAT", offset + 1.0, 0.1, 0.5),
            note("HIHAT", offset + 1.5, 0.1, 0.5),
            note("HIHAT", offset + 2.0, 0.1, 0.5),
            note("HIHAT", offset + 2.5, 0.1, 0.5),
            note("HIHAT", offset + 3.0, 0.1, 0.5),
            note("HIHAT", offset + 3.5, 0.1, 0.5),
          ];
        }),
      ],
    },
  },
};
