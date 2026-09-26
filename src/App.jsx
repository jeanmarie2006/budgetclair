import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import { APP, DEMO_USER, seedFor } from './data.js'
import { DataProvider } from './store.jsx'
import Landing from './pages/Landing.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Installer from './pages/Installer.jsx'

function Private({ children }) {
  const { user } = useAuth()
  return user ? <DataProvider key={user.id}>{children}</DataProvider> : <Navigate to="/connexion" replace />
}

function Demo() {
  const { loginDemo } = useAuth()
  const nav = useNavigate()
  useEffect(() => { loginDemo().then(() => nav('/app', { replace: true })) }, [])
  return <p className="p-10 text-center text-slate-500">Ouverture de la démo…</p>
}

export default function App() {
  return (
    <AuthProvider app={APP} demo={DEMO_USER} onSeed={(u, isDemo) => isDemo && seedFor(u)}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/connexion" element={<AuthPage mode="login" />} />
        <Route path="/inscription" element={<AuthPage mode="register" />} />
        <Route path="/installer" element={<Installer />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/app" element={<Private><Dashboard /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
