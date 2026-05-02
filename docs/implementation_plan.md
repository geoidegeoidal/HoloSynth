# HoloSynth — Plan de Implementación Secuenciado por Modelo

## Visión

Sintetizador web espacial controlado por visión artificial (MediaPipe). Pipeline 100% cliente:

```
[Cámara] → [MediaPipe/ML] → [Matemáticas Espaciales] → [Zustand Store] → [R3F + Tone.js]
```

---

## Contrato de Datos Compartido (TODOS los roles)

> **INMUTABLE SIN CONSENSO.** Todos los roles DEBEN consumir y producir datos que se adhieran a estas interfaces.

```typescript
// src/types.ts
export interface HandCoordinates {
  x: number; // Normalizado 0..1
  y: number; // Normalizado 0..1
  z: number; // Profundidad relativa
}

export interface RightHandData {
  isVisible: boolean;
  angle: number;    // 0–360°, ángulo polar desde centro del viewport
  radius: number;   // 0.0–1.0, distancia normalizada desde centro del viewport
  rawCentroid: HandCoordinates;
}

export type LeftHandGesture = 'none' | 'pinch' | 'open' | 'fist';

export interface HoloSynthState {
  isReady: boolean;
  rightHand: RightHandData;
  leftHandGesture: LeftHandGesture;
  setRightHandData: (data: Partial<RightHandData>) => void;
  setLeftHandGesture: (gesture: LeftHandGesture) => void;
  setReady: (status: boolean) => void;
}
```

---

## Resumen de Archivos por Rol

| Archivo | ROL 1 🔧 | ROL 2 📐 | ROL 3 🎨 |
|---|:---:|:---:|:---:|
| `vite.config.ts` | ✅ | | |
| `tsconfig.json` | ✅ | | |
| `src/types.ts` | ✅ | | |
| `src/store/useHoloStore.ts` | ✅ | | |
| `src/App.tsx` | ✅ | | |
| `src/modules/vision/handLandmarker.ts` | | ✅ | |
| `src/modules/vision/spatialMath.ts` | | ✅ | |
| `src/modules/vision/gestureDetector.ts` | | ✅ | |
| `src/modules/vision/HandTracker.tsx` | | ✅ | |
| `src/modules/audio/synthCore.ts` | | | ✅ |
| `src/modules/audio/AudioEngine.tsx` | | | ✅ |
| `src/modules/audio/looper.ts` | | | ✅ |
| `src/modules/visual/SynthCanvas.tsx` | | | ✅ |
| `src/modules/visual/components/*.tsx` | | | ✅ |
| `src/modules/visual/PostEffects.tsx` | | | ✅ |

---
---

# FASE 1 — Cimientos

## 🎯 ASIGNAR A: ROL 1 — OpenCode / DeepSeek Coder

> **Bloquea:** Todo lo demás. Nada arranca hasta que esta fase esté completa.
> **Jurisdicción exclusiva:** Configuración del proyecto, store, y app shell.

### Paso 1.1 — Scaffold del proyecto

| Detalle | Valor |
|---|---|
| **Comando** | `npx -y create-vite@latest ./ --template react-ts` |
| **Deps adicionales** | `zustand`, `@react-three/fiber`, `@react-three/drei`, `three`, `tone`, `@mediapipe/tasks-vision`, `@react-three/postprocessing` |
| **Dev deps** | `@types/three` |
| **tsconfig** | `strict: true`, `noUncheckedIndexedAccess: true` |
| **Entregable** | Proyecto compilando con `npm run dev` sin errores |

### Paso 1.2 — Contrato de tipos (`src/types.ts`)

- Crear el archivo con las interfaces exactas del contrato de datos (ver sección "Contrato de Datos Compartido").
- Exportar todo como tipos nombrados, sin `default export`.

### Paso 1.3 — Store Zustand (`src/store/useHoloStore.ts`)

- Implementar con `create` de Zustand.
- Estado inicial con valores por defecto seguros (`isVisible: false`, `angle: 0`, `radius: 0`, `gesture: 'none'`).
- **Optimización crítica:** los setters deben usar merge parcial para evitar re-renders innecesarios. Los consumidores usarán selectores atómicos:

```typescript
// ✅ Correcto — solo re-render cuando cambia angle
const angle = useHoloStore((s) => s.rightHand.angle);

// ❌ Incorrecto — re-render en cualquier cambio del store
const state = useHoloStore();
```

