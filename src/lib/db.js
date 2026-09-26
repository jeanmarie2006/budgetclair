// Petite « base de données » dans le navigateur (localStorage), avec repli mémoire.
const mem = {}
export function makeDb(app) {
  const k = (n) => `${app}:${n}`
  const read = (n, def) => {
    try { const v = localStorage.getItem(k(n)); return v ? JSON.parse(v) : def } catch { return mem[k(n)] ?? def }
  }
  const write = (n, v) => {
    try { localStorage.setItem(k(n), JSON.stringify(v)) } catch { mem[k(n)] = v }
  }
  return { read, write }
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
export const fcfa = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n || 0)).replace(/ /g, ' ') + ' FCFA'
export const isoDay = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const frDate = (s, opt = { day: '2-digit', month: 'short', year: 'numeric' }) => new Date(s).toLocaleDateString('fr-FR', opt)
