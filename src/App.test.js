import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Deepgram TTS controls', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /text to speech experiment/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/text to speak/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/voice/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /speak/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save audio/i })).toBeInTheDocument();
});
