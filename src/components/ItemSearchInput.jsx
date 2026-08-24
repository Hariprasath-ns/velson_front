import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export default function ItemSearchInput({
  value = '',
  onChange,
  placeholder = 'Search Part No...',
  className = '',
  displayField = 'partNo',
  disabled = false,
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // Sync external value to internal search input
  useEffect(() => {
    setSearch(value || '')
  }, [value])

  // Fetch Item Master matching items dynamically from backend database
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items-search-query', search.trim()],
    queryFn: async () => {
      const q = search.trim()
      const url = q
        ? `/api/item-master?search=${encodeURIComponent(q)}&limit=10000`
        : `/api/item-master?limit=10000`
      const res = await api.get(url, { skipGlobalLoader: true })
      return res.data?.data || []
    },
    enabled: isOpen && !disabled,
    staleTime: 10 * 1000,
  })

  // Reset keyboard highlight index when search or items change
  useEffect(() => {
    setHighlightedIdx(-1)
  }, [search, items])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (items.length > 0 && search) {
          const exactMatch = items.find(it => (it.partNo || '').toLowerCase() === search.toLowerCase().trim())
          if (exactMatch) {
            selectItem(exactMatch)
          }
        }
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [items, search])

  // Select an item
  const selectItem = (item) => {
    const selectVal = item[displayField] || item.partNo || ''
    setSearch(selectVal)
    setIsOpen(false)
    setHighlightedIdx(-1)
    onChange(selectVal, item)
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (isOpen && items.length > 0) {
        if (highlightedIdx >= 0 && highlightedIdx < items.length) {
          selectItem(items[highlightedIdx])
        } else {
          const exactMatch = items.find(it => (it.partNo || '').toLowerCase() === search.toLowerCase().trim())
          if (exactMatch) {
            selectItem(exactMatch)
          }
        }
      }
      setIsOpen(false)
      return
    }

    if (!isOpen || items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIdx(i => {
        const next = Math.min(i + 1, items.length - 1)
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIdx(i => {
        const prev = Math.max(i - 1, 0)
        listRef.current?.children[prev]?.scrollIntoView({ block: 'nearest' })
        return prev
      })
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault()
      selectItem(items[highlightedIdx])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleBlur = () => {
    if (items.length > 0 && search) {
      const exactMatch = items.find(it => (it.partNo || '').toLowerCase() === search.toLowerCase().trim())
      if (exactMatch) {
        selectItem(exactMatch)
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value
          setSearch(val)
          setIsOpen(true)
          onChange(val, null)
        }}
        onFocus={() => { if (!disabled) setIsOpen(true) }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        autoComplete="off"
      />

      {isOpen && !disabled && (
        <div className="absolute left-0 min-w-[280px] z-[9999] mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-300 bg-white py-1 shadow-2xl text-[12px] text-left">
          {isLoading ? (
            <div className="px-3 py-2.5 text-slate-400 text-center text-[11px] italic">
              Searching Item Master for "{search}"...
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-2.5 text-slate-400 text-center text-[11px] italic">
              No items found matching "{search}"
            </div>
          ) : (
            <div ref={listRef}>
              {items.map((item, idx) => (
                <button
                  key={item.id || idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectItem(item);
                  }}
                  className={`w-full text-left px-3 py-2 focus:outline-none transition-colors border-b border-slate-100 last:border-0
                    ${idx === highlightedIdx
                      ? 'bg-[#0097A7]/15 border-l-4 border-l-[#0097A7]'
                      : 'hover:bg-[#0097A7]/10'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#0097A7]">{item.partNo}</span>
                    {(item.uom || item.uomName) && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold shrink-0">
                        {item.uom || item.uomName}
                      </span>
                    )}
                  </div>
                  {item.partName && (
                    <div className="text-slate-700 text-[11px] font-medium truncate mt-0.5">
                      {item.partName}
                    </div>
                  )}
                  {item.description && (
                    <div className="text-slate-400 text-[10px] truncate">
                      {item.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}