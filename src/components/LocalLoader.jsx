import { Loader2 } from 'lucide-react'

/**
 * SpinnerLoader — small inline spinner for dropdowns, form sections, or cards.
 *
 * Props:
 *   size      — pixel size of the Loader2 icon (default: 20)
 *   message   — optional label text beside the spinner
 *   className — extra Tailwind classes on the wrapper div
 *
 * Usage:
 *   {dropdownsLoading && <SpinnerLoader size={16} message="Loading options..." />}
 */
export function SpinnerLoader({ size = 20, message = '', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-4 ${className}`}>
      <Loader2
        size={size}
        className="animate-spin flex-shrink-0"
        style={{ color: '#0097A7' }}
      />
      {message && (
        <span className="text-[12px] text-slate-500 font-medium">{message}</span>
      )}
    </div>
  )
}

/**
 * TableSkeleton — animated pulse skeleton rows for table loading states.
 *
 * Props:
 *   rows — number of skeleton rows to render (default: 5)
 *   cols — array of column width strings (default: 5-column equal layout)
 *          e.g. ['8%', '25%', '20%', '15%', '32%']
 *
 * Usage:
 *   {loading ? <TableSkeleton rows={8} cols={['10%', '30%', '25%', '20%', '15%']} /> : <DataTable />}
 */
export function TableSkeleton({ rows = 5, cols = ['8%', '25%', '20%', '15%', '32%'] }) {
  return (
    <div className="w-full animate-pulse" role="status" aria-label="Loading table data">
      {/* Fake header */}
      <div className="flex gap-3 px-4 py-2.5 bg-slate-100 rounded-t-lg mb-1">
        {cols.map((w, i) => (
          <div
            key={i}
            className="h-3 bg-slate-300 rounded"
            style={{ width: w, flexShrink: 0 }}
          />
        ))}
      </div>
      {/* Fake rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex gap-3 px-4 py-3 items-center ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
        >
          {cols.map((w, colIdx) => (
            <div
              key={colIdx}
              className="h-3 bg-slate-200 rounded"
              style={{ width: w, flexShrink: 0 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * CardSkeleton — animated pulse placeholder cards for dashboard widgets.
 *
 * Props:
 *   count — number of skeleton cards to render (default: 4)
 *
 * Usage:
 *   {loading ? <CardSkeleton count={4} /> : <DashboardCards data={data} />}
 */
export function CardSkeleton({ count = 4 }) {
  return (
    <div
      className="grid grid-cols-4 gap-5 animate-pulse"
      role="status"
      aria-label="Loading dashboard cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-5 bg-slate-200 shadow-md">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-2.5 bg-slate-300 rounded w-24" />
              <div className="h-7 bg-slate-300 rounded w-16 mt-2" />
            </div>
            <div className="w-8 h-8 bg-slate-300 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
