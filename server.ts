import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "5mb" }));

// Lazy initializer for Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Music Note Generation API
app.post("/api/generate-music", async (req: express.Request, res: express.Response) => {
  try {
    const {
      genre = "classical",
      prompt = "",
      tempo = 120,
      sequenceLength = 32,
      temperature = 0.7,
      networkType = "LSTM",
      epochs = 50,
      trainingLoss = 0.12,
    } = req.body;

    const queryPrompt = `Generate a structured multitrack MIDI-like synth arrangement in the style of "${genre}".
Epochs trained: ${epochs}, Simulated Network: ${networkType} with dynamic feedback. Loss reached: ${trainingLoss}.
${prompt ? `Creative direction: ${prompt}` : ""}
The piece must have exactly ${sequenceLength} beats of length. Tempo is ${tempo} BPM.

You must build a high-quality arrangement with three distinct tracks:
1. "melody": Lead/solo instrument carrying a theme or melody (e.g., synthesizer, piano, woodwind model pitch, beautiful note-by-note triggers).
2. "harmony": Chordal accompaniment (e.g., pad, arpeggiated piano/guitar chords supporting the key).
3. "drums": Rhythmic backing tracks using exactly:
   - "KICK" (usually on strong main beats like 0, 1, 2, 3...)
   - "SNARE" (usually on backbeats like 1, 3 or offtime syncs)
   - "HIHAT" (usually eighth-note pacing: 0, 0.5, 1, 1.5, 2, 2.5...)

Each track must contain an array of notes.
A note object has:
- pitch: String. For melody/harmony, use standard notation (e.g., "C4", "D#4", "Gb4", "A3", "E5"). For drums, MUST be strictly one of: "KICK", "SNARE", "HIHAT".
- time: Number (in beats). Starting point index of this note (0 represents beat 1 start, 0.5 is eighth note delay, etc). Keep times in range 0 to ${sequenceLength}.
- duration: Number (in beats). Length of this note. Standard lengths: 0.25 (16th note), 0.5 (eighth note), 1.0 (quarter note), 2.0 (half note), 4.0 (whole note).
- velocity: Number between 0.0 and 1.0.

Generate interesting movement, realistic syncopated notes, overlapping harmonies, and matching drum sequences. Do not make standard loop repetitions too boring.
Return the output strictly in the requested JSON structure.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: queryPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: Math.min(1.2, Math.max(0.1, Number(temperature))),
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Name of the generated music piece" },
            key: { type: Type.STRING, description: "Musical key signature (e.g. 'C Major' or 'A Minor')" },
            tempo: { type: Type.INTEGER, description: "Suggested playback speed in BPM" },
            tracks: {
              type: Type.OBJECT,
              properties: {
                melody: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pitch: { type: Type.STRING },
                      time: { type: Type.NUMBER },
                      duration: { type: Type.NUMBER },
                      velocity: { type: Type.NUMBER },
                    },
                    required: ["pitch", "time", "duration"],
                  },
                },
                harmony: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pitch: { type: Type.STRING },
                      time: { type: Type.NUMBER },
                      duration: { type: Type.NUMBER },
                      velocity: { type: Type.NUMBER },
                    },
                    required: ["pitch", "time", "duration"],
                  },
                },
                drums: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pitch: { type: Type.STRING },
                      time: { type: Type.NUMBER },
                      duration: { type: Type.NUMBER },
                      velocity: { type: Type.NUMBER },
                    },
                    required: ["pitch", "time", "duration"],
                  },
                },
              },
              required: ["melody", "harmony", "drums"],
            },
          },
          required: ["title", "key", "tempo", "tracks"],
        },
      },
    });

    const musicDataString = response.text;
    if (!musicDataString) {
      throw new Error("Model returned empty instructions.");
    }

    const musicResponse = JSON.parse(musicDataString.trim());
    res.json({ success: true, data: musicResponse });
  } catch (error: any) {
    console.error("Gemini Music generation error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "An error occurred while training and generating the sequence via AI.",
    });
  }
});

// Serve frontend with Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Music Generator running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
