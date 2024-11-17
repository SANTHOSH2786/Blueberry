'use client'

import { useState } from 'react'

export default function Home() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Make the API call to your chatbot API
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Log the raw response for debugging
    const textResponse = await res.text()
    console.log('Raw Response:', textResponse)

    // Parse the response as JSON
    try {
      const data = JSON.parse(textResponse)
      setResponse(data?.response || 'No response')
    } catch (error) {
      console.error('Failed to parse JSON:', error)
      setResponse('Failed to get a valid response')
    }
  }

  return (
    <main>
      <h1>AI Chatbot</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything"
        />
        <button type="submit">Send</button>
      </form>
      <p>{response}</p>
    </main>
  )
}
