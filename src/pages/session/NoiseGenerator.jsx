import { AudioLines, Cloud, CloudRain, Pause, Play, Waves } from "lucide-react";

import React from "react";
import ReactSlider from "react-slider";
import { useNoise } from '@/utils/NoiseContext';

// Configuración de cada sonido
const SOUND_CONFIGS = [
  {
    key: "brown",
    label: "Brown Noise",
    icon: Cloud,
    min: 0,
    max: 3,
    defaultVolume: 1.5,
    volumeMultiplier: 0.5,
    create: (volume, masterGain) => {
      const noise = new Tone.Noise("brown").start();
      const filter = new Tone.Filter(200, "lowpass");
      const limiter = new Tone.Limiter(-3).toDestination();
      const gain = new Tone.Gain(volume);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(limiter);
      return { noise, filter, gain, limiter };
    }
  },
  {
    key: "rain",
    label: "Rain Sound",
    icon: CloudRain,
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume, masterGain) => {
      // Main rain noise (white for a flatter spectrum)
      const noise = new Tone.Noise("white").start();
      const highpass = new Tone.Filter(300, "highpass"); // Revert high-pass slightly, maybe less low end needed
      const lowpass = new Tone.Filter(4000, "lowpass"); // Increase low-pass for more highs
      const eq = new Tone.EQ3(0, 0, 0).toDestination(); // Add a simple EQ for shaping

      // Spatial effects
      const reverb = new Tone.Reverb({
        decay: 2.5, // Slightly longer decay
        wet: 0.4, // More wet reverb
        preDelay: 0.1
      }).toDestination();

      // Main gain
      const gain = new Tone.Gain(volume * 0.4).connect(reverb); // Adjust gain multiplier and connect to reverb

      // LFO for subtle volume variation (mimics natural fluctuations)
      const rainLFO = new Tone.LFO({
        frequency: 0.2, // Slow variation
        min: 0.9,     // Subtle change range
        max: 1,
        type: "sine"
      }).start();

      // Connect main rain chain
      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      rainLFO.connect(gain.gain); // Modulate the main gain

      // Connect gain output to EQ (optional, could also be done before reverb)
      gain.connect(eq); // Connect gain to EQ

      return {
        noise,
        highpass,
        lowpass,
        eq,
        gain,
        reverb,
        rainLFO // Return the LFO as well
      };
    }
  },
  {
    key: "ocean",
    label: "Ocean Waves",
    icon: Waves,
    min: 0,
    max: 3,
    defaultVolume: 1,
    volumeMultiplier: 0.2,
    create: (volume, masterGain) => {
      // Main wave noise (pink for mid-high frequencies)
      const pinkNoise = new Tone.Noise("pink").start();
      const pinkHighpass = new Tone.Filter(200, "highpass");
      const pinkLowpass = new Tone.Filter(1200, "lowpass");
      
      // Deep wave noise (brown for low frequencies)
      const brownNoise = new Tone.Noise("brown").start();
      const brownFilter = new Tone.Filter(150, "lowpass");
      
      // Slow amplitude modulation for wave cycles
      const waveLFO = new Tone.LFO({
        frequency: 0.1,
        min: 0.3,
        max: 0.8,
        type: "sine"
      }).start();
      
      // Random variation in wave timing
      const randomLFO = new Tone.LFO({
        frequency: 0.05,
        min: 0.08,
        max: 0.12,
        type: "sine"
      }).start();
      randomLFO.connect(waveLFO.frequency);
      
      // Wave breaking effect
      const breakingNoise = new Tone.Noise("pink").start();
      const breakingFilter = new Tone.Filter(500, "bandpass");
      const breakingGain = new Tone.Gain(0.15);
      
      // Splash effect
      const splashNoise = new Tone.Noise("white").start();
      const splashFilter = new Tone.Filter(2000, "bandpass");
      const splashGain = new Tone.Gain(0.1);
      
      // Foam noise
      const foamNoise = new Tone.Noise("white").start();
      const foamFilter = new Tone.Filter(2000, "highpass");
      const foamGain = new Tone.Gain(0.1);
      
      // LFO for subtle foam volume variation
      const foamLFO = new Tone.LFO({
        frequency: 0.5,
        min: 0.8,
        max: 1,
        type: "sine"
      }).start();
      
      // Spatial effects
      const reverb = new Tone.Reverb({
        decay: 4,
        wet: 0.4,
        preDelay: 0.2
      }).toDestination();
      
      // Main gain with wave modulation
      const gain = new Tone.Gain(volume * 0.2).connect(reverb);
      waveLFO.connect(gain.gain);
      
      // Connect main wave components
      pinkNoise.connect(pinkHighpass);
      pinkHighpass.connect(pinkLowpass);
      pinkLowpass.connect(gain);
      
      brownNoise.connect(brownFilter);
      brownFilter.connect(gain);
      
      // Connect breaking wave
      breakingNoise.connect(breakingFilter);
      breakingFilter.connect(breakingGain);
      breakingGain.connect(gain);
      
      // Connect splash effect
      splashNoise.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(gain);
      
      // Connect foam noise
      foamNoise.connect(foamFilter);
      foamFilter.connect(foamGain);
      foamGain.connect(gain);
      
      // Connect foam LFO to foam gain
      foamLFO.connect(foamGain.gain);
      
      return { 
        pinkNoise, 
        pinkHighpass, 
        pinkLowpass,
        brownNoise,
        brownFilter,
        breakingNoise,
        breakingFilter,
        breakingGain,
        splashNoise,
        splashFilter,
        splashGain,
        foamNoise,
        foamFilter,
        foamGain,
        foamLFO,
        gain,
        waveLFO,
        randomLFO,
        reverb
      };
    }
  }
];

