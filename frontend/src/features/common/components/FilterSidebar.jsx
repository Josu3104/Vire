// src/components/FilterSidebar.jsx
import { useState, useEffect } from 'react'
import { getFilters } from '@/features/projects/api/projects.api'
import styles from './FilterSidebar.module.css'

const IconLevel = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)

const IconUniversity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconBranch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
  </svg>
)

const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconChevron = ({ open }) => (
  <svg
    className={`${styles.chevron} ${open ? styles.open : ''}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

function FilterSection({ title, icon, options, selected, onChange }) {
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (val) => {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    )
  }

  return (
    <div className={styles.section}>
      <div
        className={styles.sectionHeader}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
      >
        <div className={styles.sectionTitle}>
          {icon}
          {title}
          {selected.length > 0 && (
            <span className={styles.sectionCount}>{selected.length}</span>
          )}
        </div>
        <IconChevron open={open} />
      </div>

      {open && (
        <div className={styles.sectionBody}>
          {options.length > 5 && (
            <div className={styles.searchBox}>
              <IconSearch />
              <input
                className={styles.searchInput}
                type="text"
                placeholder={`Buscar ${title.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={`Buscar ${title}`}
              />
            </div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt}
              className={styles.option}
              onClick={() => toggle(opt)}
              role="checkbox"
              aria-checked={selected.includes(opt)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggle(opt)}
            >
              <div className={`${styles.checkbox} ${selected.includes(opt) ? styles.checked : ''}`} />
              <span className={styles.optionLabel}>{opt}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 4px' }}>Sin resultados</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function FilterSidebar({ filters, onChange, isOpen, onClose }) {
  const [filterOptions, setFilterOptions] = useState({ levels: [], universities: [], branches: [], tags: [] })
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  useEffect(() => {
    getFilters().then(data => {
      setFilterOptions({
        levels: data.levels,
        universities: data.universities,
        branches: data.branches,
        tags: data.tags,
      })
    }).catch(console.error)
  }, [])

  const hasFilters =
    (localFilters.levels && localFilters.levels.length > 0) ||
    localFilters.universities.length > 0 ||
    localFilters.branches.length > 0 ||
    localFilters.tags.length > 0

  const clearAll = () => {
    setLocalFilters({ levels: [], universities: [], branches: [], tags: [] })
    onChange({ levels: [], universities: [], branches: [], tags: [] })
  }

  const applyFilters = () => {
    onChange(localFilters)
    if (window.innerWidth <= 992) {
      onClose()
    }
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Filtros de búsqueda">
      <div className={styles.sidebarInner}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Filtros</span>
          <div className={styles.headerActions}>
            {hasFilters && (
              <button className={styles.clearBtn} onClick={clearAll}>
                Limpiar
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar filtros">
              ✕
            </button>
          </div>
        </div>

        <FilterSection
          title="Nivel Académico"
          icon={<IconLevel />}
          options={filterOptions.levels || []}
          selected={localFilters.levels || []}
          onChange={(val) => setLocalFilters({ ...localFilters, levels: val })}
        />
        <FilterSection
          title="Universidad"
          icon={<IconUniversity />}
          options={filterOptions.universities}
          selected={localFilters.universities}
          onChange={(val) => setLocalFilters({ ...localFilters, universities: val })}
        />
        <FilterSection
          title="Rama"
          icon={<IconBranch />}
          options={filterOptions.branches}
          selected={localFilters.branches}
          onChange={(val) => setLocalFilters({ ...localFilters, branches: val })}
        />
        <FilterSection
          title="Tags"
          icon={<IconTag />}
          options={filterOptions.tags}
          selected={localFilters.tags}
          onChange={(val) => setLocalFilters({ ...localFilters, tags: val })}
        />

        <div style={{ padding: '16px', position: 'sticky', bottom: 0, background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={applyFilters}
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </aside>
  )
}
