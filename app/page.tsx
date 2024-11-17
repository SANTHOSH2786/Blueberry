'use client';

import { useState, useEffect } from 'react';
import { FaMicrophone, FaPaperclip, FaPlay, FaStop } from 'react-icons/fa';

export default function Home() {
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [audioPlaying, setAudioPlaying] = useState<any>(null); // Track currently playing audio
  const [utterances, setUtterances] = useState<SpeechSynthesisUtterance[]>([]);
  const [isListening, setIsListening] = useState(false); // Track listening state

  // Handle text input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  // Handle form submission (sending the message to API)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' },
    });

    const textResponse = await res.text();
    console.log('Raw Response:', textResponse);

    try {
      const data = JSON.parse(textResponse);
      const formattedResponse = formatResponse(data?.response || 'No response');
      
      setResponses(prev => [
        ...prev,
        { text: data?.response, formatted: formattedResponse },
      ]);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      setResponses(prev => [
        ...prev,
        { text: 'Failed to get a valid response', formatted: 'Failed to get a valid response' },
      ]);
    }
  };

  // Format the response text with headings, bullet points, and tables
  const formatResponse = (text: string) => {
    return text
      .replace(/##\s(.*?)\n/g, '<h3>$1</h3>') // Headings
      .replace(/\*\s(.*?)\n/g, '<ul><li>$1</li></ul>') // Bullet points
      .replace(/\|.*\|.*\|/g, (table: string) => {
        return `<table>${table
          .split('\n')
          .map(row => `<tr><td>${row.split('|').join('</td><td>')}</td></tr>`)
          .join('')}</table>`;
      });
  };

  // Handle voice input using SpeechRecognition API
  const startListening = () => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
      };

      recognition.start();
    } else {
      alert('Speech Recognition is not supported in this browser');
    }
  };

  // Play/Stop the audio for specific response
  const handleAudioControl = (index: number) => {
    const selectedUtterance = utterances[index];

    if (audioPlaying === index) {
      // Stop the audio if the same response is clicked
      speechSynthesis.pause();
      setAudioPlaying(null);
    } else {
      // Stop the previous audio if playing
      if (audioPlaying !== null) {
        speechSynthesis.pause();
      }

      // Play the new selected audio
      if (selectedUtterance) {
        speechSynthesis.speak(selectedUtterance);
        setAudioPlaying(index);

        // Stop audio once it's finished
        selectedUtterance.onend = () => setAudioPlaying(null);
      }
    }
  };

  useEffect(() => {
    // Set up utterances for each response
    const newUtterances = responses.map(response => {
      const utterance = new SpeechSynthesisUtterance(response.text);
      utterance.lang = 'en-US';
      return utterance;
    });
    setUtterances(newUtterances);
  }, [responses]);

  return (
    <main className="container">
      <h1>BLUEBERRY</h1>
      <div className="chat-container">
        <div className="chat-box">
          {responses.map((response, index) => (
            <div key={index} className="response-item">
              <div
                className="response-text"
                dangerouslySetInnerHTML={{ __html: response.formatted }}
              />
              <div className="audio-control">
                {audioPlaying === index ? (
                  <FaStop className="audio-icon" onClick={() => handleAudioControl(index)} />
                ) : (
                  <FaPlay className="audio-icon" onClick={() => handleAudioControl(index)} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input and control buttons */}
        <form className="input-container" onSubmit={handleSubmit}>
          <div className="input-group">
            <FaPaperclip className="icon attach-icon" />
            <input
              type="text"
              value={message}
              onChange={handleChange}
              placeholder="Ask me anything"
              className="text-input"
            />
            <FaMicrophone
              className={`icon mic-icon ${isListening ? 'listening' : ''}`}
              onClick={startListening}
            />
          </div>
          <button type="submit" className="send-button">Send</button>
        </form>
      </div>
    </main>
  );
}
