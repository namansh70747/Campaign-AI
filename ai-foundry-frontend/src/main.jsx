import React from 'react'
import { createRoot } from 'react-dom/client'
// import App from './App'
import './styles.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Control from './pages/control'
import Report from './pages/report'
import WebEditor from './pages/webEditor'
import PromptPage from './pages/PromptPage'
const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/home" element={<Home/>} />
            <Route path="/prompt" element={<PromptPage/>} />
            <Route path="/workflow" element={<Report/>} />
            <Route path="/web-editor" element={<WebEditor/>} />
            <Route path="/control" element={<Control/>} />
          </Routes>
        </BrowserRouter>
  </React.StrictMode>
)
