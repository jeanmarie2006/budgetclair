import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../lib/auth.jsx'
import { InstallButton } from '../lib/pwa.jsx'

const PIE = [
  { name: 'Alimentation', v: 34, c: '#f97316' },
  { name: 'Logement', v: 26, c: '#8b5cf6' },
  { name: 'Transport', v: 16, c: '#3b82f6' },
  { name: 'Loisirs', v: 12, c: '#ec4899' },
  { name: 'Autres', v: 12, c: '#64748b' },
]
const CURVE = [
  { m: 'Avr', r: 300, d: 210 }, { m: 'Mai', r: 335, d: 245 }, { m: 'Juin', r: 285, d: 230 },
  { m: 'Juil', r: 360, d: 262 }, { m: 'Août', r: 300, d: 214 }, { m: 'Sept', r: 345, d: 198 },
]

const FEATURES = [
  ['Saisie en 10 secondes', 'Ajoutez un revenu ou une dépense en quelques clics, avec catégorie, date et description.', '⚡'],
  ['Graphiques clairs', 'Camembert par catégorie et courbe mensuelle : vous voyez où part votre argent.', '📊'],
  ['Budgets et alertes', 'Fixez un plafond par catégorie. La barre passe à l’orange puis au rouge en cas de dépassement.', '🎯'],
  ['FCFA, EUR ou USD', 'Passez d’une devise à l’autre en un clic, les montants sont convertis pour vous.', '💱'],
  ['Transactions récurrentes', 'Loyer, abonnements, salaire : ils s’ajoutent automatiquement chaque mois.', '🔁'],
  ['Export CSV', 'Récupérez toutes vos transactions dans Excel ou Google Sheets.', '📥'],
]

export default function Landing() {
  const { user, loginDemo } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const demo = async () => { setBusy(true); await loginDemo(); nav('/app') }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <InstallButton className="btn-ghost hidden md:inline-flex" label="⬇ Installer" />
          {user ? (
            <Link to="/app" className="btn-primary">Mon tableau de bord</Link>
          ) : (
            <>
              <Link to="/connexion" className="btn-ghost hidden sm:inline-flex">Connexion</Link>
              <Link to="/inscription" className="btn-primary">Créer un compte</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-2 lg:pt-14">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> Gratuit · Sans carte bancaire · Vos données restent chez vous
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Sachez enfin <span className="text-brand-600">où part votre argent</span> chaque mois.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              BudgetClair vous aide à noter vos revenus et vos dépenses, à les classer par catégorie et à voir en un coup d’œil votre situation financière. Pensé pour les étudiants, les salariés et les freelances.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={demo} disabled={busy} className="btn-primary px-6 py-3 text-base">
                {busy ? 'Chargement…' : 'Essayer la démo →'}
              </button>
              <Link to="/inscription" className="btn-ghost px-6 py-3 text-base">Créer mon compte</Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <li>✓ Graphiques automatiques</li><li>✓ Budgets par catégorie</li><li>✓ Export CSV</li>
            </ul>
          </div>

          {/* Aperçu du tableau de bord */}
          <div className="relative" aria-hidden="true">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-500/20 via-cyan-400/10 to-transparent blur-2xl" />
            <div className="card p-5 shadow-xl shadow-slate-900/5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Solde de septembre</p>
                  <p className="text-3xl font-extrabold text-slate-900">+ 147 000 <span className="text-base font-bold text-slate-400">FCFA</span></p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">↑ 12 % vs août</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-50 p-3"><p className="text-xs text-brand-700">Revenus</p><p className="font-bold text-slate-900">345 000 F</p></div>
                <div className="rounded-xl bg-rose-50 p-3"><p className="text-xs text-rose-700">Dépenses</p><p className="font-bold text-slate-900">198 000 F</p></div>
              </div>
              <div className="mt-4 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CURVE} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="r" stroke="#10b981" strokeWidth={2.5} fill="url(#gr)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="d" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gd)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={PIE} dataKey="v" innerRadius={30} outerRadius={50} paddingAngle={3} stroke="none" isAnimationActive={false}>
                        {PIE.map((p) => <Cell key={p.name} fill={p.c} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1.5 text-xs">
                  {PIE.map((p) => (
                    <li key={p.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-full" style={{ background: p.c }} />{p.name}</span>
                      <b className="text-slate-800">{p.v} %</b>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">Tout pour garder le contrôle de votre budget</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Une application simple, rapide et agréable à utiliser, sur ordinateur comme sur téléphone.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([t, d, i]) => (
              <article key={t} className="card p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-xl">{i}</div>
                <h3 className="text-lg font-bold text-slate-900">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-24">
          <div className="rounded-3xl bg-slate-900 p-10 text-center text-white">
            <h2 className="text-3xl font-extrabold">Prêt à y voir clair ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">Testez BudgetClair avec un compte de démonstration déjà rempli de six mois de transactions.</p>
            <button onClick={demo} disabled={busy} className="btn-primary mt-6 px-7 py-3 text-base">Ouvrir la démo</button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p><Link to="/installer" className="font-semibold text-brand-700 hover:underline">Installer l’application</Link> sur mobile, tablette ou ordinateur</p>
        <p className="mt-1">BudgetClair — projet de démonstration. Les données sont enregistrées uniquement dans votre navigateur.</p>
        <p className="mt-1">Réalisé par <a className="font-semibold text-brand-700 hover:underline" href="https://sedjame-vianney.vercel.app" target="_blank" rel="noopener">Sedjame Vianney</a></p>
      </footer>
    </div>
  )
}
