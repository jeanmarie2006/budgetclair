import { makeDb, uid, isoDay } from './lib/db.js'

export const APP = 'budgetclair'

export const CATEGORIES = [
  { id: 'alimentation', nom: 'Alimentation', type: 'depense', color: '#f97316', icon: '🍲' },
  { id: 'transport', nom: 'Transport', type: 'depense', color: '#3b82f6', icon: '🛵' },
  { id: 'logement', nom: 'Logement', type: 'depense', color: '#8b5cf6', icon: '🏠' },
  { id: 'loisirs', nom: 'Loisirs', type: 'depense', color: '#ec4899', icon: '🎬' },
  { id: 'sante', nom: 'Santé', type: 'depense', color: '#ef4444', icon: '💊' },
  { id: 'education', nom: 'Éducation', type: 'depense', color: '#14b8a6', icon: '📚' },
  { id: 'communication', nom: 'Communication', type: 'depense', color: '#eab308', icon: '📱' },
  { id: 'autres-d', nom: 'Autres dépenses', type: 'depense', color: '#64748b', icon: '🧾' },
  { id: 'salaire', nom: 'Salaire', type: 'revenu', color: '#10b981', icon: '💼' },
  { id: 'freelance', nom: 'Freelance', type: 'revenu', color: '#06b6d4', icon: '💻' },
  { id: 'autres-r', nom: 'Autres revenus', type: 'revenu', color: '#84cc16', icon: '🎁' },
]
export const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[7]

// Taux indicatifs (1 EUR = 655,957 FCFA est la parité officielle ; le dollar est une valeur de démonstration)
export const CURRENCIES = {
  XOF: { label: 'FCFA', rate: 1, locale: 'fr-FR', digits: 0 },
  EUR: { label: 'EUR', rate: 655.957, locale: 'fr-FR', digits: 2 },
  USD: { label: 'USD', rate: 600, locale: 'en-US', digits: 2 },
}
export function formatMoney(fcfa, cur = 'XOF') {
  const c = CURRENCIES[cur]
  const v = fcfa / c.rate
  if (cur === 'XOF') {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v)).replace(/[  ]/g, ' ') + ' FCFA'
  }
  return new Intl.NumberFormat(c.locale, { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: c.digits }).format(v)
}
export const toFcfa = (amount, cur) => Math.round(Number(amount) * CURRENCIES[cur].rate)
export const fromFcfa = (fcfa, cur) => Math.round((fcfa / CURRENCIES[cur].rate) * 100) / 100

export const monthKey = (d = new Date()) => isoDay(d).slice(0, 7)
export const monthLabel = (m) => {
  const [y, mo] = m.split('-').map(Number)
  const s = new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export const monthShort = (m) => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
}
export const shiftMonth = (m, delta) => {
  const [y, mo] = m.split('-').map(Number)
  return monthKey(new Date(y, mo - 1 + delta, 1))
}

// Jeu de données de démonstration (déterministe)
function rng(seed) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function seedFor(user) {
  const db = makeDb(APP)
  const r = rng(42)
  const tx = []
  const now = new Date()
  const push = (date, type, categorie, montant, description, extra = {}) =>
    tx.push({ id: uid(), type, categorie, montant, date, description, ...extra })
  const pick = (arr) => arr[Math.floor(r() * arr.length)]
  for (let back = 5; back >= 0; back--) {
    const base = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const mk = monthKey(base)
    const d = (day) => `${mk}-${String(day).padStart(2, '0')}`
    const last = back === 0 ? now.getDate() : 28
    const ok = (day) => day <= last
    push(d(1), 'revenu', 'salaire', 285000, 'Salaire du mois')
    if (r() > 0.4 && ok(12)) push(d(12), 'revenu', 'freelance', Math.round((30000 + r() * 70000) / 1000) * 1000, 'Mission freelance — site vitrine')
    if (ok(3)) push(d(3), 'depense', 'logement', 80000, 'Loyer', { recurringId: 'r-loyer' })
    if (ok(5)) push(d(5), 'depense', 'communication', 15000, 'Internet & forfait MTN', { recurringId: 'r-internet' })
    for (const day of [2, 6, 9, 13, 16, 20, 24, 27]) {
      if (ok(day)) push(d(day), 'depense', 'alimentation', Math.round((6000 + r() * 16000) / 500) * 500, pick(['Marché Dantokpa', 'Supermarché', 'Riz, huile, tomates', 'Poisson & légumes']))
    }
    for (const day of [2, 4, 7, 10, 14, 18, 21, 25]) {
      if (ok(day)) push(d(day), 'depense', 'transport', Math.round((1500 + r() * 4500) / 500) * 500, pick(['Zémidjan', 'Taxi', 'Carburant moto', 'Bus']))
    }
    if (ok(15)) push(d(15), 'depense', 'loisirs', Math.round((8000 + r() * 22000) / 500) * 500, pick(['Sortie avec les amis', 'Cinéma', 'Restaurant']))
    if (ok(18) && r() > 0.45) push(d(18), 'depense', 'sante', Math.round((5000 + r() * 20000) / 500) * 500, 'Pharmacie / consultation')
    if (ok(8) && r() > 0.5) push(d(8), 'depense', 'education', Math.round((10000 + r() * 30000) / 500) * 500, 'Formation en ligne')
  }
  const budgets = { alimentation: 110000, transport: 30000, loisirs: 25000, communication: 18000, sante: 20000 }
  const recurring = [
    { id: 'r-loyer', label: 'Loyer', type: 'depense', categorie: 'logement', montant: 80000, jour: 3, actif: true },
    { id: 'r-internet', label: 'Internet & forfait MTN', type: 'depense', categorie: 'communication', montant: 15000, jour: 5, actif: true },
    { id: 'r-salaire', label: 'Salaire', type: 'revenu', categorie: 'salaire', montant: 285000, jour: 1, actif: false },
  ]
  db.write(`tx:${user.id}`, tx)
  db.write(`budgets:${user.id}`, budgets)
  db.write(`recurring:${user.id}`, recurring)
}

export const DEMO_USER = { name: 'Adjoua K.', email: 'demo@budgetclair.app', password: 'demo1234' }
