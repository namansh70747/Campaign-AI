import React from 'react'
import BackButton from '../components/BackButton'
import { useLocation } from 'react-router-dom'
import Card1Content from '../components/cards/expanded/Card1Content'

export default function Breakdown() {
  const location = useLocation()
  const { brdUrl, strategyMarkdown } = location.state || {}

  return (
    <div className="min-h-screen w-full bg-slate-950 py-12 px-4 md:px-10 text-white">
      <BackButton />
      <div className="max-w-5xl mx-auto">
        <Card1Content brdUrl={brdUrl} strategyMarkdown={strategyMarkdown} />
      </div>
    </div>
  )
}
