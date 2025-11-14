import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CardGrid from '../components/cards/CardGrid'
import ExpandedCard from '../components/cards/ExpandedCard'

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
  // card UI state (on-demand rendering)
  const [expandedCard, setExpandedCard] = useState(null)

  // Add CSS for fade in animation
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
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

  return (
    <div>
    <button onClick={() => navigate(-1)} className="fixed left-5 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors">
    ← Back
    </button>
    <div className="max-w-[1200px] mx-auto my-5 px-5">
      
      <div className="flex gap-4 mb-4">
        <h1 className="text-3xl font-bold">BRD / Foundry</h1>
      </div>

      {/* Expanded card modal (renders on demand) */}
      {expandedCard ? (
        <ExpandedCard 
          cardId={expandedCard} 
          onClose={() => setExpandedCard(null)} 
          brdUrl={brdUrl}
          strategyMarkdown={strategyMarkdown}
          landingPageCode={landingPageCode}
          contentData={contentData}
          generatedAssets={generatedAssets}
        />
      ) : null}

      {/* The rest of the Foundry UI (planner, research, content, etc.) */}
      <div className="max-w-[1400px] mx-auto p-5">
            <h1 className="hidden">AI Campaign Foundry</h1>
        
        {/* Planner Summary Panel - Moved above cards */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-7 mb-6 border border-gray-700 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
          <h2 className="text-white mb-5 text-2xl font-bold">Campaign Plan</h2>
          {plannerData ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="col-span-full bg-gradient-to-br from-[rgba(102,126,234,0.15)] to-[rgba(118,75,162,0.15)] backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(102,126,234,0.2)] hover:border-[rgba(102,126,234,0.4)]">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Goal</div>
                <div className="text-white text-[15px] leading-normal">{plannerData.goal || '—'}</div>
              </div>

              <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(102,126,234,0.2)] hover:border-[rgba(102,126,234,0.4)]">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Topic</div>
                <div className="text-white text-[15px] leading-normal">{plannerData.topic || '—'}</div>
              </div>

              <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(102,126,234,0.2)] hover:border-[rgba(102,126,234,0.4)]">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Audience</div>
                <div className="text-white text-[15px] leading-normal">{plannerData.target_audience || '—'}</div>
              </div>

              <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(102,126,234,0.2)] hover:border-[rgba(102,126,234,0.4)]">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Docs</div>
                <a className="text-blue-300 no-underline text-sm font-semibold transition-colors hover:text-blue-200 hover:underline" href={plannerData.source_docs_url || '#'} target="_blank" rel="noreferrer">{plannerData.source_docs_url ? 'Open' : '—'}</a>
              </div>

              <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(102,126,234,0.2)] hover:border-[rgba(102,126,234,0.4)]">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Date</div>
                <div className="text-white text-[15px] leading-normal">{plannerData.campaign_date ? new Date(plannerData.campaign_date).toLocaleDateString() : 'TBD'}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 italic text-center py-10">Planner summary will appear here after the Planner Agent runs.</div>
          )}
        </div>

        {/* Cards UI - Moved after Campaign Plan */}
        <div className="my-6">
          <CardGrid onCardClick={(id) => setExpandedCard(id)} />
        </div>

        {/* Research Panel */}
        <div className="bg-gradient-to-br from-[#1e1b3c] to-[#2a1e4a] rounded-2xl p-7 mb-6 border border-gray-600 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
          <h2 className="text-white mb-5 text-2xl font-bold">Research Insights</h2>
          {researchData ? (
            <div className="grid gap-6">
              <div>
                <h3 className="text-purple-300 text-lg font-semibold mb-4">Audience Persona</h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(167,139,250,0.2)] hover:border-[rgba(167,139,250,0.4)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Pain Point</div>
                    <div className="text-gray-200 text-sm leading-relaxed">{researchData.audience_persona.pain_point || '—'}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(167,139,250,0.2)] hover:border-[rgba(167,139,250,0.4)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Motivation</div>
                    <div className="text-gray-200 text-sm leading-relaxed">{researchData.audience_persona.motivation || '—'}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(167,139,250,0.2)] hover:border-[rgba(167,139,250,0.4)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Channel</div>
                    <div className="text-gray-200 text-sm leading-relaxed">{researchData.audience_persona.preferred_channel || '—'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-purple-300 text-lg font-semibold mb-4">Core Messaging</h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <div className="bg-gradient-to-br from-[rgba(167,139,250,0.15)] to-[rgba(139,92,246,0.15)] border-[rgba(167,139,250,0.3)] backdrop-blur-[10px] border rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(167,139,250,0.2)] hover:border-[rgba(167,139,250,0.4)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Value Prop</div>
                    <div className="text-gray-200 text-sm leading-relaxed">{researchData.core_messaging.value_proposition || '—'}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(167,139,250,0.2)] hover:border-[rgba(167,139,250,0.4)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Tone</div>
                    <div className="text-gray-200 text-sm leading-relaxed">{researchData.core_messaging.tone_of_voice || '—'}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_16px_rgba(167,139,250,0.2)] hover:border-[rgba(167,139,250,0.4)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">CTA</div>
                    <div className="text-gray-200 text-sm leading-relaxed">{researchData.core_messaging.call_to_action || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 italic text-center py-10">Research insights will appear here after the Research Agent runs.</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-700">
            <h2 className="mt-0 mb-4 text-white text-xl">Activity Log</h2>
            <div className="bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="max-h-[400px] overflow-y-auto p-4 font-mono text-sm leading-relaxed" ref={outputRef}>
                {logNodes.map((n) => (
                  <div key={n.id} className={`mb-3 p-2 bg-[#1a1a1a] rounded border-l-[3px] ${n.isSeparator ? 'border-l-orange-500 bg-[#2a1a0a] my-4' : 'border-l-[#667eea]'}`} dangerouslySetInnerHTML={{ __html: n.html }} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-700">
            <h2 className="mt-0 mb-4 text-white text-xl">Live Campaign State (JSON)</h2>
            <pre className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 max-h-[400px] overflow-y-auto font-mono text-[13px] text-gray-400 whitespace-pre-wrap break-words">{JSON.stringify(jsonState, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
