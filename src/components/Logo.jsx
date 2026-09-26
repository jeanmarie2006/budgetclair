import { Link } from 'react-router-dom'

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 font-extrabold tracking-tight ${className}`} aria-label="BudgetClair — accueil">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 17l5-6 4 3.5L20 6" /><path d="M15 6h5v5" />
        </svg>
      </span>
      <span className="text-lg">Budget<span className="text-brand-600">Clair</span></span>
    </Link>
  )
}
