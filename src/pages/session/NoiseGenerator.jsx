import { AudioLines, Cloud, CloudRain, MoreVertical, Pause, Play, SquareArrowOutUpRight, Waves } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

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
function SoundControl({ label, icon: Icon, volume, setVolume, isPlaying, start, stop, className, max }) {
  return (
    <div className={`bar ${className || ''}`}>
      <label className="noisegentitle flex items-center gap-2 mb-1">
        <Icon size={22} className="text-[var(--text-primary)]" />
        <span className="card-text font-medium text-[var(--text-primary)] text-base sm:text-md">{label}</span>
      </label>
      <div className="slider flex items-center gap-3 mb-2">
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
          min={0}
          max={max}
          step={0.01}
          value={volume}
          onChange={value => setVolume(value)}
          renderThumb={(props, state) => {
            const { key, ...rest } = props;
            return <div key={key} {...rest} />;
          }}
        />
        <span className="w-10 text-xs text-[var(--text-secondary)] text-right select-none">{Math.round((volume / max) * 100)}%</span>
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

function NoiseSettingsModal({ isOpen, onClose, sounds, setVolume, maxVolumes, setMaxVolumes }) {
  // Track selected preset per sound (default to 'Default')
  const [selectedPresets, setSelectedPresets] = useState([0, 0, 0]);
  const modalRef = useRef(null);
  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  // Presets for each sound type
  const brownPresets = [
    { label: 'Default', filterFreq: 200 },
    { label: 'Deep', filterFreq: 60 },
    { label: 'Balanced', filterFreq: 200 },
    { label: 'Bright', filterFreq: 400 }
  ];
  const rainPresets = [
    { label: 'Default', highpass: 200, lowpass: 1500, reverbWet: 0.2 },
    { label: 'Soft', highpass: 100, lowpass: 1000, reverbWet: 0.1 },
    { label: 'Medium', highpass: 200, lowpass: 1500, reverbWet: 0.2 },
    { label: 'Heavy', highpass: 300, lowpass: 2000, reverbWet: 0.4 }
  ];
  const oceanPresets = [
    { label: 'Default', pinkHigh: 200, pinkLow: 1200, reverbWet: 0.4, waveLfoFreq: 0.1 },
    { label: 'Calm', pinkHigh: 100, pinkLow: 800, reverbWet: 0.2, waveLfoFreq: 0.04 },
    { label: 'Waves', pinkHigh: 200, pinkLow: 1200, reverbWet: 0.4, waveLfoFreq: 0.1 },
    { label: 'Storm', pinkHigh: 400, pinkLow: 1800, reverbWet: 0.7, waveLfoFreq: 0.2 }
  ];
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
      <div ref={modalRef} className="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-lg shadow-xl border border-[var(--border-primary)] relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Close settings"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Noise Generator Settings</h2>
        <div className="space-y-6">
          {sounds.map((sound, idx) => {
            let presets = [];
            let onPreset = () => {};
            if (sound.key === 'brown') {
              presets = brownPresets;
              onPreset = (preset) => {
                if (sound.soundRef && sound.soundRef.filter) {
                  sound.soundRef.filter.frequency.value = preset.filterFreq;
                }
              };
            } else if (sound.key === 'rain') {
              presets = rainPresets;
              onPreset = (preset) => {
                if (sound.soundRef) {
                  if (sound.soundRef.highpass) sound.soundRef.highpass.frequency.value = preset.highpass;
                  if (sound.soundRef.lowpass) sound.soundRef.lowpass.frequency.value = preset.lowpass;
                  if (sound.soundRef.reverb) sound.soundRef.reverb.wet.value = preset.reverbWet;
                }
              };
            } else if (sound.key === 'ocean') {
              presets = oceanPresets;
              onPreset = (preset) => {
                if (sound.soundRef) {
                  if (sound.soundRef.pinkHighpass) sound.soundRef.pinkHighpass.frequency.value = preset.pinkHigh;
                  if (sound.soundRef.pinkLowpass) sound.soundRef.pinkLowpass.frequency.value = preset.pinkLow;
                  if (sound.soundRef.reverb) sound.soundRef.reverb.wet.value = preset.reverbWet;
                  if (sound.soundRef.waveLFO && preset.waveLfoFreq) sound.soundRef.waveLFO.frequency.value = preset.waveLfoFreq;
                }
              };
            }
            return (
              <div key={sound.key} className="mb-4 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 mb-2">
                  {sound.icon === "Cloud" ? <Cloud size={22} /> : sound.icon === "CloudRain" ? <CloudRain size={22} /> : <Waves size={22} />}
                  <span className="font-semibold text-[var(--text-primary)]">{sound.label}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[var(--text-secondary)]">Max Volume:</span>
                  <input
                    type="number"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={maxVolumes[idx]}
                    onChange={e => {
                      const value = parseFloat(e.target.value);
                      setMaxVolumes(vols => vols.map((v, i) => (i === idx ? value : v)));
                      if (sounds[idx].volume > value) setVolume(idx, value);
                    }}
                    className="w-16 px-2 py-1 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  {presets.map((preset, pIdx) => (
                    <button
                      key={preset.label}
                      className={
                        `px-2 py-1 rounded border text-xs transition ` +
                        (selectedPresets[idx] === pIdx
                          ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-white')
                      }
                      onClick={() => {
                        onPreset(preset);
                        setSelectedPresets(sel => sel.map((v, i) => i === idx ? pIdx : v));
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function NoiseGenerator() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { sounds, startSound, stopSound, setVolume, isInitialized, initializeAudio } = useNoise();
  // Default max volumes: 2 for brown, 4 for rain, 4 for ocean
  const [maxVolumes, setMaxVolumes] = useState(() => {
    const saved = localStorage.getItem('noiseMaxVolumes');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === 3) return arr;
      } catch {}
    }
    return [2, 4, 4];
  });

  // Save maxVolumes to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('noiseMaxVolumes', JSON.stringify(maxVolumes));
  }, [maxVolumes]);
  // Example presets for each sound (could be customized per sound)
  const defaultPresets = [
    { label: 'Focus', value: 0.7 },
    { label: 'Relax', value: 0.4 },
    { label: 'Energize', value: 1.0 },
  ];

  const handleStart = async (index) => {
    if (!isInitialized) {
      await initializeAudio();
    }
    startSound(index);
  };

  const handleSetMaxVolume = (idx, value) => {
    setMaxVolumes(vols => vols.map((v, i) => (i === idx ? value : v)));
    // Optionally, clamp the current volume if above new max
    if (sounds[idx].volume > value) {
      setVolume(idx, value);
    }
  };

  return (
    <div className="w-full">
      <div className="section-title justify-center mb-4 relative">
        <AudioLines size={22} className="icon" />
        <span>Noise Generator</span>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Noise generator settings"
        >
          <MoreVertical size={20} />
        </button>
      </div>
      <div className="space-y-6 w-full">
        {sounds.map((sound, idx) => (
          <SoundControl
            key={sound.key}
            label={sound.label}
            icon={sound.icon === "Cloud" ? Cloud : sound.icon === "CloudRain" ? CloudRain : Waves}
            volume={sound.volume}
            setVolume={(volume) => setVolume(idx, volume)}
            isPlaying={sound.isPlaying}
            start={() => handleStart(idx)}
            stop={() => stopSound(idx)}
            className={sound.key === 'ocean' ? 'mb-2' : ''}
            max={maxVolumes[idx]}
          />
        ))}
      </div>
      <div className="w-full flex justify-center mt-6">
        <button
          className="text-[var(--accent-primary)] font-semibold hover:opacity-80 transition"
          onClick={() => window.open('https://music4study.vercel.app/', '_blank', 'noopener,noreferrer')}
          type="button"
        >
          More Sounds <SquareArrowOutUpRight className="inline ml-2" size={18} />
        </button>
      </div>
      <NoiseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        sounds={sounds}
        setVolume={setVolume}
        maxVolumes={maxVolumes}
        setMaxVolumes={setMaxVolumes}
      />
    </div>
  );
}
