import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const DEFAULT_MESSAGE = 'This is a text to speech experiment.';

function App() {
  const [textToSpeak, setTextToSpeak] = useState(DEFAULT_MESSAGE);
  const [status, setStatus] = useState('Ready. Click Speak to hear the text.');
  const [voices, setVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const utteranceIdRef = useRef(0);
  const supportsSpeechRef = useRef(false);

  const availableLanguages = Array.from(new Set(voices.map((voice) => voice.lang))).sort();

  const speakMessage = useCallback(() => {
    if (typeof window === 'undefined') {
      setStatus('Speech is unavailable in this environment.');
      return;
    }

    if (!supportsSpeechRef.current) {
      setStatus('No speech API is available in this browser context.');
      return;
    }

    const phrase = textToSpeak.trim();
    if (!phrase) {
      setStatus('Enter text before speaking.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new window.SpeechSynthesisUtterance(phrase);
    const utteranceId = utteranceIdRef.current + 1;
    utteranceIdRef.current = utteranceId;

    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    if (selectedVoiceUri) {
      const voice = voices.find((item) => item.voiceURI === selectedVoiceUri);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      if (utteranceId !== utteranceIdRef.current) {
        return;
      }

      setStatus('Speaking...');
    };

    utterance.onend = () => {
      if (utteranceId !== utteranceIdRef.current) {
        return;
      }

      setStatus('Finished speaking.');
    };

    utterance.onerror = (event) => {
      if (utteranceId !== utteranceIdRef.current) {
        return;
      }

      if (event.error === 'not-allowed') {
        setStatus('Speech was blocked. Click Speak again after interacting with the page.');
        return;
      }

      if (event.error === 'interrupted' || event.error === 'canceled') {
        setStatus('Speech was interrupted.');
        return;
      }

      setStatus(`Speech failed: ${event.error}.`);
    };

    window.speechSynthesis.speak(utterance);
  }, [language, pitch, rate, selectedVoiceUri, textToSpeak, voices, volume]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setStatus('Speech is unavailable in this environment.');
      return undefined;
    }

    if (
      typeof window.speechSynthesis === 'undefined' ||
      typeof window.SpeechSynthesisUtterance === 'undefined'
    ) {
      setStatus('No speech API is available in this browser context.');
      return undefined;
    }

    supportsSpeechRef.current = true;

    const nextLanguage = navigator.language || 'en-US';
    setLanguage(nextLanguage);

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (!availableVoices.length) {
        return;
      }

      setSelectedVoiceUri((currentVoiceUri) => {
        if (currentVoiceUri && availableVoices.some((item) => item.voiceURI === currentVoiceUri)) {
          return currentVoiceUri;
        }

        const languageMatch = availableVoices.find((item) => item.lang === nextLanguage);
        return (languageMatch || availableVoices[0]).voiceURI;
      });
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!supportsSpeechRef.current) {
      return;
    }

    window.speechSynthesis.cancel();
    setStatus('Speech stopped.');
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (!supportsSpeechRef.current) {
      return;
    }

    window.speechSynthesis.pause();
    setStatus('Speech paused.');
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (!supportsSpeechRef.current) {
      return;
    }

    window.speechSynthesis.resume();
    setStatus('Speech resumed.');
  }, []);

  const handleLanguageChange = useCallback(
    (nextLanguage) => {
      setLanguage(nextLanguage);

      if (!voices.length) {
        return;
      }

      const matchingVoice = voices.find((voice) => voice.lang === nextLanguage);
      if (matchingVoice) {
        setSelectedVoiceUri(matchingVoice.voiceURI);
      }
    },
    [voices]
  );

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
          value={selectedVoiceUri}
          onChange={(event) => {
            const nextVoiceUri = event.target.value;
            setSelectedVoiceUri(nextVoiceUri);

            const selectedVoice = voices.find((voice) => voice.voiceURI === nextVoiceUri);
            if (selectedVoice) {
              setLanguage(selectedVoice.lang);
            }
          }}
        >
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <label className="text-label" htmlFor="lang-select">
          Language
        </label>
        <select
          id="lang-select"
          className="voice-select"
          value={language}
          onChange={(event) => handleLanguageChange(event.target.value)}
        >
          {[language, ...availableLanguages]
            .filter((lang, index, source) => lang && source.indexOf(lang) === index)
            .map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
        </select>
        <div className="control-grid">
          <label className="control-item" htmlFor="rate-input">
            <span>Rate (0.1 to 10)</span>
            <input
              id="rate-input"
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
            <output>{rate.toFixed(1)}</output>
          </label>
          <label className="control-item" htmlFor="pitch-input">
            <span>Pitch (0 to 2)</span>
            <input
              id="pitch-input"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(event) => setPitch(Number(event.target.value))}
            />
            <output>{pitch.toFixed(1)}</output>
          </label>
          <label className="control-item" htmlFor="volume-input">
            <span>Volume (0 to 1)</span>
            <input
              id="volume-input"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
            <output>{volume.toFixed(1)}</output>
          </label>
        </div>
        <div className="button-row">
          <button type="button" onClick={speakMessage}>
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
