import { useState } from 'react'
import { CATEGORIES, CURRENCIES, catById, fromFcfa, toFcfa } from '../data.js'
import { useData } from '../store.jsx'

export function BudgetsPanel({ spentByCat }) {
  const { budgets, setBudget, fmt, currency } = useData()
  const [editing, setEditing] = useState(null)
  const [val, setVal] = useState('')
  const depCats = CATEGORIES.filter((c) => c.type === 'depense')
  const start = (c) => { setEditing(c.id); setVal(budgets[c.id] ? String(fromFcfa(budgets[c.id], currency)) : '') }
  const save = () => { setBudget(editing, val ? toFcfa(Number(val.replace(',', '.')), currency) : 0); setEditing(null) }
  const over = depCats.filter((c) => budgets[c.id] && (spentByCat[c.id] || 0) > budgets[c.id])

  return (
    <section className="card p-5" aria-labelledby="bud-t">
      <div className="mb-1 flex items-center justify-between">
        <h2 id="bud-t" className="text-base font-extrabold text-slate-900 dark:text-white">Budgets du mois</h2>
        {over.length > 0 && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">⚠ {over.length} dépassement{over.length > 1 ? 's' : ''}</span>}
      </div>
      <p className="mb-4 text-xs text-slate-500">Fixez un plafond par catégorie ; la barre change de couleur à 80 % puis au-delà de 100 %.</p>
      <ul className="space-y-3.5">
        {depCats.map((c) => {
          const b = budgets[c.id]
          const s = spentByCat[c.id] || 0
          const pct = b ? Math.min(100, (s / b) * 100) : 0
          const state = !b ? 'none' : s > b ? 'over' : s >= b * 0.8 ? 'warn' : 'ok'
          const bar = { ok: 'bg-brand-500', warn: 'bg-amber-500', over: 'bg-rose-500', none: 'bg-slate-300' }[state]
          return (
            <li key={c.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200"><span aria-hidden="true">{c.icon}</span>{c.nom}</span>
                {editing === c.id ? (
                  <span className="flex items-center gap-1">
                    <input autoFocus className="input !w-28 !py-1 text-right" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} aria-label={`Budget ${c.nom}`} />
                    <button className="btn-primary !px-2.5 !py-1" onClick={save} aria-label="Valider">✓</button>
                  </span>
                ) : (
                  <button onClick={() => start(c)} className="text-xs font-semibold text-slate-500 hover:text-brand-700" aria-label={`Modifier le budget ${c.nom}`}>
                    {fmt(s)} / {b ? fmt(b) : 'définir ✎'}
                  </button>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${b ? pct : 0}%` }} />
              </div>
              {state === 'over' && <p className="mt-1 text-xs font-semibold text-rose-600">Dépassé de {fmt(s - b)}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function RecurringPanel() {
  const { recurring, addRecurring, toggleRecurring, removeRecurring, fmt, currency } = useData()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ label: '', montant: '', jour: 1, type: 'depense', categorie: 'logement' })
  const cats = CATEGORIES.filter((c) => c.type === f.type)
  const add = (e) => {
    e.preventDefault()
    const n = Number(String(f.montant).replace(',', '.'))
    if (!f.label.trim() || !n) return
    addRecurring({ label: f.label.trim(), type: f.type, categorie: f.categorie, montant: toFcfa(n, currency), jour: Number(f.jour) })
    setF({ label: '', montant: '', jour: 1, type: 'depense', categorie: 'logement' }); setOpen(false)
  }
  return (
    <section className="card p-5" aria-labelledby="rec-t">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="rec-t" className="text-base font-extrabold text-slate-900 dark:text-white">Transactions récurrentes</h2>
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setOpen(!open)}>{open ? 'Fermer' : '+ Ajouter'}</button>
      </div>
      {open && (
        <form onSubmit={add} className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <input className="input col-span-2" placeholder="Libellé (ex. Loyer)" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} aria-label="Libellé" />
          <input className="input" inputMode="decimal" placeholder={`Montant (${CURRENCIES[currency].label})`} value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value })} aria-label="Montant" />
          <input className="input" type="number" min="1" max="28" value={f.jour} onChange={(e) => setF({ ...f, jour: e.target.value })} aria-label="Jour du mois" title="Jour du mois" />
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, categorie: CATEGORIES.find((c) => c.type === e.target.value).id })} aria-label="Type"><option value="depense">Dépense</option><option value="revenu">Revenu</option></select>
          <select className="input" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })} aria-label="Catégorie">{cats.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
          <button className="btn-primary col-span-2">Enregistrer la récurrence</button>
        </form>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {recurring.length === 0 && <li className="py-3 text-sm text-slate-500">Aucune transaction récurrente.</li>}
        {recurring.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <button role="switch" aria-checked={r.actif} onClick={() => toggleRecurring(r.id)} aria-label={`Activer ${r.label}`}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${r.actif ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${r.actif ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{r.label}</p>
              <p className="text-xs text-slate-500">Le {r.jour} de chaque mois · {catById(r.categorie).nom}</p>
            </div>
            <b className={`text-sm ${r.type === 'revenu' ? 'text-brand-600' : 'text-rose-600'}`}>{r.type === 'revenu' ? '+' : '−'}{fmt(r.montant)}</b>
            <button onClick={() => removeRecurring(r.id)} className="rounded-lg p-1 text-slate-400 hover:text-rose-600" aria-label={`Supprimer ${r.label}`}>🗑</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