// Componente de control para cada sonido
function SoundControl({ label, icon: Icon, min, max, volume, setVolume, isPlaying, start, stop, className }) {
  return (
    <div className={`bar ${className || ''}`}>
      <label className="noisegentitle flex items-center gap-2">
        <Icon size={22} className="text-[var(--text-primary)]" />
        <span className="card-text font-medium text-[var(--text-primary)] text-base sm:text-md">{label}</span>
      </label>
      <div className="slider flex items-center gap-3">
        <ReactSlider
          className="flex-1 h-2"
          thumbClassName="w-4 h-4 rounded-full bg-[var(--accent-primary)] cursor-pointer hover:bg-[var(--accent-primary)]/80 transition-colors -translate-y-1 border-2 border-[var(--accent-primary)]"
          trackClassName="h-2 rounded-full bg-[var(--border-primary)] border-2 border-[var(--border-primary)]"
          renderTrack={(props, state) => {
            const { key, ...rest } = props;
            return (
              <div
                key={key}
                {...rest}
                className={`h-2 rounded-full border-2 border-[var(--border-primary)] ${
                  state.index === 0
                    ? 'bg-[var(--accent-primary)]'
                    : 'bg-[var(--border-primary)]'
                }`}
              />
            );
          }}
          min={min}
          max={max}
          step={0.01}
          value={volume}
          onChange={value => setVolume(value)}
          renderThumb={(props, state) => {
            const { key, ...rest } = props;
            return <div key={key} {...rest} />;
          }}
        />
        <div className="w-8 flex justify-center">
          {!isPlaying ? (
            <button
              type="button"
              onClick={start}
              className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Play size={22} />
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
            >
              <Pause size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function NoiseGenerator() {
  const { sounds, startSound, stopSound, setVolume, isInitialized, initializeAudio } = useNoise();

  const handleStart = async (index) => {
    if (!isInitialized) {
      await initializeAudio();
    }
    startSound(index);
  };

  return (
    <div className="w-full">
      <div className="section-title justify-center mb-4">
        <AudioLines size={22} className="icon" />
        <span>Noise Generator</span>
      </div>
      <div className="space-y-6 w-full">
        {sounds.map((sound, idx) => (
          <SoundControl
            key={sound.key}
            label={sound.label}
            icon={sound.icon === "Cloud" ? Cloud : sound.icon === "CloudRain" ? CloudRain : Waves}
            min={sound.min}
            max={sound.max}
            volume={sound.volume}
            setVolume={(volume) => setVolume(idx, volume)}
            isPlaying={sound.isPlaying}
            start={() => handleStart(idx)}
            stop={() => stopSound(idx)}
            className={sound.key === 'ocean' ? 'mb-2' : ''}
          />
        ))}
      </div>
      <div className="w-full flex justify-center mt-6">
        <button
          className="text-[var(--accent-primary)] font-semibold hover:opacity-80 transition"
          onClick={() => window.open('https://music4study.vercel.app/', '_blank', 'noopener,noreferrer')}
          type="button"
        >
          More Sounds
        </button>
      </div>
    </div>
  );
}