- Exportar selectores pre-fabricados para los valores más consumidos (`useAngle`, `useRadius`, `useGesture`, `useIsReady`).

### Paso 1.4 — App Shell (`src/App.tsx`)

- Layout base con `<Suspense>` y `<ErrorBoundary>`.
- Slots para los módulos de los otros roles:
  - `<HandTracker />` — ROL 2 lo implementará
  - `<SynthCanvas />` — ROL 3 lo implementará
  - `<AudioEngine />` — ROL 3 lo implementará
- Crear stubs/placeholders exportados desde archivos vacíos para que el proyecto compile:
  - `src/modules/vision/HandTracker.tsx` → `export const HandTracker = () => null;`
  - `src/modules/audio/AudioEngine.tsx` → `export const AudioEngine = () => null;`
  - `src/modules/visual/SynthCanvas.tsx` → `export const SynthCanvas = () => null;`
- Lazy loading con `React.lazy()` para cada módulo.

### ✅ Checkpoint de validación (Fase 1)

```bash
npm run dev          # Compila sin errores
npm run build        # Build de producción limpio
```
- Store accesible: `useHoloStore.getState()` retorna estado válido en consola.
- Los stubs se cargan sin errores.

---
---

# FASE 2A — Motor Espacial y Visión

## 🎯 ASIGNAR A: ROL 2 — Gemini 3.1 Pro High

> **Requiere:** FASE 1 completada.
> **Puede ejecutarse en paralelo con:** FASE 2B (ROL 3).
> **Jurisdicción exclusiva:** `src/modules/vision/`

### Paso 2.1 — Configuración de MediaPipe HandLandmarker

| Detalle | Valor |
|---|---|
| **Archivo** | `src/modules/vision/handLandmarker.ts` |
| **Modelo WASM** | `@mediapipe/tasks-vision` con `HandLandmarker.createFromOptions` |
| **Config** | `numHands: 2`, `minDetectionConfidence: 0.6`, `minTrackingConfidence: 0.7` |
| **Ejecución** | `VIDEO` mode con timestamps de `performance.now()` |

- Inicializar la cámara con `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })`.
- El loop de detección debe vivir **fuera del ciclo de React** (usar `requestAnimationFrame` nativo).
- Exportar una función `startTracking(videoEl: HTMLVideoElement, onResults: Callback)`.

### Paso 2.2 — Cálculos polares (Mano Derecha)

| Detalle | Valor |
|---|---|
| **Archivo** | `src/modules/vision/spatialMath.ts` |

- **Centroide:** Promedio de landmarks 0, 5, 9, 13, 17 (base de cada dedo + muñeca) para obtener el centro geométrico de la palma.
- **Coordenadas polares:**
  ```
  dx = centroid.x - 0.5   // Centro del viewport normalizado
  dy = centroid.y - 0.5
  radius = clamp(Math.sqrt(dx² + dy²) * 2, 0, 1)
  angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360
  ```
- **Profundidad (z):** Promedio del eje z de los mismos landmarks.
- Función pura: `calculatePolarData(landmarks: NormalizedLandmark[]): RightHandData`

### Paso 2.3 — Detección de gestos (Mano Izquierda)

| Detalle | Valor |
|---|---|
| **Archivo** | `src/modules/vision/gestureDetector.ts` |

Heurística basada en distancias entre landmarks:

| Gesto | Condición |
|---|---|
| `pinch` | Distancia euclidiana entre landmark 4 (punta pulgar) y 8 (punta índice) < umbral (0.05) |
| `fist` | Todos los fingertips (8, 12, 16, 20) están por debajo de sus respectivos MCP joints (5, 9, 13, 17) en el eje Y |
| `open` | Todos los fingertips están por encima de sus MCP joints |
| `none` | Ninguna condición anterior se cumple |

- Función pura: `detectGesture(landmarks: NormalizedLandmark[]): LeftHandGesture`
- Implementar **debounce temporal** (mínimo 3 frames consecutivos del mismo gesto) para evitar parpadeo entre estados.

### Paso 2.4 — Hook de inyección (`HandTracker.tsx`)

| Detalle | Valor |
|---|---|
| **Archivo** | `src/modules/vision/HandTracker.tsx` (reemplaza el stub) |

