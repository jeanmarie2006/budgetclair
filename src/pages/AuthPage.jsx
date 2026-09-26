import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../lib/auth.jsx'

export default function AuthPage({ mode }) {
  const isReg = mode === 'register'
  const { user, login, register, loginDemo } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/app" replace />

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (isReg) await register(f); else await login(f)
      nav('/app')
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-50 to-slate-50 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form onSubmit={submit} className="card space-y-4 p-7" noValidate>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{isReg ? 'Créer un compte' : 'Connexion'}</h1>
            <p className="text-sm text-slate-500">{isReg ? 'Commencez à suivre votre budget en 1 minute.' : 'Retrouvez votre tableau de bord.'}</p>
          </div>
          {err && <div role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{err}</div>}
          {isReg && (
            <div><label className="label" htmlFor="name">Nom</label><input id="name" className="input" value={f.name} onChange={set('name')} autoComplete="name" placeholder="Votre nom" /></div>
          )}
          <div><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" className="input" value={f.email} onChange={set('email')} autoComplete="email" placeholder="vous@exemple.com" /></div>
          <div><label className="label" htmlFor="pw">Mot de passe</label><input id="pw" type="password" className="input" value={f.password} onChange={set('password')} autoComplete={isReg ? 'new-password' : 'current-password'} placeholder="6 caractères minimum" /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Patientez…' : isReg ? 'Créer mon compte' : 'Se connecter'}</button>
          <button type="button" className="btn-ghost w-full" onClick={async () => { await loginDemo(); nav('/app') }}>Essayer avec le compte démo</button>
          <p className="text-center text-sm text-slate-500">
            {isReg ? <>Déjà inscrit ? <Link className="font-semibold text-brand-700 hover:underline" to="/connexion">Connexion</Link></> : <>Pas encore de compte ? <Link className="font-semibold text-brand-700 hover:underline" to="/inscription">Inscription</Link></>}
          </p>
        </form>
      </div>
    </div>
  )
}
