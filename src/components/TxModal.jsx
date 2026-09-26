import { useEffect, useState } from 'react'
import { CATEGORIES, CURRENCIES, fromFcfa, toFcfa } from '../data.js'
import { isoDay } from '../lib/db.js'

export default function TxModal({ initial, currency, onSave, onClose }) {
  const editing = !!initial?.id
  const [f, setF] = useState(() => ({
    type: initial?.type || 'depense',
    categorie: initial?.categorie || 'alimentation',
    montant: initial?.montant ? String(fromFcfa(initial.montant, currency)) : '',
    date: initial?.date || isoDay(),
    description: initial?.description || '',
  }))
  const [err, setErr] = useState('')
  const cats = CATEGORIES.filter((c) => c.type === f.type)

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  const setType = (type) => setF((p) => ({ ...p, type, categorie: CATEGORIES.find((c) => c.type === type).id }))
  const submit = (e) => {
    e.preventDefault()
    const n = Number(String(f.montant).replace(',', '.'))
    if (!n || n <= 0) return setErr('Saisissez un montant supérieur à 0.')
    if (!f.date) return setErr('Choisissez une date.')
    onSave({ type: f.type, categorie: f.categorie, montant: toFcfa(n, currency), date: f.date, description: f.description.trim() || cats.find((c) => c.id === f.categorie)?.nom })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={editing ? 'Modifier la transaction' : 'Nouvelle transaction'} className="card w-full max-w-md space-y-4 rounded-b-none p-6 sm:rounded-b-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{editing ? 'Modifier la transaction' : 'Nouvelle transaction'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
          {[['depense', 'Dépense'], ['revenu', 'Revenu']].map(([v, l]) => (
            <button key={v} type="button" role="tab" aria-selected={f.type === v} onClick={() => setType(v)}
              className={`rounded-lg py-2 text-sm font-bold transition ${f.type === v ? (v === 'revenu' ? 'bg-brand-600 text-white shadow' : 'bg-rose-600 text-white shadow') : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{err}</p>}
        <div>
          <label className="label" htmlFor="montant">Montant ({CURRENCIES[currency].label})</label>
          <input id="montant" className="input text-lg font-bold" inputMode="decimal" autoFocus value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value })} placeholder="0" />
        </div>
        <div>
          <span className="label">Catégorie</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {cats.map((c) => (
              <button type="button" key={c.id} onClick={() => setF({ ...f, categorie: c.id })} aria-pressed={f.categorie === c.id}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition ${f.categorie === c.id ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                <span aria-hidden="true">{c.icon}</span>{c.nom}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="date">Date</label><input id="date" type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <div><label className="label" htmlFor="desc">Description</label><input id="desc" className="input" maxLength={80} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Facultatif" /></div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>Annuler</button>
          <button className="btn-primary flex-1">{editing ? 'Enregistrer' : 'Ajouter'}</button>
        </div>
      </form>
    </div>
  )
}
