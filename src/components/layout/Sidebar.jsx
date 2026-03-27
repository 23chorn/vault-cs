import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '⬡' },
  { id: 'config', label: 'Configuration', icon: '⚙' },
  { id: 'costs', label: 'Cost Breakdown', icon: '◈' },
  { id: 'mortgage', label: 'Mortgage Model', icon: '◰' },
  { id: 'rates', label: 'Rate Sensitivity', icon: '◎' },
  { id: 'projections', label: '20-Year Projection', icon: '◇' },
  { id: 'sellvshold', label: 'Sell vs Hold', icon: '⇄' },
]

export default function Sidebar({ activeSection, onNavigate, propertyName }) {
  const [open, setOpen] = useState(false)

  const handleNav = (id) => {
    onNavigate(id)
    setOpen(false)
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-bg-surface border border-border rounded-lg p-2 text-text-primary"
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" />
          ) : (
            <path d="M3 5h14M3 10h14M3 15h14" />
          )}
        </svg>
      </button>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-60 bg-bg-surface border-r border-border flex flex-col shrink-0
        transform transition-transform duration-200 ease-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="p-5 border-b border-border">
          <h1 className="text-sm font-semibold text-text-primary tracking-wide uppercase">
            Property Portfolio
          </h1>
          <p className="text-xs text-text-muted mt-1">Analyser</p>
        </div>

        {/* Property selector */}
        <div className="p-4 border-b border-border">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Properties</p>
          <div className="bg-bg-elevated rounded-lg p-3 border border-accent-blue/30">
            <p className="text-sm text-text-primary font-medium truncate">{propertyName}</p>
          </div>
          <button
            disabled
            className="mt-2 w-full text-xs text-text-muted border border-border rounded-lg py-2 cursor-not-allowed opacity-50"
            title="Multiple properties — coming soon"
          >
            + Add Property
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                activeSection === item.id
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              <span className="text-base opacity-60">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
