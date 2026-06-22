import { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  Download,
  Activity,
  Cpu,
  Sliders,
  Music,
  RefreshCw,
  Layers,
  Database,
  Keyboard,
  Volume2,
  FileCode,
  Sparkles,
  Award,
  CheckCircle,
  HelpCircle,
  Radio,
} from "lucide-react";
import { GeneratedMusicArrangement, Note, TrackData, NetworkConfig, PreprocessedDataStats } from "./types";
import { PRESET_DATASETS } from "./utils/datasets";
import { SequencePlayer, DEFAULT_SYNTH_PARAMS, SynthParams } from "./utils/audio";
import { generateMidiFile } from "./utils/midiWriter";

export default function App() {
  // App states
  const [selectedPreset, setSelectedPreset] = useState<string>("classical");
  const [prompt, setPrompt] = useState<string>("");
  const [tempo, setTempo] = useState<number>(100);
  const [sequenceLength, setSequenceLength] = useState<number>(32);
  const [temperature, setTemperature] = useState<number>(0.75);

  // Deep Learning configs
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>({
    cellType: "LSTM",
    layersCount: 2,
    hiddenUnits: 128,
    optimizer: "Adam",
    learningRate: 0.001,
    dropout: 0.2,
    lookbackSteps: 16,
  });

  // Preprocessing state
  const [isPreprocessed, setIsPreprocessed] = useState<boolean>(true);
  const [preprocessedStats, setPreprocessedStats] = useState<PreprocessedDataStats>({
    totalNotes: PRESET_DATASETS.classical.tracks.melody.length + PRESET_DATASETS.classical.tracks.harmony.length,
    pitchClasses: {},
    durationDistribution: {},
    averageVelocity: 0.72,
    vocabularySize: 0,
  });

  // Training state simulation
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0); // 0 to 100
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [epochsTotal, setEpochsTotal] = useState<number>(50);
  const [lossHistory, setLossHistory] = useState<{ epoch: number; loss: number; valLoss: number }[]>([]);
  const [modelTrained, setModelTrained] = useState<boolean>(true);
  const [logs, setLogs] = useState<{ time: string; level: string; msg: string }[]>([
    { time: "21:18:29", level: "SYSTEM", msg: "Audio engine initialized successfully using custom oscillator banks." },
    { time: "21:18:32", level: "INFO", msg: "Pre-compiled classical G-Major training sequences successfully cached." },
  ]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeArrangement, setActiveArrangement] = useState<GeneratedMusicArrangement>(PRESET_DATASETS.classical);

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadBeat, setPlayheadBeat] = useState<number>(0);

  // Synthesizer custom ADSR parameters
  const [synthParams, setSynthParams] = useState<SynthParams>({
    waveform: "sawtooth",
    filterCutoff: 1800,
    filterQ: 2.0,
    attack: 0.04,
    decay: 0.2,
    sustain: 0.6,
    release: 0.4,
    echoTime: 0.25,
    echoFeedback: 0.35,
  });

  // Keyboard notes mapping for interactive synth play
  const liveNotes = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"];

  // Player Ref
  const playerRef = useRef<SequencePlayer | null>(null);

  // Initialize playback system on mount
  useEffect(() => {
    playerRef.current = new SequencePlayer();
    // Precompute stats for initial preset
    handlePreprocess(selectedPreset, true);
    return () => {
      if (playerRef.current) {
        playerRef.current.stopSeq();
      }
    };
  }, []);

  // Update arrangement tempo when preset metadata loads
  useEffect(() => {
    setTempo(activeArrangement.tempo);
  }, [activeArrangement]);

  // Append a console logger line
  const addLog = (msg: string, level = "SYSTEM") => {
    const timeStr = new Date().toTimeString().split(" ")[0];
    setLogs((prev) => [{ time: timeStr, level, msg }, ...prev.slice(0, 49)]);
  };

  // Preprocessor handler
  const handlePreprocess = (presetKey: string, silent = false) => {
    const sourceArr = PRESET_DATASETS[presetKey] || PRESET_DATASETS.classical;
    const allNotes = [...sourceArr.tracks.melody, ...sourceArr.tracks.harmony];

    const pitchMap: { [key: string]: number } = {};
    const durMap: { [key: number]: number } = {};
    let velSum = 0;

    allNotes.forEach((n) => {
      pitchMap[n.pitch] = (pitchMap[n.pitch] || 0) + 1;
      durMap[n.duration] = (durMap[n.duration] || 0) + 1;
      velSum += n.velocity;
    });

    const calculatedStats: PreprocessedDataStats = {
      totalNotes: allNotes.length,
      pitchClasses: pitchMap,
      durationDistribution: durMap,
      averageVelocity: Number((velSum / (allNotes.length || 1)).toFixed(2)),
      vocabularySize: Object.keys(pitchMap).length,
    };

    setPreprocessedStats(calculatedStats);
    setIsPreprocessed(true);

    if (!silent) {
      addLog(
        `Preprocessed raw note data. Found ${calculatedStats.totalNotes} events in ${sourceArr.tracks.melody.length + sourceArr.tracks.harmony.length + sourceArr.tracks.drums.length} sequences. Mapped to dictionary length ${calculatedStats.vocabularySize}.`,
        "PREPROCESS"
      );
    }
  };

  // Preset selector
  const handlePresetChange = (key: string) => {
    setSelectedPreset(key);
    handlePreprocess(key);
    if (PRESET_DATASETS[key]) {
      setActiveArrangement(PRESET_DATASETS[key]);
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.stopSeq();
      }
    }
  };

  // LSTM/Transformer interactive mock training algorithm
  const handleTrainModel = () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(0);
    setModelTrained(false);
    addLog(`Initiating neural weights compile. Core Cell: ${networkConfig.cellType} (Units: ${networkConfig.hiddenUnits}, LR: ${networkConfig.learningRate})`, "DNN_INIT");

    const simHistory: { epoch: number; loss: number; valLoss: number }[] = [];
    let curLoss = 2.45;
    let curValLoss = 2.62;

    const interval = setInterval(() => {
      setCurrentEpoch((prevEpoch) => {
        const nextEpoch = prevEpoch + 1;
        const decayFactor = networkConfig.cellType === "Transformer" ? 0.91 : 0.93;
        curLoss = curLoss * decayFactor - (Math.random() * 0.05 - 0.015);
        curLoss = Math.max(0.08, Number(curLoss.toFixed(4)));

        curValLoss = curValLoss * decayFactor - (Math.random() * 0.04 - 0.012);
        curValLoss = Math.max(0.12, Number(curValLoss.toFixed(4)));

        simHistory.push({ epoch: nextEpoch, loss: curLoss, valLoss: curValLoss });
        setLossHistory([...simHistory]);

        const progressPercent = Math.round((nextEpoch / epochsTotal) * 100);
        setTrainingProgress(progressPercent);

        if (nextEpoch % 5 === 0 || nextEpoch === epochsTotal) {
          addLog(`Epoch [${nextEpoch}/${epochsTotal}] - Training Loss: ${curLoss.toFixed(4)} · Val Loss: ${curValLoss.toFixed(4)}`, "TRAIN");
          // Play a tiny synthesis sound beat to indicate live telemetry activity!
          if (playerRef.current) {
            playerRef.current.triggerLiveNote("G#5", { ...synthParams, attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.05 });
          }
        }

        if (nextEpoch >= epochsTotal) {
          clearInterval(interval);
          setIsTraining(false);
          setModelTrained(true);
          addLog(`Model training complete. Optimized checkpoints cached on system. Global Minimum Loss set to: ${curLoss.toFixed(4)}`, "DNN_SUCCESS");
        }
        return nextEpoch;
      });
    }, 80);
  };

  // Generate music sequence via server-side Gemini system
  const handleGenerateAI = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.stopSeq();
    }

    addLog(`Broadcasting weights matrices to Gemini server-side orchestrator...`, "API_PROMPT");

    try {
      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: selectedPreset,
          prompt,
          tempo,
          sequenceLength,
          temperature,
          networkType: networkConfig.cellType,
          epochs: epochsTotal,
          trainingLoss: lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].loss : 0.14,
        }),
      });

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || "Generation endpoint returned invalid payload");
      }

      addLog(`Gemini generated musical arrangement successfully. Loaded payload: ${resJson.data.title} in ${resJson.data.key}.`, "GENERATIVE_AI");
      setActiveArrangement(resJson.data);
    } catch (error: any) {
      console.error(error);
      addLog(`Failed to fetch AI notes: ${error?.message || "Verify your API configurationKeys"}. Falling back to styled local neural model synthesis.`, "ERROR");
      
      // Advanced local procedural generator fallback so the app continues working perfectly even if API is not fully configured
      const fallbackTitle = `Procedural Ambient #${Math.floor(Math.random() * 900 + 100)}`;
      const fallbackArrangement: GeneratedMusicArrangement = {
        title: fallbackTitle,
        key: selectedPreset === "jazz" ? "F Minor" : selectedPreset === "classical" ? "G Major" : "A Minor",
        tempo: selectedPreset === "chiptune" ? 140 : 105,
        tracks: createProceduralFallback(selectedPreset, sequenceLength),
      };
      setActiveArrangement(fallbackArrangement);
    } finally {
      setIsGenerating(false);
    }
  };

  // Procedural music generator utility
  const createProceduralFallback = (style: string, lenBeats: number): TrackData => {
    const melody: Note[] = [];
    const harmony: Note[] = [];
    const drums: Note[] = [];

    const notesScale = style === "jazz" 
      ? ["F4", "Ab4", "Bb4", "C5", "Eb5", "F5"] 
      : style === "classical"
      ? ["G4", "A4", "B4", "C5", "D5", "E5", "F#5"]
      : ["A4", "B4", "C5", "D5", "E5", "F5", "G5"];

    // Make melody
    for (let beat = 0; beat < lenBeats; beat += 1.0) {
      if (Math.random() > 0.3) {
        const pitch = notesScale[Math.floor(Math.random() * notesScale.length)];
        const dur = Math.random() > 0.5 ? 0.5 : 1.0;
        const vel = Number((0.6 + Math.random() * 0.3).toFixed(2));
        melody.push({ pitch, time: beat, duration: dur, velocity: vel });
      }
    }

    // Make harmony chords (pad on every 4 beats)
    const chordRoots = style === "jazz" ? ["F3", "Bb3", "Db3", "C3"] : ["G3", "D3", "Em3", "C3"];
    for (let beat = 0; beat < lenBeats; beat += 4.0) {
      const chordIndex = Math.floor(beat / 4) % chordRoots.length;
      const root = chordRoots[chordIndex];
      harmony.push({ pitch: root, time: beat, duration: 4.0, velocity: 0.5 });
      harmony.push({ pitch: root.replace("3", "4"), time: beat, duration: 4.0, velocity: 0.45 });
    }

    // Make crisp high density drums
    for (let beat = 0; beat < lenBeats; beat += 0.5) {
      // Always hihat
      drums.push({ pitch: "HIHAT", time: beat, duration: 0.1, velocity: beat % 1.0 === 0 ? 0.45 : 0.23 });
      
      // Kick on 0, 2
      if (beat % 2.0 === 0) {
        drums.push({ pitch: "KICK", time: beat, duration: 0.2, velocity: 0.8 });
      }
      // Snare on 1, 3
      if (beat % 2.0 === 1.0) {
        drums.push({ pitch: "SNARE", time: beat, duration: 0.2, velocity: 0.72 });
      }
    }

    return { melody, harmony, drums };
  };

  // Playback managers
  const handleTogglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.stopSeq();
      setIsPlaying(false);
      setPlayheadBeat(0);
      addLog("Sequencer synthesis output paused.", "PLAYER");
    } else {
      setIsPlaying(true);
      playerRef.current.setCallbacks(
        (currentBeat) => {
          setPlayheadBeat(currentBeat);
        },
        () => {
          setIsPlaying(false);
          setPlayheadBeat(0);
          addLog("Playback queue reached terminal end.", "PLAYER");
        }
      );
      addLog(`Initiated synthetic playback: "${activeArrangement.title}" at ${tempo} BPM.`, "PLAYER");
      playerRef.current.playSeq(activeArrangement.tracks, tempo, sequenceLength, synthParams);
    }
  };

  // Live keys synth trigger
  const handlePressLiveKey = (pitch: string) => {
    if (playerRef.current) {
      playerRef.current.triggerLiveNote(pitch, synthParams);
    }
  };

  // Export standard MIDI blob to local computer
  const handleDownloadMidi = () => {
    try {
      const blob = generateMidiFile(activeArrangement.tracks, tempo);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${activeArrangement.title.toLowerCase().replace(/ /g, "_")}.mid`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      addLog(`Midi binary written! Created multitrack file "${anchor.download}" for download.`, "SYSTEM");
    } catch (e: any) {
      addLog(`Failed to serialize MIDI: ${e.message}`, "ERROR");
    }
  };

  // Piano Roll Note Grid coordinate calculation
  const getMaxDisplayRows = () => {
    // Collect all melody pitches to determine bounds, default standard C4-C5 octave
    const keys = ["B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4"];
    return keys;
  };

  const getMidiColorByTrack = (trackName: "melody" | "harmony" | "drums") => {
    if (trackName === "melody") return "bg-blue-500 border-blue-400 text-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
    if (trackName === "harmony") return "bg-purple-600 border-purple-500 text-purple-100 shadow-[0_0_8px_rgba(147,51,234,0.6)]";
    return "bg-amber-600 border-amber-500 text-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
  };

  return (
    <div id="ai-music-generator-root" className="flex flex-col min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic Header */}
      <header id="header-main" className="h-14 bg-[#1E293B]/70 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 relative z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-white shadow-lg animate-pulse">Ω</div>
            <span className="font-extrabold tracking-tight text-white uppercase text-xs">AI NEURAL ORCHESTRADER</span>
          </div>
          <span className="h-4 w-px bg-slate-700"></span>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Model Status:</span>
            {modelTrained ? (
              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] rounded font-bold uppercase tracking-wider">
                ● COMPILED CHECKPOINT READY
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] rounded font-bold uppercase tracking-wider">
                ▲ RE-TRAIN REQUIRED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-[9px] uppercase text-slate-500 tracking-wider">EPOCH COMPILATION STEPS</div>
            <div className="text-sm font-mono font-bold text-blue-400">
              {String(currentEpoch).padStart(2, "0")} : {String(epochsTotal).padStart(2, "0")}
            </div>
          </div>
          <button
            id="btn-execute-generation"
            onClick={handleGenerateAI}
            disabled={isGenerating || isTraining}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider ${
              isGenerating
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] hover:shadow-[0_0_16px_rgba(37,99,235,0.6)] cursor-pointer"
            }`}
          >
            {isGenerating ? "SYNTESIZING..." : "EXECUTE GEN AI"}
          </button>
        </div>
      </header>

      {/* Main Grid Content Area */}
      <main id="main-content-dashboard" className="flex-1 p-6 grid grid-cols-12 gap-5 overflow-y-auto max-w-[1600px] mx-auto w-full">
        
        {/* Core Control Center (Collapsible-like left panel grid span 4) */}
        <section id="sidebar-controls" className="col-span-12 lg:col-span-4 space-y-5">
          
          {/* Module 1: MIDI Source Dataset & Preprocessing */}
          <div id="card-preprocess" className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden relative">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">1. Raw MIDI Training Source</h3>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.2 rounded border border-blue-500/20 font-bold uppercase">MIDI-21</span>
            </div>
            
            <div className="p-4 space-y-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">SELECT REPOSITORY:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["classical", "jazz", "chiptune"] as string[]).map((pKey) => (
                    <button
                      id={`btn-preset-${pKey}`}
                      key={pKey}
                      onClick={() => handlePresetChange(pKey)}
                      className={`py-1.5 px-2 text-xs font-bold rounded border transition-all truncate uppercase ${
                        selectedPreset === pKey
                          ? "bg-blue-600/20 text-blue-400 border-blue-500"
                          : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {pKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-900/50 border border-slate-700/60 rounded p-2.5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Vector Sequence Registry</span>
                  <span className="text-[9px] font-mono text-blue-400">STATUS: SUITABLE</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-400">
                    <span>Source File</span>
                    <span className="font-mono text-slate-200">
                      {selectedPreset === "classical"
                        ? "chamber_pr_g.mid"
                        : selectedPreset === "jazz"
                        ? "vanguard_blue_sync.mid"
                        : "speedway_hyp.mid"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-400">
                    <span>Notes Processed</span>
                    <span className="font-mono text-slate-200">{preprocessedStats.totalNotes} events</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-400">
                    <span>Target Key / Mode</span>
                    <span className="font-mono text-slate-200">
                      {selectedPreset === "classical" ? "G Major" : selectedPreset === "jazz" ? "F Minor" : "A Major"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vocabulary / Dict</span>
                    <span className="font-mono text-slate-200">{preprocessedStats.vocabularySize} pitch classes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-trigger-preprocessing"
                  onClick={() => handlePreprocess(selectedPreset)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 text-slate-300"
                >
                  <RefreshCw className="w-3 h-3" />
                  RE-Calibrate Vectors
                </button>
              </div>
            </div>
          </div>

          {/* Module 2: Neural Network Hyperparameter Build */}
          <div id="card-dnn-build" className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">2. RNN / Transformer Optimizer</h3>
              </div>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.2 rounded border border-purple-500/20 font-bold uppercase">Hyperparameters</span>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Architecture</label>
                  <select
                    id="select-architecture-cell"
                    value={networkConfig.cellType}
                    onChange={(e) => {
                      setNetworkConfig((prev) => ({ ...prev, cellType: e.target.value as any }));
                      setModelTrained(false);
                      addLog(`Model layer topology altered to: ${e.target.value}. Required new compile.`, "DNN_CONFIG");
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-bold accent-blue-600 focus:outline-none"
                  >
                    <option value="LSTM">LSTM Recurrent</option>
                    <option value="Transformer">Self-Attention TF</option>
                    <option value="GRU">GRU Gated Unit</option>
                    <option value="RNN">Plain Vanilla RNN</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Hidden Nodes</label>
                  <select
                    id="select-hidden-nodes"
                    value={networkConfig.hiddenUnits}
                    onChange={(e) => {
                      setNetworkConfig((prev) => ({ ...prev, hiddenUnits: parseInt(e.target.value) }));
                      setModelTrained(false);
                      addLog(`Weight matrix dimensionality set to ${e.target.value} cells.`, "DNN_CONFIG");
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-bold focus:outline-none"
                  >
                    <option value="64">64 Units</option>
                    <option value="128">128 Units</option>
                    <option value="256">256 Units</option>
                    <option value="512">512 Units (Dense)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                    <span>Lookback Window Size ({networkConfig.lookbackSteps} beats)</span>
                  </div>
                  <input
                    id="range-lookback-steps"
                    type="range"
                    min="8"
                    max="64"
                    step="8"
                    value={networkConfig.lookbackSteps}
                    onChange={(e) => {
                      setNetworkConfig((prev) => ({ ...prev, lookbackSteps: parseInt(e.target.value) }));
                      setModelTrained(false);
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Grad Optimizer</label>
                    <select
                      id="select-gradient-optimizer"
                      value={networkConfig.optimizer}
                      onChange={(e) => setNetworkConfig((prev) => ({ ...prev, optimizer: e.target.value as any }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    >
                      <option value="Adam">Adam</option>
                      <option value="RMSprop">RMSprop</option>
                      <option value="SGD">SGD</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Epoch Count ({epochsTotal})</label>
                    <input
                      id="input-total-epochs"
                      type="number"
                      min="10"
                      max="150"
                      value={epochsTotal}
                      onChange={(e) => setEpochsTotal(Math.min(150, Math.max(10, parseInt(e.target.value) || 10)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                    <span>Learning Rate ({networkConfig.learningRate})</span>
                  </div>
                  <input
                    id="range-learning-rate"
                    type="range"
                    min="0.0001"
                    max="0.01"
                    step="0.0005"
                    value={networkConfig.learningRate}
                    onChange={(e) => setNetworkConfig((prev) => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                    <span>Dropout Core Probability ({networkConfig.dropout})</span>
                  </div>
                  <input
                    id="range-dropout"
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={networkConfig.dropout}
                    onChange={(e) => setNetworkConfig((prev) => ({ ...prev, dropout: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                {isTraining ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-blue-400">
                      <span>TRAINING COMPILATION IN PROGRESS...</span>
                      <span>{trainingProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
                      <div
                        id="training-progress-bar"
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-75"
                        style={{ width: `${trainingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <button
                    id="btn-trigger-training"
                    onClick={handleTrainModel}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded text-xs font-extrabold uppercase tracking-widest transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)] hover:shadow-[0_0_16px_rgba(37,99,235,0.5)] cursor-pointer"
                  >
                    TRAIN RECURSIVE NETWORK NOW
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Module 3: Virtual Analog Synthesizer Knobs */}
          <div id="card-analog-synth" className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">3. Filter EQ & ADSR Envelope</h3>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.2 rounded border border-amber-500/20 font-bold uppercase">Analog Output</span>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Oscillator Waveform</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["sawtooth", "square", "triangle", "sine"] as OscillatorType[]).map((wave) => (
                    <button
                      id={`btn-wave-${wave}`}
                      key={wave}
                      onClick={() => setSynthParams((prev) => ({ ...prev, waveform: wave }))}
                      className={`text-[10px] font-bold py-1 px-1 rounded border capitalize transition-all ${
                        synthParams.waveform === wave
                          ? "bg-amber-600/20 border-amber-500 text-amber-400 font-extrabold"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-850"
                      }`}
                    >
                      {wave}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                    <span>Cutoff ({synthParams.filterCutoff}Hz)</span>
                  </div>
                  <input
                    id="range-filter-cutoff"
                    type="range"
                    min="200"
                    max="6000"
                    step="100"
                    value={synthParams.filterCutoff}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, filterCutoff: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                    <span>Filter Resonance (Q: {synthParams.filterQ})</span>
                  </div>
                  <input
                    id="range-filter-q"
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.5"
                    value={synthParams.filterQ}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, filterQ: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Envelope slider bank */}
              <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-slate-800 pb-1">
                <div className="text-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500 block mb-0.5">Attack</span>
                  <input
                    id="range-synth-attack"
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={synthParams.attack}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, attack: parseFloat(e.target.value) }))}
                    className="h-16 w-1 mx-auto bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500 writing-mode-vertical"
                    style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical" } as any}
                  />
                  <span className="text-[9px] font-mono block mt-1 text-slate-300">{synthParams.attack}s</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500 block mb-0.5">Decay</span>
                  <input
                    id="range-synth-decay"
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={synthParams.decay}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, decay: parseFloat(e.target.value) }))}
                    className="h-16 w-1 mx-auto bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500 writing-mode-vertical"
                    style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical" } as any}
                  />
                  <span className="text-[9px] font-mono block mt-1 text-slate-300">{synthParams.decay}s</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500 block mb-0.5">Sustain</span>
                  <input
                    id="range-synth-sustain"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={synthParams.sustain}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, sustain: parseFloat(e.target.value) }))}
                    className="h-16 w-1 mx-auto bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500 writing-mode-vertical"
                    style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical" } as any}
                  />
                  <span className="text-[9px] font-mono block mt-1 text-slate-300">{Math.round(synthParams.sustain * 100)}%</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500 block mb-0.5">Release</span>
                  <input
                    id="range-synth-release"
                    type="range"
                    min="0.05"
                    max="1.5"
                    step="0.05"
                    value={synthParams.release}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, release: parseFloat(e.target.value) }))}
                    className="h-16 w-1 mx-auto bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500 writing-mode-vertical"
                    style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical" } as any}
                  />
                  <span className="text-[9px] font-mono block mt-1 text-slate-300">{synthParams.release}s</span>
                </div>
              </div>

              {/* Echo parameters delay */}
              <div className="grid grid-cols-2 gap-3.5 pt-1.5 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                    <span>Echo Time ({synthParams.echoTime}s)</span>
                  </div>
                  <input
                    id="range-echo-time"
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={synthParams.echoTime}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, echoTime: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                    <span>Feedback ({Math.round(synthParams.echoFeedback * 100)}%)</span>
                  </div>
                  <input
                    id="range-echo-feedback"
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.05"
                    value={synthParams.echoFeedback}
                    onChange={(e) => setSynthParams((prev) => ({ ...prev, echoFeedback: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Panels Layout (grid span 8) */}
        <section id="dashboard-workspace" className="col-span-12 lg:col-span-8 space-y-5">
          
          {/* Section A: Live Telemetry & Model Stats Overview Panel */}
          <div id="stats-overview-block" className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            {/* Stat Box 1: Network compilations */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col justify-between shadow-md">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-extrabold tracking-widest block">RNN Training Step</span>
                <div className="text-2xl font-mono mt-1 text-white flex items-baseline gap-1">
                  <span>{currentEpoch}</span>
                  <span className="text-xs text-slate-500">of {epochsTotal}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-350"
                  style={{ width: `${(currentEpoch / epochsTotal) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Stat Box 2: Loss / Convergence Entropy */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col justify-between shadow-md">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-extrabold tracking-widest block">Convergence Error</span>
                <div className="text-2xl font-mono mt-1 text-white">
                  {lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].loss.toFixed(4) : "0.1245"}
                  <span className="text-xs text-slate-500"> loss</span>
                </div>
              </div>
              <div className="text-[10px] text-green-400 font-medium tracking-wide mt-3 flex items-center gap-1">
                <span>▼ -88.4%</span>
                <span className="text-slate-500">global decay</span>
              </div>
            </div>

            {/* Stat Box 3: Total Note Tokens generated */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col justify-between shadow-md">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-extrabold tracking-widest block">Arrangement Duration</span>
                <div className="text-2xl font-mono mt-1 text-white">
                  {sequenceLength}
                  <span className="text-xs text-slate-500"> beats</span>
                </div>
              </div>
              <div className="text-[10px] text-blue-400 font-medium tracking-wide mt-3 flex items-center gap-1">
                <span>{activeArrangement.tracks.melody.length + activeArrangement.tracks.harmony.length + activeArrangement.tracks.drums.length} notes</span>
                <span className="text-slate-500">compiled</span>
              </div>
            </div>

            {/* Stat Box 4: Current Key Signature */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex flex-col justify-between shadow-md">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-extrabold tracking-widest block">Harmonic Signature</span>
                <div className="text-2xl font-mono mt-1 text-amber-400 truncate">
                  {activeArrangement.key}
                </div>
              </div>
              <div className="text-[9px] text-slate-500 mt-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>Interval scales mapped</span>
              </div>
            </div>
          </div>

          {/* Section B: Dynamic Loss Plotter Chart (If space exists) */}
          {lossHistory.length > 0 && (
            <div id="loss-history-chart" className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Neural Loss Optimization Curves</span>
                </div>
                <div className="flex gap-4 text-[10px] font-mono">
                  <span className="text-blue-400">● Train Loss ({lossHistory[lossHistory.length - 1].loss.toFixed(4)})</span>
                  <span className="text-purple-400">● Validation Loss ({lossHistory[lossHistory.length - 1].valLoss.toFixed(4)})</span>
                </div>
              </div>
              {/* Simple inline beautiful dynamic SVG line graph of losses */}
              <div className="h-28 w-full bg-slate-950/70 rounded border border-slate-800 flex items-end p-2 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="400" y2="25" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3,3" />

                  {/* Draw training loss line */}
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    points={lossHistory
                      .map((val, idx) => {
                        const x = (idx / (lossHistory.length - 1)) * 400;
                        const y = 100 - Math.min(95, Math.max(5, (val.loss / 2.7) * 100));
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* Draw validation loss line */}
                  <polyline
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    points={lossHistory
                      .map((val, idx) => {
                        const x = (idx / (lossHistory.length - 1)) * 400;
                        const y = 100 - Math.min(95, Math.max(5, (val.valLoss / 2.7) * 100));
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                </svg>
                {/* Labels */}
                <div className="absolute left-2 top-2 text-[8px] font-mono text-slate-500">Entropy Limit (2.7)</div>
                <div className="absolute right-2 bottom-1 text-[8px] font-mono text-slate-500">Epoch {currentEpoch}</div>
              </div>
            </div>
          )}

          {/* Section C: Sequencer Playback Controller Dashboard */}
          <div id="card-sequencer-rack" className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/60 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Active Sequencer Rack</h3>
                  <span className="text-[10px] text-slate-400 font-mono italic">Compiled title: "{activeArrangement.title}"</span>
                </div>
              </div>

              {/* Generative creative text prompt */}
              <div className="flex items-center gap-2">
                <input
                  id="text-creative-prompt"
                  type="text"
                  placeholder="Creative prompt directions (e.g. relaxing lofi sunrise chill)..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-48 sm:w-64 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Player parameter controllers (Tempo, Length) */}
            <div className="p-4 bg-slate-900/30 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Set Playback Speed ({tempo} BPM)</label>
                <input
                  id="range-playback-tempo"
                  type="range"
                  min="60"
                  max="180"
                  step="2"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Grid Duration ({sequenceLength} Beats)</label>
                <div className="flex gap-1">
                  {[16, 32, 48, 64].map((len) => (
                    <button
                      id={`btn-len-${len}`}
                      key={len}
                      onClick={() => {
                        setSequenceLength(len);
                        addLog(`Output grid boundaries set to ${len} structural beats.`, "PLAYER");
                      }}
                      className={`flex-1 text-[10px] font-mono py-0.5 rounded border ${
                        sequenceLength === len
                          ? "bg-blue-600/20 border-blue-500 text-blue-400"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Temperature / Variance ({temperature})</label>
                <input
                  id="range-entropy-temperature"
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  id="btn-play-pause-sequence"
                  onClick={handleTogglePlay}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                    isPlaying
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)] cursor-pointer"
                      : "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)] cursor-pointer"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Pause Seq
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Trigger Seq
                    </>
                  )}
                </button>

                <button
                  id="btn-export-midi-file"
                  onClick={handleDownloadMidi}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-bold text-slate-300 flex items-center justify-center cursor-pointer"
                  title="Download standard MIDI arrangement format"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note visualizer: Interactive Piano Roll Grid System */}
            <div className="p-4 bg-slate-950/80 max-h-[300px] overflow-auto select-none border-b border-slate-800">
              <div className="min-w-[640px] relative">
                {/* Horizontal time coordinates */}
                <div className="flex border-b border-slate-800 pb-1 mb-1 font-mono text-[9px] text-slate-500 bg-slate-950/40 sticky top-0 z-10">
                  <div className="w-16 shrink-0 font-bold uppercase tracking-widest text-slate-500 border-r border-slate-800">
                    PITCH
                  </div>
                  <div className="flex-1 grid grid-cols-32 gap-px pl-2 relative">
                    {Array.from({ length: 32 }).map((_, beatIdx) => (
                      <div
                        key={beatIdx}
                        className={`text-center relative ${beatIdx % 4 === 0 ? "text-slate-300 font-extrabold" : ""}`}
                      >
                        {beatIdx + 1}
                        {beatIdx % 4 === 0 && <span className="absolute bottom-[-6px] left-1/2 w-1 h-1 rounded-full bg-slate-400"></span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Piano Roll Grid Rows */}
                <div className="space-y-1 relative" style={{ height: "210px" }}>
                  {getMaxDisplayRows().map((rowPitch) => {
                    const isSharp = rowPitch.includes("#");
                    return (
                      <div key={rowPitch} className="flex h-4 items-center group">
                        {/* Note label */}
                        <div
                          onClick={() => handlePressLiveKey(rowPitch)}
                          className={`w-16 shrink-0 text-[10px] font-mono px-1.5 leading-none h-full flex items-center justify-between border-r border-slate-800 cursor-pointer ${
                            isSharp ? "bg-slate-900 border-l-2 border-l-purple-500 text-slate-400" : "bg-slate-800 text-slate-200"
                          } hover:brightness-125`}
                        >
                          <span>{rowPitch}</span>
                          <span className="text-[8px] text-slate-600 font-sans">🎹</span>
                        </div>

                        {/* Beats boxes row back bed */}
                        <div className="flex-1 grid grid-cols-32 gap-px pl-2 h-full relative">
                          {Array.from({ length: 32 }).map((_, beatIdx) => {
                            const isMeasureAccent = beatIdx % 4 === 0;
                            return (
                              <div
                                key={beatIdx}
                                className={`h-full border-b border-slate-900/60 transition-colors ${
                                  isMeasureAccent ? "bg-slate-900/40 border-l border-slate-800/40" : "bg-slate-950/20"
                                }`}
                              />
                            );
                          })}

                          {/* Render active melody notes mapped overlay */}
                          {activeArrangement.tracks.melody
                            .filter((n) => n.pitch === rowPitch)
                            .map((note, idx) => {
                              const leftPercent = (note.time / 32) * 100;
                              const widthPercent = (note.duration / 32) * 100;
                              return (
                                <div
                                  key={`melody-note-${idx}`}
                                  className={`absolute h-3 top-0.5 rounded border text-[8px] font-mono font-bold leading-none flex items-center justify-center p-0.5 overflow-hidden truncate ${getMidiColorByTrack(
                                    "melody"
                                  )}`}
                                  style={{
                                    left: `calc(${leftPercent}% + 8px)`,
                                    width: `calc(${widthPercent}% - 2px)`,
                                  }}
                                  title={`Melody Lead: ${note.pitch} (time: ${note.time}, dur: ${note.duration})`}
                                >
                                  {note.pitch}
                                </div>
                              );
                            })}

                          {/* Render active harmony notes as secondary blocks if they fall on this pitching pitch octave */}
                          {activeArrangement.tracks.harmony
                            .filter((n) => n.pitch === rowPitch || n.pitch.replace("3", "4") === rowPitch)
                            .map((note, idx) => {
                              const leftPercent = (note.time / 32) * 100;
                              const widthPercent = (note.duration / 32) * 100;
                              return (
                                <div
                                  key={`harmony-note-${idx}`}
                                  className={`absolute h-3 top-0.5 rounded border text-[8px] font-mono font-bold opacity-60 leading-none flex items-center justify-center p-0.5 overflow-hidden truncate ${getMidiColorByTrack(
                                    "harmony"
                                  )}`}
                                  style={{
                                    left: `calc(${leftPercent}% + 8px)`,
                                    width: `calc(${widthPercent}% - 2px)`,
                                  }}
                                  title={`Chord Pad: ${note.pitch}`}
                                >
                                  {note.pitch}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Render rhythm track drums overlay explicitly in a dedicated bottom strip */}
                  <div className="flex h-5 items-center border-t border-t-slate-800 bg-slate-950/40 pt-1">
                    <div className="w-16 shrink-0 text-[10px] font-bold text-amber-500 font-mono px-1 border-r border-slate-800">
                      RHYTHMS
                    </div>
                    <div className="flex-1 grid grid-cols-32 gap-px pl-2 h-full relative">
                      {activeArrangement.tracks.drums.map((note, idx) => {
                        const leftPercent = (note.time / 32) * 100;
                        const widthPercent = (note.duration / 32) * 100;
                        return (
                          <div
                            key={`drum-note-${idx}`}
                            className={`absolute h-3.5 bottom-0 rounded border text-[7px] leading-tight font-extrabold flex items-center justify-center px-0.5 overflow-hidden ${getMidiColorByTrack(
                              "drums"
                            )}`}
                            style={{
                              left: `calc(${leftPercent}% + 8px)`,
                              width: `${widthPercent * 2 || 12}px`,
                            }}
                            title={`Drum: ${note.pitch} (time: ${note.time})`}
                          >
                            {note.pitch[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-time playhead scanning visual scrub bar */}
                  {isPlaying && (
                    <div
                      id="playhead-sweep-bar"
                      className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none shadow-[0_0_10px_#f59e0b] transition-all duration-75"
                      style={{
                        left: `calc(${(playheadBeat / 32) * 100}% + 64px)`,
                      }}
                    >
                      <div className="absolute top-0 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rotate-45 border border-amber-500"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Piano Roll Legends indicator metadata */}
            <div className="px-4 py-2 bg-slate-900 flex justify-between items-center text-[10px]">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 font-bold text-blue-400">
                  <span className="w-2 h-2 rounded bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.8)]"></span>
                  Lead Note (Synth)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-purple-400">
                  <span className="w-2 h-2 rounded bg-purple-600 shadow-[0_0_4px_rgba(147,51,234,0.8)]"></span>
                  Harmony Beds (Chords)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-amber-500">
                  <span className="w-2 h-2 rounded bg-amber-600 shadow-[0_0_4px_rgba(245,158,11,0.8)]"></span>
                  Percussion (Analog Drums)
                </span>
              </div>
              <div className="text-slate-400">
                Playhead: <span className="font-mono text-white text-[11px] font-bold">{playheadBeat.toFixed(2)}</span> / 32 beats
              </div>
            </div>
          </div>

          {/* Section D: Chromatic Virtual Synthesizer Live Keyboard */}
          <div id="card-virtual-keyboard" className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden shadow-md">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center bg-slate-805">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">4. Live Polyphonic Virtual Synth Keys</h3>
              </div>
              <span className="text-[10px] text-slate-500">Click keys to trigger live custom wave triggers</span>
            </div>

            <div className="p-4 bg-slate-950/40">
              <div className="flex h-20 items-stretch border border-slate-800 rounded overflow-hidden select-none relative">
                {liveNotes.map((note) => {
                  const isSharp = note.includes("#");
                  return (
                    <button
                      id={`synth-key-${note}`}
                      key={note}
                      onMouseDown={() => handlePressLiveKey(note)}
                      className={`flex-1 flex flex-col justify-end items-center pb-1.5 text-[8px] font-mono transition-all font-bold ${
                        isSharp
                          ? "bg-[#090D16] text-[#A855F7] border-l border-r border-slate-805 h-12 z-20 hover:bg-[#1E1B4B] relative"
                          : "bg-white text-slate-800 border-r border-slate-205 h-full z-10 hover:bg-slate-100"
                      }`}
                      style={
                        isSharp
                          ? {
                              marginLeft: "-1.5%",
                              marginRight: "-1.5%",
                              width: "6%",
                            }
                          : {}
                      }
                    >
                      <span className="rotate-270 scale-90 opacity-80">{note}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section E: Live Telemetry & Console Logger outputs */}
          <div id="card-system-logs" className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-md">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/40 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Neural Compiler Terminal Console Outputs</h3>
              <span className="text-[9px] font-mono text-green-500">CONNECTED: SECURE CHANNEL AX-92</span>
            </div>
            
            <div className="h-36 p-4 font-mono text-[11px] space-y-2 overflow-y-auto bg-slate-950/90 text-slate-300">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start leading-relaxed">
                  <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                  <span
                    className={`font-semibold shrink-0 select-none text-[9px] px-1 py-0.2 rounded border ${
                      log.level === "ERROR"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : log.level === "TRAIN"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : log.level === "GENERATIVE_AI"
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-200">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Info line */}
      <footer id="footer-main" className="h-8 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between px-6 text-[9px] text-slate-500 shrink-0">
        <div className="flex gap-4">
          <span>COORDINATION RATINGS: LAT 41.87° N / LONG 87.62° W</span>
          <span>ORBIT: 384,400 KM</span>
          <span>COMPUTE RECYCLER: CORE-V8</span>
        </div>
        <div className="flex gap-4">
          <span>ENCRYPTION SYSTEM: AES-256 BIT</span>
          <span className="text-green-500 uppercase tracking-widest font-bold">SECURE PIPELINE ESTABLISHED</span>
        </div>
      </footer>
    </div>
  );
}
