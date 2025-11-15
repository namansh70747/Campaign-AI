import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Control() {
  // Original Product Pitch Logic (preserved)
  const [productName, setProductName] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [pitchLoading, setPitchLoading] = useState(false)
  const [pitchError, setPitchError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPitchModal, setShowPitchModal] = useState(false)

  // Dialer / Phone Call Logic (preserved)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneMessage, setPhoneMessage] = useState('')

  // Vapi Voice Assistant Logic (preserved)
  const [vapiReady, setVapiReady] = useState(false)
  const [vapiError, setVapiError] = useState('')
  const [vapiEvents, setVapiEvents] = useState([]) // event log
  const [callActive, setCallActive] = useState(false) // Vapi demo call active
  const vapiRef = useRef(null)
  const [transcript, setTranscript] = useState('')
  const [currentCallId, setCurrentCallId] = useState(null)
  const [vapiButtonVisible, setVapiButtonVisible] = useState(false)
  const vapiButtonContainerRef = useRef(null)

  // Scan animation state from new UI
  const [scanAnimation, setScanAnimation] = useState(false)

  // Interval for scan bar
  useEffect(() => {
    const interval = setInterval(() => {
      setScanAnimation(true)
      setTimeout(() => setScanAnimation(false), 3000)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  // Load Vapi SDK script (original logic)
  // Environment variable pre-check
  useEffect(() => {
    const apiKey = import.meta.env.VITE_VAPI_API_KEY
    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID
    if (!apiKey || !assistantId) {
      setVapiError('Missing env vars: VITE_VAPI_API_KEY or VITE_VAPI_ASSISTANT_ID')
    }
  }, [])

  // Load SDK with fallback
  useEffect(() => {
    const primarySrc = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js'
    const fallbackSrc = 'https://unpkg.com/@vapi-ai/web@latest/dist/index.umd.js'
    const inject = (src, isFallback = false) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.vapiSDK) {
          console.log(`Vapi SDK loaded from ${isFallback ? 'fallback' : 'primary'} CDN`)
          setVapiReady(true)
          setVapiError('')
        }
      }
      script.onerror = () => {
        if (!isFallback) {
          console.warn('Primary CDN failed, attempting fallback...')
          inject(fallbackSrc, true)
        } else {
          setVapiError('Failed to load Vapi SDK from both CDNs.')
        }
      }
      document.head.appendChild(script)
      return script
    }
    const scriptEl = inject(primarySrc)
    const poll = setInterval(() => {
      if (window.vapiSDK) {
        setVapiReady(true)
        clearInterval(poll)
      }
    }, 500)
    const timeout = setTimeout(() => {
      clearInterval(poll)
      if (!window.vapiSDK && !vapiReady) setVapiError(prev => prev || 'Vapi SDK not available after timeout.')
    }, 12000)
    return () => {
      clearInterval(poll)
      clearTimeout(timeout)
      if (scriptEl && scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl)
    }
  }, [vapiReady])

  // Generate system prompt (original logic)
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
        body: JSON.stringify({ product_name: productName, product_url: productUrl })
      })
      if (response.ok) {
        const data = await response.json()
        setSystemPrompt(data.system_prompt)
        setShowPitchModal(true)
      } else {
        const error = await response.json()
        setPitchError(`Failed: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setPitchError(`Error: ${error.message}`)
    }
    setPitchLoading(false)
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Start phone call (original logic, integrated into dialer)
  const handleStartPhoneCall = async () => {
    if (!phoneNumber) return
    let normalizedNumber = phoneNumber.replace(/\s/g, '').replace(/[-()]/g, '')
    if (normalizedNumber.length === 10) normalizedNumber = '+91' + normalizedNumber
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
      } else {
        const error = await response.json()
        setPhoneMessage(`Failed: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setPhoneMessage(`Error: ${error.message}`)
    }
    setPhoneLoading(false)
  }

  // Start Vapi demo call (original logic)
  const handleStartVapiCall = async () => {
    if (!vapiReady) return
    try {
      const apiKey = import.meta.env.VITE_VAPI_API_KEY
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID
      if (!apiKey || !assistantId) {
        setVapiError('Missing Vapi credentials: set VITE_VAPI_API_KEY and VITE_VAPI_ASSISTANT_ID in .env')
        return
      }
      if (window.vapiSDK) {
        console.log('Initializing Vapi demo call...')
        vapiRef.current = window.vapiSDK.run({
          apiKey,
          assistant: assistantId,
          config: { buttonConfig: { offText: 'End Call', onText: 'Start Call' } }
        })
        if (vapiRef.current) {
          vapiRef.current.on('call-start', (call) => {
            console.log('Vapi call started with ID:', call.id)
            setVapiEvents(ev => [...ev, { t: Date.now(), e: 'call-start', id: call.id }])
            setCurrentCallId(call.id)
            setCallActive(true)
            setTranscript('Call started...\n')
          })
          vapiRef.current.on('call-end', async () => {
            console.log('Vapi call ended')
            setVapiEvents(ev => [...ev, { t: Date.now(), e: 'call-end', id: currentCallId }])
            setCallActive(false)
            setTranscript(prev => prev + '\nCall ended')
            if (currentCallId) {
              console.log(`Fetching logs for call ID: ${currentCallId}`)
              try {
                const apiKeyInner = import.meta.env.VITE_VAPI_API_KEY
                const response = await fetch(`https://api.vapi.ai/call/${currentCallId}`, {
                  method: 'GET',
                  headers: { Authorization: `Bearer ${apiKeyInner}` }
                })
                if (response.ok) {
                  const callLogs = await response.json()
                  console.log('--- FULL CALL LOG ---', callLogs)
                  try {
                    const serverResponse = await fetch('http://localhost:8004/call-logs', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ callId: currentCallId, logs: callLogs, timestamp: new Date().toISOString() })
                    })
                    if (serverResponse.ok) {
                      setTranscript(prev => prev + '\nCall logs saved to server')
                    } else {
                      setTranscript(prev => prev + '\nWarning: Failed to save logs to server')
                    }
                  } catch (serverError) {
                    console.error('Error sending logs to server:', serverError)
                    setTranscript(prev => prev + '\nWarning: Could not connect to log server')
                  }
                } else {
                  console.error('Failed to fetch call logs:', await response.text())
                }
              } catch (err) {
                console.error('Error fetching call logs:', err)
              }
              setCurrentCallId(null)
            }
          })
          vapiRef.current.on('message', (message) => {
            setVapiEvents(ev => [...ev, { t: Date.now(), e: message.type, role: message.role }])
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
            setVapiError(typeof error === 'string' ? error : 'Vapi runtime error occurred.')
            setVapiEvents(ev => [...ev, { t: Date.now(), e: 'error' }])
          })
        }
      } else {
        setVapiError('Vapi SDK global not found.')
      }
    } catch (error) {
      console.error('Error initializing Vapi:', error)
      setVapiError(error.message || 'Unknown initialization error')
    }
  }

  // End Vapi call (original logic)
  const handleEndVapiCall = () => {
    if (vapiRef.current && callActive) {
      vapiRef.current.stop()
      setCallActive(false)
    }
  }

  const handleClearTranscript = () => setTranscript('')

  // Digits for dial pad (adapted)
  const digits = [
    { n: '1', l: '' }, { n: '2', l: 'ABC' }, { n: '3', l: 'DEF' },
    { n: '4', l: 'GHI' }, { n: '5', l: 'JKL' }, { n: '6', l: 'MNO' },
    { n: '7', l: 'PQRS' }, { n: '8', l: 'TUV' }, { n: '9', l: 'WXYZ' },
    { n: '*', l: '' }, { n: '0', l: '+' }, { n: '#', l: '' }
  ]
  const handleDigit = (d) => setPhoneNumber(prev => prev + d)

  // Detect when Vapi's injected button appears and move it into phone container
  useEffect(() => {
    const checkVapiButton = setInterval(() => {
      const vapiBtn = document.querySelector('#vapi-support-btn, .vapi-btn')
      if (vapiBtn && vapiButtonContainerRef.current) {
        // Move the button into our container
        vapiButtonContainerRef.current.appendChild(vapiBtn)
        setVapiButtonVisible(true)
        clearInterval(checkVapiButton)
      }
    }, 100)
    return () => clearInterval(checkVapiButton)
  }, [])

  // Reset vapi button visibility when call ends
  useEffect(() => {
    if (!callActive && vapiRef.current) {
      // Small delay to check if button persists after call end
      const timer = setTimeout(() => {
        const vapiBtn = document.querySelector('#vapi-support-btn, .vapi-btn')
        setVapiButtonVisible(!!vapiBtn)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [callActive])

  // Unified dialer button content logic - hide only when Vapi button is visible
  const renderDialerButtonContent = () => {
    if (callActive) return 'End Demo Call'
    if (phoneLoading) return (<><span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Calling...</>)
    if (!phoneNumber) {
      // Keep button visible but transparent when Vapi's button is visible
      if (vapiButtonVisible) return 'Start Demo Call' // Keep text, opacity handled by className
      if (vapiError) return 'Retry Demo (SDK Error)'
      return (!vapiReady
        ? (<><span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading SDK...</>)
        : 'Start Demo Call')
    }
    return 'Call Now'
  }

  // Restore manual button click logic
  const handleDialerButtonClick = () => {
    if (callActive) return handleEndVapiCall()
    if (!phoneNumber) {
      if (vapiError) {
        setVapiError('')
        setVapiReady(false)
        const existing = document.querySelector('script[src*="VapiAI/html-script-tag"]')
        if (existing) existing.remove()
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js'
        script.defer = true
        script.async = true
        script.onload = () => { if (window.vapiSDK) setVapiReady(true) }
        script.onerror = () => setVapiError('Retry failed: script could not load.')
        document.head.appendChild(script)
        return
      }
      return handleStartVapiCall()
    }
    return handleStartPhoneCall()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Style Vapi's button to match our custom button */}
      <style>{`
        #vapi-support-btn{
          padding: 30px 10px !important;
          transform: translateY(-50px)!important;
        },
        .vapi-btn {
          padding: 2px;
          animation: none !important;
          width: 20% !important;
          height: 68px !important;
          border-radius: 24px !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          border: none !important;
          
        }
        #vapi-icon-container {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
      {/* Decorative gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 w-[44vw] h-[44vw] rounded-full z-0 opacity-[0.55]" style={{ background: 'radial-gradient(circle at 35% 30%, #FAF5FF, #D8B4FE 30%, #A855F7 60%, #7C3AED)' }} />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-[25%] w-[26vw] h-[26vw] rounded-full blur-[2px] z-0 opacity-[0.55]" style={{ background: 'radial-gradient(circle at 30% 30%, #F3E8FF, #C084FC 35%, #9333EA 65%, #7E22CE)' }} />
      <div aria-hidden className="pointer-events-none absolute left-[40%] -bottom-28 w-[22vw] h-[22vw] rounded-full z-0 opacity-[0.42]" style={{ background: 'radial-gradient(circle at 30% 30%, #E9D5FF, #A78BFA 40%, #7C3AED 70%, #5B21B6)' }} />

      <div className="relative z-10 max-w-7xl mx-auto py-16 px-4 flex justify-between items-center gap-8" style={{ minHeight: '860px' }}>
        {/* LEFT: 3D Pitch Form */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-[650px] relative" style={{ perspective: '1200px', minHeight: '800px' }}>
          <motion.div initial={{ rotateY: -15, rotateX: 5 }} animate={{ rotateY: -8, rotateX: 2 }} transition={{ type: 'spring', stiffness: 50, damping: 20 }} whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }} className="relative" style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 bg-slate-900/20 rounded-3xl blur-2xl" style={{ transform: 'translateZ(-50px) translateY(30px)' }} />
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200" style={{ transformStyle: 'preserve-3d', boxShadow: '0 40px 80px rgba(0,0,0,0.15), 0 20px 40px rgba(0,0,0,0.1)', minHeight: '800px', paddingBottom: '32px' }}>
              <div className="relative h-32 bg-linear-to-br from-purple-600 via-purple-500 to-indigo-600 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)]" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-white px-8">
                  <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold mb-2">Product Details</motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: 0.4 }} className="text-sm text-purple-100">Fill in your product information</motion.p>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl" />
              </div>
              <AnimatePresence>
                {scanAnimation && (
                  <motion.div initial={{ top: '32%', opacity: 0 }} animate={{ top: ['32%', '95%'], opacity: [0, 1, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 2.5, ease: [0.76, 0, 0.24, 1], times: [0, 0.1, 0.9, 1] }} className="absolute left-0 right-0 z-30 pointer-events-none">
                    <div className="relative h-1 mx-8">
                      <div className="absolute inset-0 bg-purple-300 rounded-full blur-md opacity-80" />
                      <div className="absolute inset-0 bg-purple-300 rounded-full blur-sm" />
                      <div className="absolute inset-0 bg-purple-200 rounded-full" />
                    </div>
                    <div className="absolute -top-8 left-0 right-0 h-16 bg-linear-to-b from-transparent via-purple-300/20 to-transparent" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="p-12 space-y-8 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Product Name</label>
                  <div className="relative group">
                    <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Enter your product name" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:shadow-lg focus:shadow-purple-500/10 group-hover:border-slate-300" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Product Link</label>
                  <div className="relative group">
                    <input type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://your-product-link.com" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:shadow-lg focus:shadow-purple-500/10 group-hover:border-slate-300" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </div>
                  </div>
                </motion.div>
                <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleGeneratePitch} disabled={!productName || !productUrl || pitchLoading} className="w-full py-4 bg-linear-to-r from-purple-500 to-violet-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">{pitchLoading ? 'Generating...' : 'Generate Pitch'}</motion.button>
                {pitchError && <div className="p-4 rounded-xl bg-red-500/10 text-red-600 text-sm border border-red-500/20">{pitchError}</div>}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />AI Powered</div>
                  <div className="w-px h-4 bg-slate-300" />
                  <div className="flex items-center gap-2 text-xs text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Secure</div>
                </div>
                {showPitchModal && systemPrompt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8 relative max-h-[80vh] overflow-hidden flex flex-col">
                      <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-2xl font-bold w-8 h-8 flex items-center justify-center" onClick={() => setShowPitchModal(false)} aria-label="Close">&times;</button>
                      <h2 className="text-2xl font-bold mb-4 text-purple-700">Generated System Prompt</h2>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200 overflow-y-auto flex-1">
                        <pre className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed font-mono">{systemPrompt}</pre>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition" onClick={handleCopyPrompt}>{copied ? 'Copied!' : '📋 Copy Prompt'}</button>
                        <button className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition" onClick={() => setShowPitchModal(false)}>Close</button>
                      </div>
                      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-yellow-800">
                        Paste this in your Vapi Assistant settings under System Prompt.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-linear-to-b from-transparent to-slate-100" style={{ transform: 'translateZ(1px)' }} />
            </div>
            <div className="absolute top-0 right-0 w-full h-full bg-linear-to-r from-slate-300 to-slate-400 rounded-3xl" style={{ transform: 'translateZ(-10px) translateX(8px)', zIndex: -1 }} />
          </motion.div>
        </motion.div>
        {/* RIGHT: Dialer + Demo Call */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-center justify-center">
          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-[420px] min-h-[860px] bg-linear-to-br from-[#0f0f13] to-[#1a1a1f] border-12 border-slate-900 rounded-[56px] p-0 shadow-2xl relative overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)' }}>
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[140px] h-9 rounded-[28px] bg-black flex items-center justify-center z-20 border border-slate-800/50">
              <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-slate-700" /><div className="w-20 h-1.5 rounded-full bg-slate-800" /><div className="w-2 h-2 rounded-full bg-slate-700" /></div>
            </div>
            <div className="h-full flex flex-col pt-16 pb-8 px-6">
              <div className="text-center mb-8">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" /></svg>
                  </div>
                  <h1 className="text-3xl text-white mb-2 font-semibold">Pitch Studio</h1>
                  <p className="text-sm text-slate-400 px-4">Enter VC or sponsor number to pitch your startup</p>
                </motion.div>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <AnimatePresence mode="wait">
                  {phoneMessage && (
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="mb-6 text-sm px-5 py-4 bg-linear-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl text-cyan-300 text-center border border-cyan-500/20 backdrop-blur-sm">{phoneMessage}</motion.div>
                  )}
                </AnimatePresence>
                <div className="mb-8">
                  <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-inner">
                    <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (phoneNumber ? handleStartPhoneCall() : handleStartVapiCall())} placeholder="Phone Number" className="w-full bg-transparent text-center text-4xl text-white outline-none placeholder-slate-600 font-light tracking-wider" />
                  </div>
                  <AnimatePresence>
                    {phoneNumber && (
                      <motion.button initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -5 }} onClick={() => { setPhoneNumber(''); setPhoneMessage('') }} className="mt-4 w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-2xl transition-all text-sm font-medium border border-red-500/20">Clear Number</motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {digits.map((d, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.05, backgroundColor: '#2d2d2d' }} whileTap={{ scale: 0.95 }} onClick={() => handleDigit(d.n)} className="h-[72px] bg-[#1f1f24] rounded-3xl text-white text-3xl font-light flex flex-col justify-center items-center hover:shadow-lg hover:shadow-purple-900/30 transition-all border border-slate-700/40 active:bg-slate-800 backdrop-blur-sm">
                      <span className="font-normal">{d.n}</span>
                      {d.l && <span className="text-[8px] tracking-[2.5px] text-slate-500 mt-0.5">{d.l}</span>}
                    </motion.button>
                  ))}
                </div>
                <div className="mb-4">
                  {/* Container for Vapi button */}
                  <div ref={vapiButtonContainerRef} className="w-full">
                    {/* Always show custom button but make it transparent when Vapi button is visible */}
                    {renderDialerButtonContent() && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDialerButtonClick}
                        disabled={phoneLoading}
                        className={`w-full h-[68px] rounded-3xl font-semibold text-white text-base flex justify-center items-center gap-2 transition-all border-2 ${
                          callActive
                            ? 'bg-red-600 from-red-600 to-red-700 border-red-500'
                            : 'bg-linear-to-br from-emerald-500 to-green-600 border-green-400/30'
                        } ${phoneLoading ? 'animate-pulse' : ''} ${vapiButtonVisible && !phoneNumber ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      >
                        {renderDialerButtonContent()}
                      </motion.button>
                    )}
                  </div>
                  {/* Centralized Vapi UI under demo button when no number */}
                  {!phoneNumber && (
                    <div className="space-y-4 mt-4">
                      {transcript && (
                        <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/10">
                          <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
                            <h4 className="text-white font-semibold text-xs">Live Transcript</h4>
                            <button onClick={handleClearTranscript} className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded transition-colors text-xs">Clear</button>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            <div className="p-3 space-y-2">
                              {transcript.split('\n').map((line, idx) => {
                                if (!line.trim()) return null
                                const isUser = line.includes('You:')
                                const isAssistant = line.includes('Assistant:')
                                return (
                                  <div key={idx} className={`p-2 rounded text-[10px] leading-relaxed ${isUser ? 'bg-blue-500/20 text-blue-200' : isAssistant ? 'bg-purple-500/20 text-purple-200' : 'bg-gray-500/20 text-gray-300'}`}>{line}</div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      {vapiEvents.length > 0 && (
                        <div className="bg-black/20 rounded-xl border border-white/10 p-3 text-[10px] text-slate-300 max-h-32 overflow-y-auto">
                          <div className="font-semibold mb-2 text-xs text-white">Event Log</div>
                          {vapiEvents.slice(-25).map((ev, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{new Date(ev.t).toLocaleTimeString()}</span>
                              <span className="uppercase tracking-wide">{ev.e}</span>
                              {ev.id && <span className="text-purple-300">{ev.id.substring(0,8)}</span>}
                              {ev.role && <span className="text-blue-300">{ev.role}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {vapiError && !callActive && (
                        <div className="space-y-2">
                          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl p-3">{vapiError}</div>
                          <button
                            onClick={() => {
                              setVapiError('')
                              setVapiReady(false)
                              const existing = document.querySelector('script[src*="VapiAI/html-script-tag"]')
                              if (existing) existing.remove()
                              const script = document.createElement('script')
                              script.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js'
                              script.defer = true
                              script.async = true
                              script.onload = () => { if (window.vapiSDK) setVapiReady(true) }
                              script.onerror = () => setVapiError('Retry failed: script could not load.')
                              document.head.appendChild(script)
                            }}
                            className="w-full py-2 text-xs bg-red-600/60 hover:bg-red-600 text-white rounded-xl font-semibold transition"
                          >
                            Retry SDK Init
                          </button>
                        </div>
                      )}
                      {!callActive && !vapiError && vapiReady && !transcript && (
                        <div className="text-center text-xs text-slate-400">Vapi assistant ready</div>
                      )}
                      {!vapiReady && !vapiError && (
                        <div className="flex justify-center">
                          <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span className="ml-2 text-xs text-slate-400">Loading voice assistant...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Removed separate transcript/event log blocks below to avoid duplication */}
                {/* ...existing code... */}
              </div>
              {/* ...existing code... */}
            </div>
            <div className="absolute top-0 right-0 w-full h-full bg-linear-to-r from-slate-300 to-slate-400 rounded-3xl" style={{ transform: 'translateZ(-10px) translateX(8px)', zIndex: -1 }} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
