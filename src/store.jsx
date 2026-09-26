import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './lib/auth.jsx'
import { useStore } from './lib/useStore.js'
import { uid, isoDay, makeDb } from './lib/db.js'
import { APP, monthKey, formatMoney } from './data.js'

const Ctx = createContext(null)
export const useData = () => useContext(Ctx)

/** Contexte des données de l'utilisateur connecté (transactions, budgets, récurrences, devise). */
export function DataProvider({ children }) {
  const { user } = useAuth()
  const [tx, setTx] = useStore(APP, `tx:${user.id}`, [])
  const [budgets, setBudgets] = useStore(APP, `budgets:${user.id}`, {})
  const [recurring, setRecurring] = useStore(APP, `recurring:${user.id}`, [])
  const [currency, setCurrency] = useStore(APP, 'currency', 'XOF')
  const [month, setMonth] = useState(monthKey())

  // Transactions récurrentes : générées automatiquement pour le mois en cours
  useEffect(() => {
    const today = new Date()
    const mk = monthKey(today)
    const missing = recurring
      .filter((r) => r.actif && r.jour <= today.getDate())
      .filter((r) => !tx.some((t) => t.recurringId === r.id && t.date.startsWith(mk)))
    if (missing.length) {
      setTx((prev) => [
        ...prev,
        ...missing.map((r) => ({
          id: uid(), type: r.type, categorie: r.categorie, montant: r.montant, description: r.label,
          date: `${mk}-${String(r.jour).padStart(2, '0')}`, recurringId: r.id,
        })),
      ])
    }
  }, [recurring])

  const addTx = useCallback((t) => setTx((p) => [...p, { ...t, id: uid() }]), [])
  const updateTx = useCallback((id, t) => setTx((p) => p.map((x) => (x.id === id ? { ...x, ...t } : x))), [])
  const removeTx = useCallback((id) => setTx((p) => p.filter((x) => x.id !== id)), [])
  const setBudget = useCallback((cat, val) => setBudgets((b) => {
    const n = { ...b }
    if (!val) delete n[cat]; else n[cat] = val
    return n
  }), [])
  const addRecurring = useCallback((r) => setRecurring((p) => [...p, { ...r, id: uid(), actif: true }]), [])
  const toggleRecurring = useCallback((id) => setRecurring((p) => p.map((r) => (r.id === id ? { ...r, actif: !r.actif } : r))), [])
  const removeRecurring = useCallback((id) => setRecurring((p) => p.filter((r) => r.id !== id)), [])

  const fmt = useCallback((n) => formatMoney(n, currency), [currency])

  const value = useMemo(() => ({
    tx, budgets, recurring, currency, setCurrency, month, setMonth, fmt,
    addTx, updateTx, removeTx, setBudget, addRecurring, toggleRecurring, removeRecurring,
  }), [tx, budgets, recurring, currency, month, fmt])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme() {
  const db = makeDb(APP)
  const [dark, setDark] = useState(() => {
    const saved = db.read('theme', null)
    return saved ? saved === 'dark' : typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    db.write('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

export function exportCsv(rows, catName) {
  const head = ['Date', 'Type', 'Catégorie', 'Description', 'Montant (FCFA)']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [head.map(esc).join(';')].concat(
    rows.map((t) => [t.date, t.type === 'revenu' ? 'Revenu' : 'Dépense', catName(t.categorie), t.description, t.type === 'revenu' ? t.montant : -t.montant].map(esc).join(';'))
  )
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `budgetclair-transactions-${isoDay()}.csv`
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
