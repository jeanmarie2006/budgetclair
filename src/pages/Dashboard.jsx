import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Logo from '../components/Logo.jsx'
import TxModal from '../components/TxModal.jsx'
import { BudgetsPanel, RecurringPanel } from '../components/BudgetsPanel.jsx'
import { useAuth } from '../lib/auth.jsx'
import { useData, useTheme, exportCsv } from '../store.jsx'
import { CATEGORIES, CURRENCIES, catById, monthLabel, monthShort, shiftMonth, monthKey } from '../data.js'
import { frDate } from '../lib/db.js'

const fmtDay = (d) => frDate(d, { day: '2-digit', month: 'short' })

export default function Dashboard() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const { tx, month, setMonth, currency, setCurrency, fmt, addTx, updateTx, removeTx } = useData()
  const [dark, setDark] = useTheme()
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState({ q: '', type: 'all', cat: 'all' })
  const [confirm, setConfirm] = useState(null)

  useEffect(() => () => document.documentElement.classList.remove('dark'), [])

  const inMonth = useMemo(() => tx.filter((t) => t.date.startsWith(month)), [tx, month])
  const income = inMonth.filter((t) => t.type === 'revenu').reduce((s, t) => s + t.montant, 0)
  const spent = inMonth.filter((t) => t.type === 'depense').reduce((s, t) => s + t.montant, 0)
  const balance = income - spent
  const savingRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const spentByCat = useMemo(() => {
    const m = {}
    inMonth.filter((t) => t.type === 'depense').forEach((t) => { m[t.categorie] = (m[t.categorie] || 0) + t.montant })
    return m
  }, [inMonth])

  const pie = useMemo(() => Object.entries(spentByCat)
    .map(([id, v]) => ({ id, name: catById(id).nom, value: v, color: catById(id).color }))
    .sort((a, b) => b.value - a.value), [spentByCat])

  const curve = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(month, i - 5)
    const rows = tx.filter((t) => t.date.startsWith(m))
    return {
      m: monthShort(m),
      Revenus: rows.filter((t) => t.type === 'revenu').reduce((s, t) => s + t.montant, 0),
      Dépenses: rows.filter((t) => t.type === 'depense').reduce((s, t) => s + t.montant, 0),
    }
  }), [tx, month])

  const rate = CURRENCIES[currency].rate
  const conv = (n) => Math.round((n / rate) * 100) / 100

  const list = useMemo(() => {
    const q = filter.q.trim().toLowerCase()
    return inMonth
      .filter((t) => filter.type === 'all' || t.type === filter.type)
      .filter((t) => filter.cat === 'all' || t.categorie === filter.cat)
      .filter((t) => !q || t.description.toLowerCase().includes(q) || catById(t.categorie).nom.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [inMonth, filter])

  const save = (t) => {
    if (modal?.id) updateTx(modal.id, t); else addTx(t)
    setModal(null)
  }
  const top3 = pie.slice(0, 3)
  const isCurrent = month === monthKey()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Logo to="/app" />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input !w-auto !py-2" aria-label="Devise">
              {Object.entries(CURRENCIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </select>
            <button className="btn-ghost !px-3" onClick={() => setDark(!dark)} aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'} title="Thème">{dark ? '☀️' : '🌙'}</button>
            <button className="btn-ghost hidden sm:inline-flex" onClick={() => exportCsv(inMonth, (id) => catById(id).nom)}>⬇ Export CSV</button>
            <span className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 md:inline">{user.name}</span>
            <button className="btn-ghost" onClick={() => { logout(); nav('/') }}>Quitter</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Bonjour {user.name.split(' ')[0]} 👋</h1>
            <p className="text-sm text-slate-500">Voici votre situation financière de {monthLabel(month).toLowerCase()}.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <button className="px-3 py-2 text-slate-500 hover:text-brand-600" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mois précédent">‹</button>
              <span className="min-w-36 text-center text-sm font-bold" aria-live="polite">{monthLabel(month)}</span>
              <button className="px-3 py-2 text-slate-500 hover:text-brand-600 disabled:opacity-30" disabled={isCurrent} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mois suivant">›</button>
            </div>
            <button className="btn-primary" onClick={() => setModal({})}>+ Transaction</button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Solde du mois" value={(balance >= 0 ? '+ ' : '− ') + fmt(Math.abs(balance))} tone={balance >= 0 ? 'good' : 'bad'} big />
          <Kpi label="Revenus" value={fmt(income)} tone="good" />
          <Kpi label="Dépenses" value={fmt(spent)} tone="bad" />
          <Kpi label="Taux d’épargne" value={`${savingRate} %`} tone={savingRate >= 20 ? 'good' : savingRate >= 0 ? 'warn' : 'bad'} hint={savingRate >= 20 ? 'Objectif de 20 % atteint 🎉' : 'Objectif conseillé : 20 %'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="card p-5 lg:col-span-2" aria-labelledby="pie-t">
            <h2 id="pie-t" className="text-base font-extrabold text-slate-900 dark:text-white">Dépenses par catégorie</h2>
            {pie.length === 0 ? <Empty text="Aucune dépense ce mois-ci." /> : (
              <>
                <div className="h-56" role="img" aria-label={'Répartition : ' + pie.map((p) => `${p.name} ${fmt(p.value)}`).join(', ')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pie.map((p) => ({ ...p, value: conv(p.value) }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none" isAnimationActive={false}>
                        {pie.map((p) => <Cell key={p.id} fill={p.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v * rate)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Les plus lourdes</p>
                  <ul className="space-y-2">
                    {top3.map((p, i) => (
                      <li key={p.id} className="flex items-center gap-3 text-sm">
                        <span className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white" style={{ background: p.color }}>{i + 1}</span>
                        <span className="flex-1 font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                        <span className="text-slate-500">{Math.round((p.value / spent) * 100)} %</span>
                        <b>{fmt(p.value)}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>

          <section className="card p-5 lg:col-span-3" aria-labelledby="cv-t">
            <h2 id="cv-t" className="text-base font-extrabold text-slate-900 dark:text-white">Évolution sur 6 mois</h2>
            <div className="mt-3 h-72" role="img" aria-label="Courbe des revenus et des dépenses sur six mois">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve.map((c) => ({ ...c, Revenus: conv(c.Revenus), Dépenses: conv(c['Dépenses']) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.45} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.22} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => (currency === 'XOF' ? `${Math.round(v / 1000)} k` : Math.round(v))} />
                  <Tooltip formatter={(v) => fmt(v * rate)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="Revenus" stroke="#10b981" strokeWidth={3} fill="url(#g1)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="Dépenses" stroke="#f43f5e" strokeWidth={3} fill="url(#g2)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="card p-5 lg:col-span-3" aria-labelledby="tx-t">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="tx-t" className="text-base font-extrabold text-slate-900 dark:text-white">Transactions <span className="text-slate-400">({list.length})</span></h2>
              <button className="btn-ghost !px-3 !py-1.5 text-xs sm:hidden" onClick={() => exportCsv(inMonth, (id) => catById(id).nom)}>⬇ CSV</button>
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <input className="input" placeholder="Rechercher…" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} aria-label="Rechercher une transaction" />
              <select className="input" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} aria-label="Type"><option value="all">Tous les types</option><option value="depense">Dépenses</option><option value="revenu">Revenus</option></select>
              <select className="input" value={filter.cat} onChange={(e) => setFilter({ ...filter, cat: e.target.value })} aria-label="Catégorie"><option value="all">Toutes catégories</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
            </div>
            {list.length === 0 ? <Empty text="Aucune transaction ne correspond." action={<button className="btn-primary mt-3" onClick={() => setModal({})}>Ajouter une transaction</button>} /> : (
              <ul className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-slate-800">
                {list.map((t) => {
                  const c = catById(t.categorie)
                  return (
                    <li key={t.id} className="group flex items-center gap-3 py-2.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg" style={{ background: c.color + '22' }} aria-hidden="true">{c.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{t.description}</p>
                        <p className="text-xs text-slate-500">{c.nom} · {fmtDay(t.date)}{t.recurringId ? ' · 🔁' : ''}</p>
                      </div>
                      <b className={`whitespace-nowrap text-sm ${t.type === 'revenu' ? 'text-brand-600' : 'text-slate-800 dark:text-slate-100'}`}>{t.type === 'revenu' ? '+' : '−'}{fmt(t.montant)}</b>
                      <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" onClick={() => setModal(t)} aria-label={`Modifier ${t.description}`}>✎</button>
                        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800" onClick={() => setConfirm(t)} aria-label={`Supprimer ${t.description}`}>🗑</button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
          <div className="space-y-6 lg:col-span-2">
            <BudgetsPanel spentByCat={spentByCat} />
            <RecurringPanel />
          </div>
        </div>
      </main>

      <p className="pb-8 text-center text-xs text-slate-400">Démonstration : vos données sont enregistrées uniquement dans ce navigateur. Taux USD indicatif (1 USD = 600 FCFA).</p>

      <button className="btn-primary fixed bottom-5 right-5 z-30 h-14 w-14 !rounded-full !p-0 text-2xl shadow-xl shadow-brand-600/40 sm:hidden" onClick={() => setModal({})} aria-label="Ajouter une transaction">+</button>

      {modal && <TxModal initial={modal} currency={currency} onSave={save} onClose={() => setModal(null)} />}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div role="alertdialog" aria-modal="true" className="card w-full max-w-sm space-y-4 p-6">
            <h2 className="text-lg font-extrabold">Supprimer cette transaction ?</h2>
            <p className="text-sm text-slate-500">« {confirm.description} » — {fmt(confirm.montant)}. Cette action est définitive.</p>
            <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={() => setConfirm(null)}>Annuler</button><button className="btn-danger flex-1" onClick={() => { removeTx(confirm.id); setConfirm(null) }}>Supprimer</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, tone, hint, big }) {
  const color = { good: 'text-brand-600', bad: 'text-rose-600', warn: 'text-amber-600' }[tone]
  return (
    <div className={`card p-5 ${big ? 'bg-gradient-to-br from-brand-600 to-brand-700 !border-transparent text-white' : ''}`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${big ? 'text-brand-100' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${big ? 'text-white' : color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
function Empty({ text, action }) {
  return <div className="grid place-items-center py-10 text-center text-sm text-slate-500"><span className="mb-2 text-3xl" aria-hidden="true">🗒️</span>{text}{action}</div>
}