- Componente React que renderiza un `<video>` oculto y un `<canvas>` de debug opcional.
- En `useEffect`, inicializa la cámara y el loop de tracking.
- En el callback de resultados, llama a `calculatePolarData` y `detectGesture`, luego inyecta al store con `setRightHandData` y `setLeftHandGesture`.
- **Importante:** obtener las funciones del store con `useHoloStore.getState()` (fuera de React) para evitar suscripciones innecesarias.

### ✅ Checkpoint de validación (Fase 2A)

- Abrir consola del navegador → `useHoloStore.getState().rightHand` muestra datos actualizándose a ~30fps con manos visibles frente a la cámara.
- Los gestos de la mano izquierda se reflejan correctamente en `useHoloStore.getState().leftHandGesture`.

---
---

# FASE 2B — Motor de Audio y Escena 3D

## 🎯 ASIGNAR A: ROL 3 — Claude Opus 4.6 (Antigravity)

> **Requiere:** FASE 1 completada.
> **Puede ejecutarse en paralelo con:** FASE 2A (ROL 2).
> **Jurisdicción exclusiva:** `src/modules/audio/` y `src/modules/visual/`

### Paso 2.5 — Motor de Audio (`AudioEngine.tsx` + `synthCore.ts`)

| Detalle | Valor |
|---|---|
| **Archivo principal** | `src/modules/audio/AudioEngine.tsx` |
| **Archivo de síntesis** | `src/modules/audio/synthCore.ts` |

**Arquitectura del sintetizador (Tone.js):**

```
[PolySynth] → [Filter (LPF)] → [Distortion (sutil)] → [Reverb] → [Destination]
```

- **Osciladores:** `fatsawtooth` con `spread: 20` y `count: 3` para riqueza analógica.
- **Escala cuantizada:** Pentatónica menor en 2 octavas (C3–C5):
  ```
  C3, Eb3, F3, G3, Bb3, C4, Eb4, F4, G4, Bb4, C5
  ```
- **Mapeo paramétrico:**
  - `angle` (0–360°) → índice de nota en la escala (cuantizado a 11 notas)
  - `radius` (0–1) → ganancia del VCA (0 = silencio, 1 = max) Y frecuencia de corte del LPF (200Hz – 8000Hz, exponencial)
- **Control de activación:** El sonido solo se produce cuando `rightHand.isVisible === true`.
- El componente debe manejar el `Tone.start()` al primer gesto del usuario (requerimiento de autoplay policy).

### Paso 2.6 — Escena 3D base (`SynthCanvas.tsx`)

| Detalle | Valor |
|---|---|
| **Archivo principal** | `src/modules/visual/SynthCanvas.tsx` |
| **Archivos de componentes 3D** | `src/modules/visual/components/` |

**Diseño visual — Estética Synthwave/Holográfico:**

- **Fondo:** Negro profundo (`#050510`) con gradiente radial sutil.
- **Elemento central:** Anillo toroidal (`TorusGeometry`) con material `MeshStandardMaterial` emisivo en tonos cyan/magenta.
- **Indicador de posición:** Esfera brillante que se mueve en coordenadas polares siguiendo `angle` y `radius` del store.
- **Partículas ambientales:** Campo de partículas flotantes con `Points` y `BufferGeometry`.
- **Grid de suelo:** Plano con material wireframe y color neón para efecto retro-grid.

**Reactividad paramétrica:**

| Parámetro del Store | Efecto Visual |
|---|---|
| `rightHand.angle` | Rotación del indicador alrededor del toroide |
| `rightHand.radius` | Intensidad de emisión (brillo) del toroide + escala del indicador |
| `leftHandGesture === 'pinch'` | Flash visual (pulso de bloom) |
| `leftHandGesture === 'fist'` | Desaturación parcial de la escena |
| `rightHand.isVisible` | Opacidad general de elementos reactivos |

### ✅ Checkpoint de validación (Fase 2B)

- Escena 3D renderiza sin errores con elementos estáticos visibles.
- Audio suena al simular datos en el store manualmente desde consola:
  ```javascript
  useHoloStore.getState().setRightHandData({ isVisible: true, angle: 180, radius: 0.5 })
  ```

---
---

# FASE 3 — Integración y Conectividad

## 🎯 ASIGNAR A: ROL 1 — OpenCode / DeepSeek Coder

> **Requiere:** FASE 2A y FASE 2B completadas.
> **Todos los módulos deben estar entregados antes de esta fase.**

