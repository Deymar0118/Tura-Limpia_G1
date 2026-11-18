import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import LandingPage from './modules/landing/pages/LandingPage'
import AuthPage from './modules/auth/pages/AuthPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>      
        <Route path="/login" element={<AuthPage initialTab="login" />} />
        <Route path="/registro" element={<AuthPage initialTab="registro" />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App