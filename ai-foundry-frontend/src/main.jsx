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
import Research from './pages/research'
import Breakdown from './pages/breakdown'
import Postmaker from './pages/postmaker'
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
            <Route path="/research" element={<Research />} />
            <Route path="/breakdown" element={<Breakdown />} />
            <Route path="/postmaker" element={<Postmaker />} />
          </Routes>
        </BrowserRouter>
  </React.StrictMode>
)
