# HoloSynth

> A spatial web synthesizer controlled by your hands — no hardware required.

![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=flat&logo=three.js)
![Tone.js](https://img.shields.io/badge/Audio-Tone.js-000?style=flat)
![MediaPipe](https://img.shields.io/badge/Vision-MediaPipe-ff6f00?style=flat)

## What is HoloSynth?

HoloSynth transforms your webcam into a **holographic synthesizer interface**. Move your hands in space to control sound and visuals in real-time — all running 100% in the browser, zero server-side processing.

```
[Webcam] → [MediaPipe Hand Tracking] → [Spatial Math] → [Zustand Store] → [R3F + Tone.js]
```

## Features

- **Hand-controlled synthesis** — Right hand position maps to pitch (angle) and volume/filter (radius)
- **Gesture recognition** — Left hand gestures (pinch, fist, open) trigger visual effects and control a loop recorder
- **Holographic 3D visuals** — Synthwave-inspired scene with toroidal rings, particle fields, and neon grids
- **Post-processing effects** — Bloom, chromatic aberration, and vignette for that retro-futuristic aesthetic
- **Built-in looper** — Record and layer musical phrases with hand gestures, up to 4 bars
- **Fully client-side** — No API keys, no servers, no latency. Everything runs in your browser

## Architecture

HoloSynth is built with a clean modular architecture separated into 3 core domains:

| Domain | Tech | Responsibility |
|---|---|---|
| **Vision** | MediaPipe Tasks Vision | Hand landmark detection, spatial math, gesture recognition |
| **Audio** | Tone.js | PolySynth engine, quantized scales, loop recording |
| **Visual** | React Three Fiber + Drei | 3D scene, reactive components, post-processing |

All modules communicate through a shared **Zustand store** with a strict data contract — ensuring type safety and minimal re-renders.

## Tech Stack

- **Vite** + **React 19** + **TypeScript** (strict mode)
- **Zustand** — State management with atomic selectors
- **React Three Fiber** + **Drei** — Declarative 3D scene graph
- **Tone.js** — Web Audio synthesis engine
- **MediaPipe Tasks Vision** — On-device hand tracking via WASM
- **@react-three/postprocessing** — Bloom, chromatic aberration, vignette

## Scale & Quantization

- **Scale:** Minor pentatonic across 2 octaves (C3–C5)
  `C3, Eb3, F3, G3, Bb3, C4, Eb4, F4, G4, Bb4, C5`
- **Angle (0°–360°)** → Note index (11 quantized steps)
- **Radius (0–1)** → VCA gain + LPF cutoff (200Hz–8kHz exponential)

## Gestures

| Gesture | Action |
|---|---|
| **Right hand move** | Control pitch (angle) and volume/filter (radius) |
| **Left hand pinch** | Start/stop loop recording |
| **Left hand fist** | Mute the loop |
| **Left hand open** | Unmute the loop |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

## Project Structure

```
src/
├── types.ts                    # Shared data contract (immutable)
├── store/
│   └── useHoloStore.ts         # Zustand state management
├── modules/
│   ├── vision/                 # Hand tracking & gestures
│   │   ├── handLandmarker.ts
│   │   ├── spatialMath.ts
│   │   ├── gestureDetector.ts
│   │   └── HandTracker.tsx
│   ├── audio/                  # Synthesis engine
│   │   ├── synthCore.ts
│   │   ├── AudioEngine.tsx
│   │   └── looper.ts
│   └── visual/                 # 3D scene & effects
│       ├── SynthCanvas.tsx
│       ├── PostEffects.tsx
│       └── components/
└── App.tsx                     # App shell with lazy-loaded modules
```

## License

MIT
