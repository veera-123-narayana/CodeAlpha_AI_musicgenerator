export interface Note {
  pitch: string; // Standard name like "C4", "D#5", or "KICK", "SNARE", "HIHAT"
  time: number; // in beats relative to sequence start (0.0 offset)
  duration: number; // in beats (e.g. 1.0 = quarter note)
  velocity: number; // 0.0 to 1.0
}

export interface TrackData {
  melody: Note[];
  harmony: Note[];
  drums: Note[];
}

export interface GeneratedMusicArrangement {
  title: string;
  key: string;
  tempo: number;
  tracks: TrackData;
}

export type GenrePreset = "classical" | "jazz" | "chiptune" | "cyberpunk" | "lofi";

export interface NetworkConfig {
  cellType: "LSTM" | "GRU" | "RNN" | "Transformer";
  layersCount: number; // 1 to 4
  hiddenUnits: number; // 64, 128, 256, 512
  optimizer: "Adam" | "RMSprop" | "SGD";
  learningRate: number; // 0.0001 to 0.05
  dropout: number; // 0.0 to 0.8
  lookbackSteps: number; // 8, 16, 32, 64
}

export interface PreprocessedDataStats {
  totalNotes: number;
  pitchClasses: { [key: string]: number };
  durationDistribution: { [key: number]: number };
  averageVelocity: number;
  vocabularySize: number;
}