### Paso 3.1 — Ensamblaje final

1. Reemplazar los stubs en `App.tsx` con los imports reales de los módulos entregados por ROL 2 y ROL 3.
2. Verificar que el flujo completo funciona end-to-end:
   - Cámara → MediaPipe detecta manos → Store se actualiza → Audio suena → Visual reacciona.
3. Ajustar cualquier incompatibilidad de imports o tipos entre módulos.

### ✅ Checkpoint de validación (Fase 3)

- Flujo E2E verificado: cámara → detección → store → audio + visual, todo en tiempo real.
- Sin errores en consola.
- `npm run build` pasa limpio.

---
---

# FASE 4A — Post-procesamiento y Looper

## 🎯 ASIGNAR A: ROL 3 — Claude Opus 4.6 (Antigravity)

> **Requiere:** FASE 3 completada (integración verificada).

### Paso 4.1 — Post-procesamiento visual

| Detalle | Valor |
|---|---|
| **Archivo** | `src/modules/visual/PostEffects.tsx` |
| **Paquete** | `@react-three/postprocessing` |

- **Bloom:** `intensity: 1.5`, `luminanceThreshold: 0.6` — para el brillo neón.
- **Chromatic Aberration:** `offset: [0.002, 0.002]` — sutil aberración en bordes.
- **Vignette:** `darkness: 0.7` — para enfocar la atención en el centro.

### Paso 4.2 — Sistema de Looper

| Detalle | Valor |
|---|---|
| **Archivo** | `src/modules/audio/looper.ts` |

| Gesto | Acción |
|---|---|
| `pinch` (inicio) | Comienza a grabar notas en un buffer circular (máx 4 compases) |
| `pinch` (fin / `open`) | Detiene grabación, inicia reproducción en loop |
| `fist` | Mutea el loop (no lo borra) |
| `open` (después de `fist`) | Desmutea el loop |

- Usar `Tone.Transport` y `Tone.Loop` para sincronización temporal.
- Buffer de eventos: `Array<{ time: number; note: string; duration: string }>`.

### ✅ Checkpoint de validación (Fase 4A)

- Post-procesamiento visual activo sin caída significativa de FPS (<16ms por frame).
- Looper graba, reproduce, y mutea correctamente con gestos de la mano izquierda.

---
---

# FASE 4B — Error Boundaries y UX de Carga

## 🎯 ASIGNAR A: ROL 1 — OpenCode / DeepSeek Coder

> **Requiere:** FASE 4A completada.
> **Esta es la fase final del proyecto.**

### Paso 4.3 — Error Boundaries y UX

- `ErrorBoundary` global con UI de fallback elegante (mensaje + botón de retry).
- Pantalla de carga con animación mientras MediaPipe inicializa el modelo WASM.
- Overlay de permisos de cámara con instrucciones claras.
- Indicador visual de estado de la cámara (activa/inactiva/error).

### ✅ Checkpoint de validación final

```bash
npm run build        # Build de producción limpio, 0 errores, 0 warnings
```
- Error boundaries capturan fallos sin crash total.
- UX de carga se muestra correctamente antes de que la cámara esté lista.
- Toda la app funciona end-to-end sin errores en consola.

---
---

# Resumen de Secuencia

| Orden | Fase | Modelo Asignado | Depende de |
|:---:|---|---|---|
| 1 | **FASE 1** — Cimientos | 🔧 ROL 1: OpenCode / DeepSeek | — |
| 2 | **FASE 2A** — Motor Espacial | 📐 ROL 2: Gemini 3.1 Pro High | FASE 1 |
| 2 | **FASE 2B** — Audio + Visual 3D | 🎨 ROL 3: Claude Opus 4.6 | FASE 1 |
| 3 | **FASE 3** — Integración E2E | 🔧 ROL 1: OpenCode / DeepSeek | FASE 2A + 2B |
| 4 | **FASE 4A** — Polish visual/audio | 🎨 ROL 3: Claude Opus 4.6 | FASE 3 |
| 5 | **FASE 4B** — Error Boundaries/UX | 🔧 ROL 1: OpenCode / DeepSeek | FASE 4A |

> **Nota de rendimiento:** MediaPipe HandLandmarker en modo `VIDEO` consume CPU significativo. Si el hardware es limitado, reducir resolución de captura a 320×240.
