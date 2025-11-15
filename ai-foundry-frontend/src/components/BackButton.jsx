import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function BackButton({ className = '' }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go Back"
      className={`flex fixed left-5 top-5 p-2 bg-gray-400 hover:bg-gray-300 rounded transition-colors z-50 ${className}`}
      type="button"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="-translate-y-0.5 ml-1">BACK</span>
    </button>
  )
}
