import { useCallback, useRef, useState } from 'react';
import './App.css';

const DEFAULT_MESSAGE = 'This is a text to speech experiment.';
const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';

const DEEPGRAM_MODELS = [
  { value: 'aura-2-thalia-en',    label: 'Thalia — Aura 2 (EN, female)' },
  { value: 'aura-2-andromeda-en', label: 'Andromeda — Aura 2 (EN, female)' },
  { value: 'aura-2-helena-en',    label: 'Helena — Aura 2 (EN, female)' },
  { value: 'aura-2-apollo-en',    label: 'Apollo — Aura 2 (EN, male)' },
  { value: 'aura-2-aries-en',     label: 'Aries — Aura 2 (EN, male)' },
  { value: 'aura-asteria-en',     label: 'Asteria — Aura (EN, female)' },
  { value: 'aura-luna-en',        label: 'Luna — Aura (EN, female)' },
  { value: 'aura-stella-en',      label: 'Stella — Aura (EN, female)' },
  { value: 'aura-athena-en',      label: 'Athena — Aura (EN, female)' },
  { value: 'aura-hera-en',        label: 'Hera — Aura (EN, female)' },
  { value: 'aura-orion-en',       label: 'Orion — Aura (EN, male)' },
  { value: 'aura-arcas-en',       label: 'Arcas — Aura (EN, male)' },
  { value: 'aura-perseus-en',     label: 'Perseus — Aura (EN, male)' },
  { value: 'aura-orpheus-en',     label: 'Orpheus — Aura (EN, male)' },
  { value: 'aura-helios-en',      label: 'Helios — Aura (EN, male)' },
  { value: 'aura-zeus-en',        label: 'Zeus — Aura (EN, male)' },
];

function App() {
  const [textToSpeak, setTextToSpeak] = useState(DEFAULT_MESSAGE);
  const [status, setStatus] = useState('Ready. Click Speak to hear the text.');
  const [selectedModel, setSelectedModel] = useState('aura-2-thalia-en');
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsSpeaking(false);
    setStatus('Speech stopped.');
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setStatus('Speech paused.');
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setStatus('Speaking...');
    }
  }, []);

  const speakMessage = useCallback(async () => {
    const phrase = textToSpeak.trim();
    if (!phrase) {
      setStatus('Enter text before speaking.');
      return;
    }

    stopSpeaking();
    setIsSpeaking(true);
    setStatus('Generating speech...');

    try {
      const response = await fetch(
          `${PROXY_URL}/speak?model=${encodeURIComponent(selectedModel)}&encoding=mp3`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: phrase }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
          setStatus(`Deepgram error ${response.status}: ${errorText}`);
        setIsSpeaking(false);
        return;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audio.volume = volume;
      audioRef.current = audio;

      audio.onplay = () => setStatus('Speaking...');
      audio.onended = () => {
        setStatus('Finished speaking.');
        setIsSpeaking(false);
        URL.revokeObjectURL(blobUrl);
        blobUrlRef.current = null;
        audioRef.current = null;
      };
      audio.onerror = () => {
        setStatus('Audio playback failed.');
        setIsSpeaking(false);
      };

      await audio.play();
    } catch (err) {
      setStatus(`Request failed: ${err.message}`);
      setIsSpeaking(false);
    }
  }, [selectedModel, stopSpeaking, textToSpeak, volume]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Text To Speech Experiment</h1>
        <label className="text-label" htmlFor="tts-input">
          Text to speak
        </label>
        <textarea
          id="tts-input"
          className="text-input"
          value={textToSpeak}
          onChange={(event) => setTextToSpeak(event.target.value)}
          rows={3}
        />
        <label className="text-label" htmlFor="voice-select">
          Voice
        </label>
        <select
          id="voice-select"
          className="voice-select"
          value={selectedModel}
          onChange={(event) => setSelectedModel(event.target.value)}
        >
          {DEEPGRAM_MODELS.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
        <div className="control-grid">
          <label className="control-item" htmlFor="volume-input">
            <span>Volume (0 to 1)</span>
            <input
              id="volume-input"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(event) => {
                const next = Number(event.target.value);
                setVolume(next);
                if (audioRef.current) {
                  audioRef.current.volume = next;
                }
              }}
            />
            <output>{volume.toFixed(1)}</output>
          </label>
        </div>
        <div className="button-row">
          <button type="button" onClick={speakMessage} disabled={isSpeaking}>
            Speak
          </button>
          <button type="button" onClick={pauseSpeaking}>
            Pause
          </button>
          <button type="button" onClick={resumeSpeaking}>
            Resume
          </button>
          <button type="button" onClick={stopSpeaking}>
            Stop
          </button>
        </div>
        <p aria-live="polite">{status}</p>
      </header>
    </div>
  );
}

export default App;
