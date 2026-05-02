# HoloSynth Pro — Plan de Implementación (Arturia Minilab 3 Virtual)

## Visión Arquitectónica

Pivotamos de un instrumento espacial (MediaPipe/Webcam) a una **estación de producción virtual** inspirada en el legendario controlador **Arturia Minilab 3**. Mantendremos el diseño estético de clase mundial (Holográfico, Cyberpunk, Glassmorphism) pero inyectaremos un motor de síntesis completo y soporte para **Web MIDI API**.

### Características Core (Minilab 3 Specs)
- **Teclado:** 25 teclas virtuales (2 octavas) con control de Octava +/- y soporte multipunto/MIDI.
- **Pads:** 8 Pads RGB asignables para baterías/loops.
- **Knobs:** 8 Encoders rotativos para manipulación de Filtros (Cutoff, Res), LFOs y Efectos.
- **Faders:** 4 Deslizadores asignados a la envolvente ADSR.
- **Strips:** 2 Cintas táctiles para Pitch Bend y Modulación.
- **Estética:** Fondo 3D reactivo (Toroide holográfico) envuelto en un HUD de cristal (Glassmorphism).

---

## 🏗️ Nuevo Contrato de Datos (Zustand)

```typescript
// src/types/synth.ts
export interface MinilabState {
  // Estado del Teclado
  activeNotes: Set<string>;
  octaveOffset: number;
  pitchBend: number;   // -1.0 a 1.0
  modulation: number;  // 0.0 a 1.0

  // Controles Físicos/Virtuales
  knobs: { cutoff: number; resonance: number; lfoRate: number; lfoDepth: number; delay: number; reverb: number; drive: number; pan: number };
  faders: { attack: number; decay: number; sustain: number; release: number };
  activePads: Set<number>;

  // Acciones
  triggerNote: (note: string, velocity?: number) => void;
  releaseNote: (note: string) => void;
  triggerPad: (padId: number) => void;
  setKnob: (id: keyof MinilabState['knobs'], val: number) => void;
  setFader: (id: keyof MinilabState['faders'], val: number) => void;
}
```

---

## 🤖 Asignación de Roles y Fases

Para maximizar la eficiencia y calidad del código, dividiremos el trabajo basándonos en los modelos líderes en benchmarks actuales:

### 🎯 FASE 1: Infraestructura y Hardware API
**Asignado a:** `DeepSeek V4 Pro (vía OpenCode Go)` *(Razonamiento profundo, gestión de estado y APIs nativas)*

1. **Limpiar Código:** Eliminar toda dependencia de `@mediapipe/tasks-vision` y código de tracking espacial.
2. **Web MIDI API:** Crear un hook `useMidiController` que escuche dispositivos MIDI externos y mapee señales a la tienda de Zustand.
3. **Core Store:** Implementar `useSynthStore.ts` con el nuevo contrato de datos, asegurando selectores atómicos para evitar re-renders.

### 🎯 FASE 2: Motor DSP (Digital Signal Processing)
**Asignado a:** `Gemini 3.1 Pro (High Computation)` *(Excelente en matemáticas complejas, lógica de audio y Tone.js)*

1. **Core Synthesizer:** Crear un `PolySynth` avanzado en Tone.js. Conectar los **Faders (ADSR)** a la envolvente del sintetizador.
2. **Routing de Efectos:** Conectar los **Knobs** a un Filter, LFO, Distortion, Delay y Reverb.
3. **Drum Machine:** Implementar síntesis pura de percusión (estilo TR-808) matemática en Tone.js para los **8 Pads**.
4. **Modulación:** Implementar el Pitch Bend suave y la Modulación de vibrato usando los Strips virtuales.

### 🎯 FASE 3: UI/UX Minilab Premium
**Asignado a:** `DeepSeek V4 Pro (vía OpenCode Go)` *(Experto en frontend arquitectónico y CSS/Glassmorphism)*

1. **Piano Roll Virtual:** Componente de 25 teclas interactivas (mouse/teclado de PC).
2. **Control Section:** Panel superior replicando el layout del Minilab: 2 filas de 4 Knobs, 4 Faders a la derecha, 8 Pads a la izquierda.
3. **Estilizado:** Usar `backdrop-filter`, sombras de neón (Cyan/Magenta), SVG custom para Knobs que roten según el valor del store, y Faders con track iluminado. Todo sobre el fondo azul profundo.

### 🎯 FASE 4: Fusión Estética 3D
**Asignado a:** `Gemini 3.1 Pro (High Computation)` *(Experto en shaders, Three.js y React Three Fiber)*

1. **Fondo Holográfico Reactivo:** Recuperar el `HoloTorus` y el `ParticleField`.
2. **Audio-Reactivity:** Conectar la salida máster del `AudioEngine` (mediante un `AnalyserNode`) a la escala y el *emissiveIntensity* del Toroide, para que palpite con la música tocada en el teclado.

---

## 🚨 User Review Required

- **Eliminación de features:** Esto significa que el control por cámara (Gestos con las manos) será **eliminado por completo** para dar paso a un sintetizador MIDI/Virtual profesional. ¿Estás de acuerdo con este cambio destructivo?
- **Samples de Pads:** ¿Prefieres que los Pads usen sonidos de batería sintetizados puramente con matemáticas en Tone.js (estilo TR-808), o prefieres que implementemos un cargador de audios (`.wav`) genéricos?

## Verification Plan

- Conectar un controlador MIDI real (ej. el propio Arturia Minilab) y verificar latencia cero.
- Tocar con el teclado del ordenador (QWERTY mapeado a piano) y confirmar la reactividad visual del UI y del fondo 3D.
