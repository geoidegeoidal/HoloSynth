import * as Tone from 'tone';
import { useSynthStore } from '../../store/useSynthStore';

class DrumMachine {
  private kick: Tone.MembraneSynth;
  private snare: Tone.NoiseSynth;
  private closedHat: Tone.MetalSynth;
  private openHat: Tone.MetalSynth;
  private tomHigh: Tone.MembraneSynth;
  private tomLow: Tone.MembraneSynth;
  private clap: Tone.NoiseSynth;
  private crash: Tone.MetalSynth;

  private isInitialized = false;

  constructor() {
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
    }).toDestination();

    this.snare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
    }).toDestination();

    this.closedHat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    this.openHat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    this.tomHigh = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 }
    }).toDestination();

    this.tomLow = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 1.0 }
    }).toDestination();

    this.clap = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 }
    }).toDestination();

    this.crash = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1.5, release: 0.2 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
  }

  public async initialize() {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
  }

  public trigger(padId: number) {
    if (!this.isInitialized) return;
    const now = Tone.now();
    
    switch (padId) {
      case 0: this.kick.triggerAttackRelease('C1', '8n', now); break;
      case 1: this.snare.triggerAttackRelease('8n', now); break;
      case 2: this.closedHat.triggerAttackRelease('16n', now); break;
      case 3: this.openHat.triggerAttackRelease('8n', now); break;
      case 4: this.tomLow.triggerAttackRelease('G1', '8n', now); break;
      case 5: this.tomHigh.triggerAttackRelease('C2', '8n', now); break;
      case 6: this.clap.triggerAttackRelease('8n', now); break;
      case 7: this.crash.triggerAttackRelease('4n', now); break;
    }
  }
}

export const drumMachine = new DrumMachine();

// Subscribe to store changes to trigger pads
useSynthStore.subscribe((state, prevState) => {
  // Check newly added pads
  for (const pad of state.activePads) {
    if (!prevState.activePads.has(pad)) {
      drumMachine.trigger(pad);
    }
  }
});
