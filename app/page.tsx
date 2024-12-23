'use client';

import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaPaperclip, FaPlay, FaStop } from 'react-icons/fa';

export default function Home() {
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [audioPlaying, setAudioPlaying] = useState<any>(null);
  const [utterances, setUtterances] = useState<SpeechSynthesisUtterance[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reference for auto-scrolling to latest message
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  // Handle text input change (supports multiline)
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle form submission (sending the message to API)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true); // Show loading state

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
        headers: { 'Content-Type': 'application/json' },
      });

      const textResponse = await res.text();
      console.log('Raw Response:', textResponse);

      const data = JSON.parse(textResponse);
      const formattedResponse = formatResponse(data?.response || 'No response');

      setResponses((prev) => [
        ...prev,
        { text: data?.response, formatted: formattedResponse },
      ]);
    } catch (error) {
      console.error('Error fetching response:', error);
      setResponses((prev) => [
        ...prev,
        { text: 'Failed to get a valid response', formatted: 'Failed to get a valid response' },
      ]);
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  // Format the response text with headings, bullet points, and tables
  const formatResponse = (text: string) => {
    return text
      .replace(/##\s(.*?)\n/g, '<h2>$1</h2>') // Headings
      .replace(/###\s(.*?)\n/g, '<h3>$1</h3>') // Subheadings
      .replace(/\*\s(.*?)\n/g, '<ul><li>$1</li></ul>') // Bullet points
      .replace(/\|.*\|.*\|/g, (table: string) => {
        return `<table>${table
          .split('\n')
          .map(row => `<tr><td>${row.split('|').join('</td><td>')}</td></tr>`)
          .join('')}</table>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
      .replace(/```([\s\S]+)```/g, '<pre><code>$1</code></pre>'); // Multiline code block
  };

  // Handle voice input using SpeechRecognition API
  const startListening = () => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      speechSynthesis.pause();
      setAudioPlaying(null);
    } else {
      if (audioPlaying !== null) {
        speechSynthesis.pause();
      }

      if (selectedUtterance) {
        speechSynthesis.speak(selectedUtterance);
        setAudioPlaying(index);

        selectedUtterance.onend = () => setAudioPlaying(null);
      }
    }
  };

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser');
    }
  }, []);

  useEffect(() => {
    // Set up utterances for each response
    const newUtterances = responses.map((response) => {
      const utterance = new SpeechSynthesisUtterance(response.text);
      utterance.lang = 'en-US';
      return utterance;
    });
    setUtterances(newUtterances);
  }, [responses]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight); // Scroll to latest message
  }, [responses]);

  return (
    <main className="container">
      <h1>BLUEBERRY</h1>
      <div className="chat-container">
        <div className="chat-box" ref={chatBoxRef}>
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
      </div>

      {/* Input and control buttons */}
      <form className="input-container" onSubmit={handleSubmit}>
        {loading && <div className="loading-spinner">Loading...</div>}
        <div className="input-group">
          <FaPaperclip className="icon attach-icon" />
          <textarea
            value={message}
            onChange={handleChange}
            placeholder="Ask me anything"
            className="text-input"
            rows={5} // Slightly larger textbox
          />
          <FaMicrophone
            className={`icon mic-icon ${isListening ? 'listening' : ''}`}
            onClick={startListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          />
        </div>
        <button type="submit" className="send-button">Send</button>
      </form>
    </main>
  );
}
