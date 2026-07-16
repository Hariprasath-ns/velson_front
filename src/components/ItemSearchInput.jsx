import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export default function ItemSearchInput({
  value = '',
  onChange,
  placeholder = 'Search part no or name...',
  className = '',
  displayField = 'partNo',
  disabled = false,
}) {
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')  // ADD
  const [isOpen, setIsOpen]         = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)   // ADD for keyboard nav
  const containerRef = useRef(null)
  const listRef      = useRef(null)                           // ADD for scroll

  // Sync external value to internal input
  useEffect(() => {
    setSearch(value || '')
  }, [value])

  // Debounce — wait 300ms after user stops typing before firing query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)   // cancel if user types again within 300ms
  }, [search])

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIdx(-1)
  }, [debouncedSearch])

  // Query uses debouncedSearch — not raw search
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return []
      const res = await api.get(
        `/api/item-master?search=${encodeURIComponent(debouncedSearch)}&limit=20`,
        { skipGlobalLoader: true }
      )
      return res.data?.data || []
    },
    enabled: isOpen && debouncedSearch.trim().length >= 2,  // min 2 chars
    staleTime: 30 * 1000,
  })

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Select an item — shared by click and keyboard Enter
  const selectItem = (item) => {
    const selectVal = item[displayField] || ''
    setSearch(selectVal)
    setIsOpen(false)
    setHighlightedIdx(-1)
    onChange(selectVal, item)
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIdx(i => {
        const next = Math.min(i + 1, items.length - 1)
        // Scroll highlighted item into view
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
        onKeyDown={handleKeyDown}        // ADD
        className={className}
        autoComplete="off"
      />

      {isOpen && !disabled && search.trim().length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded border border-slate-200 bg-white py-1 shadow-lg text-[12px] text-left">

          {/* Show hint while debounce is pending */}
          {search !== debouncedSearch || debouncedSearch.trim().length < 2 ? (
            <div className="px-3 py-2 text-slate-400 text-center text-[11px]">
              {debouncedSearch.trim().length < 2 ? 'Type at least 2 characters...' : 'Searching...'}
            </div>
          ) : isLoading ? (
            <div className="px-3 py-2 text-slate-500 text-center">Searching...</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-2 text-slate-500 text-center">No items found</div>
          ) : (
            <div ref={listRef}>
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectItem(item)}
                  className={`w-full text-left px-3 py-1.5 focus:outline-none transition-colors border-b border-slate-50 last:border-0
                    ${idx === highlightedIdx
                      ? 'bg-[#0097A7]/10 border-l-2 border-l-[#0097A7]'  // highlighted row
                      : 'hover:bg-slate-100'
                    }`}
                >
                  <div className="font-semibold text-[#0097A7]">{item.partNo}</div>
                  <div className="text-slate-600 text-[11px] truncate">{item.partName}</div>
                  {item.description && (
                    <div className="text-slate-400 text-[10px] truncate">{item.description}</div>
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