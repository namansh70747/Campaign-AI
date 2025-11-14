import React, { useState, useEffect, useRef } from 'react'

export default function Control() {
  // Product Pitch State
  const [productName, setProductName] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [pitchLoading, setPitchLoading] = useState(false)
  const [pitchError, setPitchError] = useState('')
  const [copied, setCopied] = useState(false)

  // Phone Call State
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneMessage, setPhoneMessage] = useState('')

  // Vapi Voice Assistant State
  const [vapiReady, setVapiReady] = useState(false)
  const [callActive, setCallActive] = useState(false)
  const vapiRef = useRef(null)
  const [transcript, setTranscript] = useState('')
  const [currentCallId, setCurrentCallId] = useState(null)

  // Initialize Vapi SDK
  useEffect(() => {
    // Load Vapi SDK script
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js'
    script.defer = true
    script.async = true
    script.onload = () => {
      console.log('Vapi SDK loaded')
      setVapiReady(true)
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // Handle Generate Pitch
  const handleGeneratePitch = async () => {
    if (!productName || !productUrl) {
      setPitchError('Please enter both product name and URL')
      return
    }

    setPitchLoading(true)
    setPitchError('')
    setSystemPrompt('')

    try {
      const response = await fetch('http://localhost:8003/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          product_url: productUrl,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSystemPrompt(data.system_prompt)
        setPitchError('')
      } else {
        const error = await response.json()
        setPitchError(`Failed: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setPitchError(`Error: ${error.message}`)
    }

    setPitchLoading(false)
  }

  // Handle Copy to Clipboard
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle Phone Call
  const handleStartCall = async () => {
    // Normalize Indian phone numbers
    let normalizedNumber = phoneNumber.replace(/\s/g, '').replace(/[-()]/g, '')
    
    if (!normalizedNumber) {
      setPhoneMessage('Please enter a phone number')
      return
    }

    // Add +91 if it's a 10-digit Indian number
    if (normalizedNumber.length === 10) {
      normalizedNumber = '+91' + normalizedNumber
    }

    setPhoneLoading(true)
    setPhoneMessage('Starting phone call to marketing assistant...')

    try {
      const response = await fetch('http://localhost:8002/start-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: normalizedNumber })
      })

      if (response.ok) {
        const data = await response.json()
        setPhoneMessage(`Call initiated! Call ID: ${data.id || 'Processing...'}`)
        setPhoneNumber('')
      } else {
        const error = await response.json()
        setPhoneMessage(`Failed: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setPhoneMessage(`Error: ${error.message}`)
    }

    setPhoneLoading(false)
  }

  // Handle Vapi Voice Assistant
  const handleStartVapiCall = async () => {
    if (!vapiReady) {
      alert('Vapi SDK is still loading. Please try again.')
      return
    }

    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_VAPI_API_KEY
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID

      if (!apiKey || !assistantId) {
        alert('Vapi credentials not found. Please set VITE_VAPI_API_KEY and VITE_VAPI_ASSISTANT_ID in .env')
        return
      }

      // Initialize Vapi
      if (window.vapiSDK) {
        vapiRef.current = window.vapiSDK.run({
          apiKey: apiKey,
          assistant: assistantId,
          config: {
            buttonConfig: {
              offText: 'End Call',
              onText: 'Start Call'
            }
          }
        })

        // Listen to events
        if (vapiRef.current) {
          vapiRef.current.on('call-start', (call) => {
            console.log('Vapi call started with ID:', call.id)
            setCurrentCallId(call.id)
            setCallActive(true)
            setTranscript('Call started...\n')
          })

          vapiRef.current.on('call-end', async () => {
            console.log('Vapi call ended')
            setCallActive(false)
            setTranscript(prev => prev + '\nCall ended')

            // Fetch full call logs from Vapi API
            if (currentCallId) {
              console.log(`Fetching logs for call ID: ${currentCallId}`)
              try {
                // Get the API key
                const apiKey = import.meta.env.VITE_VAPI_API_KEY
              
                const response = await fetch(`https://api.vapi.ai/call/${currentCallId}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${apiKey}`
                  }
                })

                if (response.ok) {
                  const callLogs = await response.json()
                  console.log('--- FULL CALL LOG ---', callLogs)
                  
                  // Send logs to your server at port 8004
                  try {
                    const serverResponse = await fetch('http://localhost:8004/call-logs', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        callId: currentCallId,
                        logs: callLogs,
                        timestamp: new Date().toISOString()
                      })
                    })

                    if (serverResponse.ok) {
                      console.log('Call logs successfully sent to server')
                      setTranscript(prev => prev + '\nCall logs saved to server')
                    } else {
                      console.error('Failed to send logs to server:', await serverResponse.text())
                      setTranscript(prev => prev + '\nWarning: Failed to save logs to server')
                    }
                  } catch (serverError) {
                    console.error('Error sending logs to server:', serverError)
                    setTranscript(prev => prev + '\nWarning: Could not connect to log server')
                  }
                } else {
                  console.error('Failed to fetch call logs:', await response.text())
                }
              } catch (error) {
                console.error('Error fetching call logs:', error)
              }
              setCurrentCallId(null) // Reset for the next call
            }
          })

          vapiRef.current.on('message', (message) => {
            console.log('Vapi message:', message)
            if (message.type === 'transcript') {
              setTranscript(prev => prev + `\n${message.role === 'user' ? 'You' : 'Assistant'}: ${message.transcript}`)
            }
            if (message.type === 'function-call') {
              console.log('Function called:', message.functionCall)
            }
          })

          vapiRef.current.on('error', (error) => {
            console.error('Vapi error:', error)
            setTranscript(prev => prev + `\nError: ${error}`)
          })
        }
      } else {
        alert('Vapi SDK failed to load')
      }
    } catch (error) {
      console.error('Error initializing Vapi:', error)
      alert(`Error: ${error.message}`)
    }
  }

  // Handle End Call
  const handleEndCall = () => {
    if (vapiRef.current && callActive) {
      vapiRef.current.stop()
      setCallActive(false)
    }
  }

  // Handle Clear Transcript
  const handleClearTranscript = () => {
    setTranscript('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">AI Voice Agent Control</h1>
        <p className="text-xl text-gray-300 mb-12 text-center">Generate Custom Pitches & Test Your Voice Assistant</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step 1: Generate Pitch Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-white">Step 1: Generate Your Custom Pitch</h2>
              </div>
              <p className="text-gray-300 text-sm">Enter your product details to generate a custom AI assistant pitch</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Product Name (e.g., Chroma)"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                disabled={pitchLoading}
              />
              <input
                type="url"
                placeholder="Product URL (e.g., https://www.trychroma.com)"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                disabled={pitchLoading}
              />
            </div>

            <button
              onClick={handleGeneratePitch}
              className={`w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6 ${pitchLoading ? 'animate-pulse' : ''}`}
              disabled={pitchLoading}
            >
              {pitchLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Generating Pitch...
                </>
              ) : (
                'Generate System Prompt'
              )}
            </button>

            {pitchError && (
              <div className="p-4 rounded-lg bg-red-500/20 text-red-200 border border-red-500/50 mb-6">
                {pitchError}
              </div>
            )}

            {systemPrompt && (
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg border border-white/10 overflow-hidden">
                  <div className="flex justify-between items-center p-3 bg-white/5 border-b border-white/10">
                    <h4 className="text-white font-semibold">Generated System Prompt</h4>
                    <button
                      onClick={handleCopyPrompt}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded transition-colors text-sm flex items-center gap-2"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <pre className="text-gray-200 text-sm whitespace-pre-wrap font-mono">{systemPrompt}</pre>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                  <h4 className="text-yellow-200 font-bold text-lg mb-4 flex items-center gap-2">
                    Setup Instructions for Vapi Dashboard
                  </h4>
                  <ol className="space-y-3 text-yellow-100">
                    <li className="flex gap-3">
                      <span className="font-bold text-yellow-300">1.</span>
                      <span>Go to your <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">Vapi Dashboard</a></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-yellow-300">2.</span>
                      <span>Navigate to your Assistant settings</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-yellow-300">3.</span>
                      <span>Paste the generated System Prompt above into the "Pitching Prompt" or "System Prompt" field</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-yellow-300">4.</span>
                      <span>Save your assistant and test it using the demo call below!</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Phone Call Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white">Step 2: Make Phone Call</h2>
              </div>
              <p className="text-gray-300 text-sm">Call a real phone number with your AI assistant</p>
            </div>

            <div className="space-y-4">
              <input
                type="tel"
                placeholder="Phone number (e.g., +1234567890)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                disabled={phoneLoading}
              />

              <button
                onClick={handleStartCall}
                className={`w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${phoneLoading ? 'animate-pulse' : ''}`}
                disabled={phoneLoading}
              >
                {phoneLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Dialing...
                  </>
                ) : (
                  'Start Phone Call'
                )}
              </button>

              {phoneMessage && (
                <div className={`p-4 rounded-lg ${phoneMessage.includes('Call initiated') ? 'bg-green-500/20 text-green-200 border border-green-500/50' : phoneMessage.includes('Starting') ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50' : 'bg-red-500/20 text-red-200 border border-red-500/50'}`}>
                  {phoneMessage}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Demo Call Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white">Step 3: Try Demo Call</h2>
              </div>
              <p className="text-gray-300 text-sm">Test your AI assistant in your browser</p>
            </div>

            <div className="space-y-4">
              {/* Call Status Indicator */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${callActive ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-500/20 border border-gray-500/50'}`}>
                <div className={`w-3 h-3 rounded-full ${callActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <div className="text-white font-medium">
                  {!vapiReady ? 'Loading SDK...' : callActive ? 'Call Active' : 'Ready to Call'}
                </div>
              </div>

              {/* Demo Button Controls */}
              <div className="flex gap-3">
                {!callActive ? (
                  <button
                    onClick={handleStartVapiCall}
                    className={`w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    disabled={!vapiReady}
                  >
                    {!vapiReady ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Loading...
                      </>
                    ) : (
                      'Start Demo'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    End Call
                  </button>
                )}
              </div>

              {/* Info Messages */}
              {!vapiReady && (
                <div className="p-4 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-500/50 text-sm">
                  Loading Vapi SDK...
                </div>
              )}

              {vapiReady && !callActive && (
                <div className="p-4 rounded-lg bg-green-500/20 text-green-200 border border-green-500/50 text-sm">
                  Ready! Click "Start Demo" and allow microphone access
                </div>
              )}

              {callActive && (
                <div className="p-4 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-500/50 text-sm">
                  Listening... Speak clearly
                </div>
              )}

              {/* Transcript Section */}
              {transcript && (
                <div className="bg-black/30 rounded-lg overflow-hidden border border-white/10">
                  <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
                    <h4 className="text-white font-semibold text-sm">Live Transcript</h4>
                    <button
                      onClick={handleClearTranscript}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded transition-colors text-xs"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-3 space-y-2">
                      {transcript.split('\n').map((line, idx) => {
                        if (!line.trim()) return null
                        const isUser = line.includes('You:')
                        const isAssistant = line.includes('Assistant:')
                        return (
                          <div 
                            key={idx} 
                            className={`p-2 rounded text-xs ${isUser ? 'bg-blue-500/20 text-blue-200' : isAssistant ? 'bg-purple-500/20 text-purple-200' : 'bg-gray-500/20 text-gray-300'}`}
                          >
                            {line}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
