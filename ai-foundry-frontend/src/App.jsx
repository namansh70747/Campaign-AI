import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Report from './pages/report'
import Control from './pages/control'
import WebEditor from './pages/webEditor'
import Research from './pages/research'
import Breakdown from './pages/breakdown'
import Postmaker from './pages/postmaker'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/control" element={<Control />} />
        <Route path="/web-editor" element={<WebEditor />} />
        <Route path="/research" element={<Research />} />
        <Route path="/breakdown" element={<Breakdown />} />
        <Route path="/postmaker" element={<Postmaker />} />
      </Routes>
    </BrowserRouter>
  );
}
