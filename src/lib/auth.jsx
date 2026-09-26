import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { makeDb, uid } from './db.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

async function hash(email, pw) {
  const data = new TextEncoder().encode(email.toLowerCase() + '::' + pw)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Authentification de démonstration : comptes et session gardés dans le navigateur (mots de passe hachés). */
export function AuthProvider({ app, demo, onSeed, children }) {
  const db = makeDb(app)
  const [user, setUser] = useState(() => db.read('session', null))

  const save = (u) => { db.write('session', u); setUser(u) }
  const users = () => db.read('users', [])

  const register = useCallback(async ({ name, email, password, role }) => {
    if (!name?.trim() || !email?.trim() || !password) throw new Error('Tous les champs sont obligatoires.')
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Adresse e-mail invalide.')
    if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.')
    const list = users()
    if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Un compte existe déjà avec cet e-mail.')
    const u = { id: uid(), name: name.trim(), email: email.trim(), role: role || 'user', h: await hash(email, password) }
    db.write('users', [...list, u])
    onSeed?.(u, false)
    save({ id: u.id, name: u.name, email: u.email, role: u.role })
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const h = await hash(email || '', password || '')
    const u = users().find((x) => x.email.toLowerCase() === (email || '').toLowerCase() && x.h === h)
    if (!u) throw new Error('E-mail ou mot de passe incorrect.')
    save({ id: u.id, name: u.name, email: u.email, role: u.role })
  }, [])

  const loginDemo = useCallback(async (which = 0) => {
    const d = Array.isArray(demo) ? demo[which] : demo
    let u = users().find((x) => x.email === d.email)
    if (!u) {
      u = { id: uid(), name: d.name, email: d.email, role: d.role || 'user', h: await hash(d.email, d.password) }
      db.write('users', [...users(), u])
      onSeed?.(u, true)
    }
    save({ id: u.id, name: u.name, email: u.email, role: u.role })
  }, [])

  const logout = useCallback(() => save(null), [])
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return <Ctx.Provider value={{ user, register, login, loginDemo, logout }}>{children}</Ctx.Provider>
}
