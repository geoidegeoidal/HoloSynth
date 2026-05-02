import * as Tone from 'tone';
import { useSynthStore } from '../../store/useSynthStore';

class MinilabEngine {
  public synth: Tone.PolySynth;
  public filter: Tone.Filter;
  public lfo: Tone.LFO;
  public distortion: Tone.Distortion;
  public delay: Tone.PingPongDelay;
  public reverb: Tone.Reverb;
  public panner: Tone.Panner;
  public masterVolume: Tone.Volume;
  public meter: Tone.Meter;
  
  private isInitialized = false;

  constructor() {
    // 1. Core Synthesizer
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        spread: 20,
        count: 3,
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.8,
        release: 0.3,
      },
    });

    // 2. Effects Chain
    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -24,
      Q: 1,
    });

    this.lfo = new Tone.LFO({
      type: 'sine',
      min: 200,
      max: 4000,
      frequency: 2,
    });
    this.lfo.connect(this.filter.frequency);
    this.lfo.start();

    this.distortion = new Tone.Distortion({
      distortion: 0.0,
      wet: 1.0,
    });

    this.delay = new Tone.PingPongDelay({
      delayTime: '8n',
      feedback: 0.3,
      wet: 0.1,
    });

    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.2,
    });

    this.panner = new Tone.Panner(0);
    
    this.masterVolume = new Tone.Volume(-6); // Headroom
    
    this.meter = new Tone.Meter();

    // Routing: Synth -> Distortion -> Filter -> Delay -> Reverb -> Panner -> Volume -> Meter -> Master
    this.synth.chain(
      this.distortion,
      this.filter,
      this.delay,
      this.reverb,
      this.panner,
      this.masterVolume,
      this.meter,
      Tone.getDestination()
    );
  }

  public async initialize() {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
  }

  // Teclado
  public triggerAttack(note: string, velocity: number = 0.8) {
    if (!this.isInitialized) return;
    this.synth.triggerAttack(note, Tone.now(), velocity);
  }

  public triggerRelease(note: string) {
    if (!this.isInitialized) return;
    this.synth.triggerRelease(note, Tone.now());
  }

  // Moduladores y Ruedas
  public setPitchBend(bend: number) {
    // bend: -1.0 to 1.0 -> +/- 2 semitones
    const detune = bend * 200;
    this.synth.set({ detune });
  }

  public setModulation(mod: number) {
    // mod: 0.0 to 1.0 -> Vibrato depth
    // Map to oscillator phase or simple vibrato
    // Due to polysynth complexity, we modulate the LFO amount on the filter instead as a macro
    this.lfo.amplitude.rampTo(mod, 0.1);
  }

  // Knobs (0.0 to 1.0)
  public updateKnob(id: string, val: number) {
    const time = 0.05;
    switch (id) {
      case 'cutoff': {
        const freq = 20 * Math.pow(15000 / 20, val);
        this.filter.frequency.rampTo(freq, time);
        break;
      }
      case 'resonance':
        this.filter.Q.rampTo(val * 20, time);
        break;
      case 'lfoRate':
        this.lfo.frequency.rampTo(0.1 + val * 20, time);
        break;
      case 'lfoDepth': {
        const baseFreq = this.filter.frequency.value as number;
        this.lfo.min = Math.max(20, baseFreq * (1 - val));
        this.lfo.max = Math.min(15000, baseFreq * (1 + val));
        break;
      }
      case 'delay':
        this.delay.wet.rampTo(val, time);
        break;
      case 'reverb':
        this.reverb.wet.rampTo(val, time);
        break;
      case 'drive':
        this.distortion.distortion = val;
        break;
      case 'pan':
        // -1 to 1
        this.panner.pan.rampTo(val * 2 - 1, time);
        break;
    }
  }

  // Faders (0.0 to 1.0)
  public updateFader(id: string, val: number) {
    switch (id) {
      case 'attack':
        this.synth.set({ envelope: { attack: 0.01 + val * 2 } });
        break;
      case 'decay':
        this.synth.set({ envelope: { decay: 0.05 + val * 2 } });
        break;
      case 'sustain':
        this.synth.set({ envelope: { sustain: val } });
        break;
      case 'release':
        this.synth.set({ envelope: { release: 0.05 + val * 5 } });
        break;
    }
  }
}

export const engine = new MinilabEngine();

// Subscribe to store changes to map state automatically
useSynthStore.subscribe((state, prevState) => {
  // Check Knobs
  for (const [k, v] of Object.entries(state.knobs)) {
    if (v !== (prevState.knobs as Record<string, number>)[k]) {
      engine.updateKnob(k, v);
    }
  }
  // Check Faders
  for (const [k, v] of Object.entries(state.faders)) {
    if (v !== (prevState.faders as Record<string, number>)[k]) {
      engine.updateFader(k, v);
    }
  }
  // Check Strips
  if (state.pitchBend !== prevState.pitchBend) engine.setPitchBend(state.pitchBend);
  if (state.modulation !== prevState.modulation) engine.setModulation(state.modulation);
});
