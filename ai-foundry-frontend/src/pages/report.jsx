import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import CardGrid from '../components/cards/CardGrid'

export default function Report(){
  const loc = useLocation()
  const navigate = useNavigate()
  const locationState = loc.state || {}

  // Get prompt from navigation state (sent from PromptPage)
  const [prompt, setPrompt] = useState(locationState.prompt || "")
  const [logNodes, setLogNodes] = useState([])
  const [jsonState, setJsonState] = useState({})
  const [plannerData, setPlannerData] = useState(null)
  const [researchData, setResearchData] = useState(null)
  const [contentData, setContentData] = useState(null)
  const [generatedAssets, setGeneratedAssets] = useState({})
  const [landingPageCode, setLandingPageCode] = useState(null)
  const wsRef = useRef(null)
  const outputRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [brdUrl, setBrdUrl] = useState(null)
  const [strategyMarkdown, setStrategyMarkdown] = useState(null)

  // Add CSS for animations and card styling
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@100;200;300;400;500;600;700;800;900&display=swap');
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulse-subtle {
        0%, 100% { 
          opacity: 1; 
          transform: scale(1); 
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2);
        }
        50% { 
          opacity: 0.9; 
          transform: scale(1.02); 
          box-shadow: 0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.3);
        }
      }
      .animate-pulse-subtle {
        animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      .campaign-card-wrapper {
        position: relative;
        height: 342px;
        width: 100%;
        max-width: 655px;
        margin: 0 auto;
      }
      
      .campaign-card {
        background: linear-gradient(135deg, #2a1e4a 0%, #1a1a2e 100%);
        width: 100%;
        height: 100%;
        border-radius: 5px;
        position: relative;
        box-shadow: -20px 30px 116px 0 rgba(92, 15, 15, 0.54);
        overflow: hidden;
        z-index: 4;
        transition: transform 0.1s ease-out;
      }
      
      .campaign-card__orangeShine,
      .campaign-card__greenShine {
        position: absolute;
        background-repeat: no-repeat;
        background-size: cover;
        pointer-events: none;
      }
      
      .campaign-card__orangeShine {
        background: radial-gradient(circle at 30% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 60%);
        right: -150px;
        top: -90px;
        bottom: 50px;
        z-index: 2;
        width: 570px;
        height: 500px;
        transition: transform 0.1s ease-out;
      }
      
      .campaign-card__greenShine {
        background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
        left: 20%;
        top: 0;
        bottom: 0;
        z-index: 1;
        width: 400px;
      }
      
      .campaign-card__title {
        font-family: 'Urbanist', sans-serif;
        text-align: center;
        color: #fff;
        font-size: 48px;
        line-height: 1.2;
        padding: 30px 20px;
        font-weight: 800;
        position: relative;
        z-index: 2;
        transition: transform 0.1s ease-out;
      }
      
      .campaign-card__content {
        position: absolute;
        left: 5%;
        right: 5%;
        bottom: 15%;
        z-index: 2;
        color: #fff;
        transition: transform 0.1s ease-out;
      }
      
      .campaign-card__circle,
      .campaign-card__smallCircle {
        position: absolute;
        border-radius: 100%;
        background: linear-gradient(-239deg, rgba(168, 85, 247, 0.3) 0%, rgba(139, 92, 246, 0.2) 59%);
        box-shadow: -10px -15px 90px 0 rgba(107, 33, 168, 0.3);
        z-index: 2;
        transition: transform 0.1s ease-out;
      }
      
      .campaign-card__circle {
        right: 68px;
        bottom: 34px;
        width: 230px;
        height: 230px;
      }
      
      .campaign-card__smallCircle {
        right: 40%;
        top: -7%;
        width: 50px;
        height: 50px;
      }
      
      .campaign-card__comet {
        position: relative;
        width: 8px;
        height: 8px;
        background-color: #fff;
        border-radius: 100%;
        transition: transform 0.1s ease-out;
      }
      
      .campaign-card__cometOuter {
        position: absolute;
        top: 30%;
        left: 25%;
        z-index: 3;
      }
      
      .campaign-card__comet--second {
        position: absolute;
        right: -30px;
        top: -15px;
        transform: scale(0.6);
      }
      
      .campaign-card__comet:before,
      .campaign-card__comet:after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 27%, rgba(255, 255, 255, 0) 100%);
        border-radius: 20px;
        transform: rotate(-45deg);
      }
      
      .campaign-card__comet:before {
        width: 18px;
        height: 70px;
        transform-origin: -2px 13px;
      }
      
      .campaign-card__comet:after {
        width: 12px;
        height: 80px;
        transform-origin: 0px 8px;
      }
      
      .campaign-card__field {
        display: inline-block;
        margin: 8px 15px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(168, 85, 247, 0.3);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }
      
      .campaign-card__field:hover {
        background: radial-gradient(circle at center, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.15));
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2);
      }
      
      .campaign-card__field-label {
        font-family: 'Urbanist', sans-serif;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: rgba(168, 85, 247, 1);
        font-weight: 800;
        margin-bottom: 4px;
      }
      
      .campaign-card__field-value {
        font-size: 13px;
        color: #fff;
        font-weight: 300;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  
  // Mouse move effect for card
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      const card = document.querySelector('.campaign-card')
      if (!card) return
      
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) * -1 / 100
      const y = (e.clientY - rect.top - rect.height / 2) * -1 / 100
      
      const smallCircle = document.querySelector('.campaign-card__smallCircle')
      const circle = document.querySelector('.campaign-card__circle')
      const title = document.querySelector('.campaign-card__title')
      const content = document.querySelector('.campaign-card__content')
      const orangeShine = document.querySelector('.campaign-card__orangeShine')
      const comet = document.querySelector('.campaign-card__cometOuter')
      
      if (smallCircle) smallCircle.style.transform = `translate(${e.clientX * 0.03}px, ${e.clientY * 0.03}px)`
      if (content) content.style.transform = `translate(${e.clientX * 0.03}px, ${e.clientY * 0.03}px)`
      if (orangeShine) orangeShine.style.transform = `translate(${e.clientX * 0.09}px, ${e.clientY * 0.09}px)`
      if (circle) circle.style.transform = `translate(${e.clientX * 0.05}px, ${e.clientY * 0.05}px)`
      if (title) title.style.transform = `translate(${e.clientX * 0.03}px, ${e.clientY * 0.03}px)`
      if (comet) comet.style.transform = `translate(${e.clientX * 0.05}px, ${e.clientY * 0.05}px)`
      
      const matrix = [
        [1, 0, 0, -x * 0.00005],
        [0, 1, 0, -y * 0.00005],
        [0, 0, 1, 1],
        [0, 0, 0, 1]
      ]
      
      card.style.transform = `matrix3d(${matrix.toString()})`
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // helper to append to log
  function addOutputMessage(htmlContent, isSeparator = false) {
    setLogNodes((prev) => [...prev, { id: Date.now() + Math.random(), html: htmlContent, isSeparator }])
  }

  // connect on mount and auto-start if navigated from PromptPage
  useEffect(() => {
    addOutputMessage('<strong>STATUS:</strong> Connecting...')
    connect()
    
    // Auto-run if autoStart flag is set from PromptPage
    if (locationState.autoStart && prompt) {
      setTimeout(() => {
        sendPrompt();
      }, 1000);
    }
    
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [logNodes])

  function connect() {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws_stream_campaign')
      wsRef.current = ws

      ws.onopen = () => {
        setLogNodes((prev) => prev.filter((n) => !n.html.includes('Connecting...')))
        addOutputMessage('<strong>STATUS:</strong> Connected to server. Ready to run.')
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)

        if (message.event === 'step') {
          const nodeName = message.node
          try {
            const jsonData = JSON.parse(message.data)
            setJsonState(jsonData)
            if (nodeName === 'planner_agent') {
              const plannerFields = {
                goal: jsonData.goal || null,
                topic: jsonData.topic || null,
                target_audience: jsonData.target_audience || null,
                source_docs_url: jsonData.source_docs_url || null,
                campaign_date: jsonData.campaign_date || null
              }
              setPlannerData(plannerFields)
            }

            if (nodeName === 'research_agent') {
              const researchFields = {
                audience_persona: jsonData.audience_persona || {},
                core_messaging: jsonData.core_messaging || {}
              }
              setResearchData(researchFields)
            }

            if (nodeName === 'content_agent') {
              const contentFields = {
                webinar_details: jsonData.webinar_details || {},
                social_posts: jsonData.social_posts || []
              }
              setContentData(contentFields)
            }

            if (nodeName === 'design_agent') {
              if (jsonData.generated_assets) {
                setGeneratedAssets(jsonData.generated_assets)
              }
            }

            if (nodeName === 'web_agent') {
              if (jsonData.landing_page_code) {
                setLandingPageCode(jsonData.landing_page_code)
              }
            }

            if (nodeName === 'brd_agent') {
              if (jsonData.brd_url) {
                setBrdUrl(jsonData.brd_url)
              }
            }

            if (nodeName === 'strategy_agent') {
              if (jsonData.strategy_markdown) {
                setStrategyMarkdown(jsonData.strategy_markdown)
              }
            }

            let snippet = `Updated landing_page_url: ${jsonData.landing_page_url}`
            if (nodeName === 'planner_agent') snippet = `Planned topic: ${jsonData.topic}`
            if (nodeName === 'research_agent') snippet = `Found pain point: ${jsonData.audience_persona?.pain_point || 'N/A'}`
            if (nodeName === 'content_agent') snippet = `Wrote ${jsonData.email_sequence?.length || 0} emails.`
            if (nodeName === 'design_agent') snippet = `Created logo prompt: ${jsonData.brand_kit?.logo_prompt || 'N/A'}`

            addOutputMessage(`<strong>${nodeName.toUpperCase()}</strong><br>${snippet}`)
          } catch (e) {
            addOutputMessage(`<strong>ERROR:</strong> Failed to parse server JSON: ${e}`)
          }

        } else if (message.event === 'done') {
          addOutputMessage('<strong>STATUS:</strong> Campaign Complete!')
          setRunning(false)
          if (wsRef.current) wsRef.current.close()

        } else if (message.event === 'error') {
          addOutputMessage(`<strong>ERROR:</strong> ${message.data}`)
          setRunning(false)
        }
      }

      ws.onclose = () => {
        addOutputMessage('<strong>STATUS:</strong> Disconnected. Trying to reconnect...')
        setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
        addOutputMessage('<strong>ERROR:</strong> Could not connect to ws://localhost:8000. Is the server running?')
      }
    } catch (e) {
      console.error('WS connect failed', e)
      addOutputMessage(`<strong>ERROR:</strong> ${e}`)
    }
  }

  function sendPrompt() {
    const ws = wsRef.current
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      connect()
      setTimeout(() => sendPrompt(), 1000)
      return
    } else if (ws.readyState !== WebSocket.OPEN) {
      alert('Not connected to server. Please wait.')
      return
    }

    if (!prompt) {
      alert('Please enter a prompt.')
      return
    }

    setJsonState({})
    addOutputMessage('<strong>STATUS:</strong> Sending prompt to Foundry...', true)

    ws.send(JSON.stringify({ initial_prompt: prompt }))
    setRunning(true)
  }

  /* --------------------
     Small inline SVG icon components for action buttons
     -------------------- */
  const IconWrapper = ({ children, title }) => (
    <button className="bg-transparent border-none cursor-pointer p-0 flex items-center text-inherit transition-colors hover:text-[#1d9bf0]" title={title} aria-label={title} type="button">{children}</button>
  )

  const HeartIcon = ({ filled=false }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? '#e0245e' : 'none'} stroke={filled ? '#e0245e' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 4.6c-1.9-1.8-5-1.7-6.9.2l-.9.9-.9-.9C10.2 2.9 7.1 2.8 5.2 4.6 2.9 6.8 3 10.6 5.4 13.1L12 19.6l6.6-6.5c2.4-2.4 2.5-6.2.2-8.5z" />
    </svg>
  )

  const CommentIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )

  const ShareIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )

  const BookmarkIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )

  const RetweetIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="23 7 23 1 17 1" />
      <path d="M20 8v6a3 3 0 0 1-3 3H7" />
      <polyline points="1 17 1 23 7 23" />
      <path d="M4 16v-6a3 3 0 0 1 3-3h10" />
    </svg>
  )

  function goToResearch() {
    if (!researchData) return
    navigate('/research', { state: { researchData } })
  }

  return (
    <div className="w-full" style={{ background:'#FFFFFF', minHeight:'100vh' }}>
      <BackButton />

      <div className="flex flex-col lg:flex-row w-full min-h-screen">
        {/* Left Section 70% */}
        <div className="lg:w-[70%] w-full p-6 space-y-8">
          {/* Campaign Plan - Animated Card */}
          <div className="campaign-card-wrapper">
            <div className="campaign-card">
              <div className="campaign-card__cometOuter">
                <div className="campaign-card__comet"></div>
                <div className="campaign-card__comet campaign-card__comet--second"></div>
              </div>
              <div className="campaign-card__circle"></div>
              <div className="campaign-card__smallCircle"></div>
              <div className="campaign-card__orangeShine"></div>
              <div className="campaign-card__greenShine"></div>
              
              <div className="campaign-card__title">
                Campaign Plan
              </div>
              
              {plannerData ? (
                <div className="campaign-card__content">
                  <div className="campaign-card__field">
                    <div className="campaign-card__field-label">Goal</div>
                    <div className="campaign-card__field-value">{plannerData.goal || '—'}</div>
                  </div>
                  <div className="campaign-card__field">
                    <div className="campaign-card__field-label">Topic</div>
                    <div className="campaign-card__field-value">{plannerData.topic || '—'}</div>
                  </div>
                  <div className="campaign-card__field">
                    <div className="campaign-card__field-label">Audience</div>
                    <div className="campaign-card__field-value">{plannerData.target_audience || '—'}</div>
                  </div>
                  <div className="campaign-card__field">
                    <div className="campaign-card__field-label">Date</div>
                    <div className="campaign-card__field-value">
                      {plannerData.campaign_date ? new Date(plannerData.campaign_date).toLocaleDateString() : 'TBD'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="campaign-card__content">
                  <div style={{textAlign: 'center', opacity: 0.6, fontStyle: 'italic'}}>
                    Waiting for Campaign Plan...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cards 2x2 */}
          <div className="mt-12">
            <CardGrid
              brdUrl={brdUrl}
              strategyMarkdown={strategyMarkdown}
              landingPageCode={landingPageCode}
              contentData={contentData}
              generatedAssets={generatedAssets}
            />
          </div>

            {/* Research Button */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={goToResearch}
                disabled={!researchData}
                className={`px-8 py-4 rounded-lg font-semibold transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed ${researchData ? 'animate-pulse-subtle hover:scale-105' : ''}`}
                style={{background: researchData ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' : '#d1d5db'}}
              >
                {researchData ? 'Get Research Analytics' : 'Waiting for Research Agent...'}
              </button>
            </div>
        </div>

        {/* Right Section 30% */}
        <div className="lg:w-[30%] w-full p-6 space-y-6 bg-gray-50">
          {/* Activity Log */}
          <div className="rounded-xl p-5 border border-gray-200 shadow-md" style={{background:'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)'}}>
            <h2 className="mt-0 mb-4 text-gray-800 text-xl" style={{fontFamily: 'Urbanist, sans-serif', fontWeight: 800}}>Activity Log</h2>
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="max-h-[400px] overflow-y-auto p-4 font-mono text-sm leading-relaxed text-black" ref={outputRef}>
                {logNodes.map((n) => (
                  <div key={n.id} className={`mb-3 p-2 bg-gray-50 rounded border-l-[3px] text-black ${n.isSeparator ? 'border-l-orange-400 bg-orange-50 my-4' : 'border-l-purple-400'}`} dangerouslySetInnerHTML={{ __html: n.html }} />
                ))}
              </div>
            </div>
          </div>

          {/* Live State */}
          <div className="rounded-xl p-5 border border-gray-200 shadow-md" style={{background:'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)'}}>
            <h2 className="mt-0 mb-4 text-gray-800 text-xl" style={{fontFamily: 'Urbanist, sans-serif', fontWeight: 800}}>Live Campaign State (JSON)</h2>
            <pre className="bg-white border border-gray-200 rounded-lg p-4 max-h-[400px] overflow-y-auto font-mono text-[13px] text-gray-700 whitespace-pre-wrap break-words">{JSON.stringify(jsonState, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
