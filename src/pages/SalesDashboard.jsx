import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign,
  Search, ShieldAlert, Package, CircleDot, RefreshCw, Layers, Users, Calendar
} from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'

// --- Custom Tooltip Component ---
const ChartTooltip = ({ active, payload, x, y, isCurrency = true }) => {
  if (!active || !payload) return null
  return (
    <div 
      className="absolute z-50 bg-slate-950/90 backdrop-blur-xl text-white px-3.5 py-2 rounded-xl shadow-2xl border border-slate-700/40 text-[12px] pointer-events-none transition-all duration-150"
      style={{ left: `${x}px`, top: `${y - 45}px`, transform: 'translateX(-50%)' }}
    >
      <div className="font-extrabold text-cyan-400 border-b border-slate-800 pb-1 mb-1.5 uppercase tracking-wider">{payload.name}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-slate-400">Total Value:</span>
        <span className="font-mono font-bold text-slate-100">
          {isCurrency ? '₹' : ''}{payload.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      {payload.count !== undefined && (
        <div className="flex items-center justify-between gap-6 mt-1">
          <span className="text-slate-400">Proposals:</span>
          <span className="font-mono font-semibold text-slate-200">{payload.count}</span>
        </div>
      )}
    </div>
  )
}

export default function SalesDashboard() {
  const toast = useToast()
  const [quotations, setQuotations] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedCustomer, setSelectedCustomer] = useState('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Hover States
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null)
  const [hoveredBar, setHoveredBar] = useState(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const [quotRes, custRes] = await Promise.all([
        api.get('/api/quotation-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/customer-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => [])
      ])
      setQuotations(quotRes)
      setCustomers(custRes)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load sales metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesData()
  }, [])

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchesCustomer = selectedCustomer === 'ALL' || String(q.customerId) === selectedCustomer
      
      const qDate = q.quotationDate ? new Date(q.quotationDate) : null
      let matchesDate = true
      if (qDate) {
        if (fromDate && new Date(fromDate) > qDate) matchesDate = false
        if (toDate && new Date(toDate) < qDate) matchesDate = false
      }

      const custObj = customers.find(c => c.id === q.customerId)
      const customerName = custObj ? custObj.customerName : ''
      const matchesSearch = !searchQuery ||
        String(q.quotationNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCustomer && matchesDate && matchesSearch
    })
  }, [quotations, customers, selectedCustomer, fromDate, toDate, searchQuery])

  // KPI Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0
    let pipelineValue = 0
    let totalDeals = filteredQuotations.length
    let acceptedCount = 0
    let sentCount = 0
    let draftCount = 0
    let rejectedCount = 0

    filteredQuotations.forEach(q => {
      const val = q.totalAmount || 0
      if (q.status === 'Accepted') {
        totalRevenue += val
        acceptedCount++
      } else {
        if (q.status === 'Sent') {
          pipelineValue += val
          sentCount++
        } else if (q.status === 'Draft') {
          pipelineValue += val
          draftCount++
        } else if (q.status === 'Rejected') {
          rejectedCount++
        }
      }
    })

    const conversionRate = totalDeals > 0 ? (acceptedCount / totalDeals) * 100 : 0
    const avgDealSize = totalDeals > 0 ? (totalRevenue + pipelineValue) / totalDeals : 0

    return {
      totalRevenue,
      pipelineValue,
      totalDeals,
      avgDealSize,
      conversionRate,
      acceptedCount,
      sentCount,
      draftCount,
      rejectedCount
    }
  }, [filteredQuotations])

  // Pipeline Status Ratio Donut calculations
  const donutData = useMemo(() => {
    const total = stats.acceptedCount + stats.sentCount + stats.draftCount + stats.rejectedCount
    if (total === 0) return []

    const raw = [
      { name: 'Accepted', count: stats.acceptedCount, color: '#10b981', hoverColor: '#34d399', bgClass: 'bg-emerald-500' },
      { name: 'Sent', count: stats.sentCount, color: '#0097A7', hoverColor: '#00bcd4', bgClass: 'bg-cyan-500' },
      { name: 'Draft', count: stats.draftCount, color: '#64748b', hoverColor: '#94a3b8', bgClass: 'bg-slate-500' },
      { name: 'Rejected', count: stats.rejectedCount, color: '#ef4444', hoverColor: '#f87171', bgClass: 'bg-rose-500' }
    ]

    let cumulativePercentage = 0
    return raw.map(segment => {
      const percentage = (segment.count / total) * 100
      const strokeDasharray = `${percentage} ${100 - percentage}`
      const strokeDashoffset = 100 - cumulativePercentage + 25
      cumulativePercentage += percentage
      return {
        ...segment,
        percentage,
        strokeDasharray,
        strokeDashoffset
      }
    })
  }, [stats])

  // Top Customers by Quotation Value
  const topCustomerData = useMemo(() => {
    const map = {}
    filteredQuotations.forEach(q => {
      const custObj = customers.find(c => c.id === q.customerId)
      const name = custObj ? custObj.customerName : `Cust ID: ${q.customerId}`
      if (!map[name]) {
        map[name] = { name, value: 0, count: 0 }
      }
      map[name].value += q.totalAmount || 0
      map[name].count++
    })

    return Object.values(map)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [filteredQuotations, customers])

  // Monthly Sales trend calculation for Area Chart
  const monthlyTrendData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const map = {}
    
    filteredQuotations.forEach(q => {
      const date = q.quotationDate ? new Date(q.quotationDate) : null
      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!map[key]) {
          map[key] = { label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`, value: 0, sortKey: key }
        }
        map[key].value += q.totalAmount || 0
      }
    })

    return Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }, [filteredQuotations])

  // Recent Quotations
  const recentQuotationsList = useMemo(() => {
    return [...filteredQuotations]
      .sort((a, b) => new Date(b.quotationDate) - new Date(a.quotationDate))
      .slice(0, 5)
  }, [filteredQuotations])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  // Monthly line coordinates generator
  const areaChartPath = useMemo(() => {
    if (monthlyTrendData.length < 2) return { line: '', area: '', points: [] }
    const width = 500
    const height = 150
    const padding = 20
    const chartW = width - padding * 2
    const chartH = height - padding * 2
    
    const values = monthlyTrendData.map(d => d.value)
    const maxVal = Math.max(...values) || 1
    const minVal = 0

    const points = monthlyTrendData.map((d, i) => {
      const x = padding + (i / (monthlyTrendData.length - 1)) * chartW
      const y = padding + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH
      return { x, y, name: d.label, value: d.value }
    })

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

    return { line: linePath, area: areaPath, points }
  }, [monthlyTrendData])

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 pb-12 font-sans selection:bg-cyan-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-card {
          background: rgba(17, 24, 39, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
        }
        .glass-input:focus {
          border-color: #00bcd4;
          box-shadow: 0 0 10px rgba(0, 188, 212, 0.2);
        }
      `}</style>

      {/* Header Banner */}
      <div className="px-8 py-6 bg-slate-950/60 backdrop-blur-md border-b border-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2 uppercase tracking-widest font-extrabold">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Velson ERP</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-cyan-400">Sales Dashboard</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <DollarSign className="w-6 h-6 animate-pulse" />
            </div>
            SALES ANALYSIS
          </h1>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Customer Selector */}
          <div className="relative">
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="px-4 py-2.5 glass-input rounded-xl text-[12px] font-bold focus:outline-none transition-all pr-10 cursor-pointer"
            >
              <option value="ALL" className="bg-[#0b0f19] text-slate-350">ALL CUSTOMERS</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0b0f19] text-slate-350">{c.customerName.toUpperCase()}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <Users size={14} className="text-slate-500" />
            </div>
          </div>

          {/* Date range pickers */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 shadow-inner">
            <Calendar size={14} className="text-slate-500" />
            <input 
              type="date" 
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-slate-300 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input 
              type="date" 
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-slate-300 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search quotation / customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 glass-input rounded-xl text-[12.5px] focus:outline-none transition-all w-64 placeholder-slate-500"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchSalesData}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all shadow-md active:scale-95 text-slate-300 hover:text-cyan-400"
            title="Refresh Metrics"
          >
            <RefreshCw size={15} className={`${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-8 mt-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="glass-card rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[450px]">
            <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-200 tracking-wide uppercase">Compiling Sales Analytics</h3>
            <p className="text-slate-500 text-sm mt-1">Aggregating deal values and customer conversion rates</p>
          </div>
        )}

        {!loading && (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Revenue */}
              <div className="glass-card rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300 text-emerald-400">
                  <DollarSign className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Closed Sales Revenue</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-black font-mono tracking-tight text-slate-100">
                    ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-450">
                    <span className="font-extrabold text-emerald-400">{stats.acceptedCount}</span> proposals won
                  </div>
                </div>
              </div>

              {/* Active Pipeline */}
              <div className="glass-card rounded-2xl p-6 hover:border-slate-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300 text-cyan-400">
                  <Layers className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proposal Pipeline value</span>
                  <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(0,188,212,0.15)]">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
                    ₹{stats.pipelineValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                    Draft & Sent proposals
                  </div>
                </div>
              </div>

              {/* Average Deal Size */}
              <div className="glass-card rounded-2xl p-6 hover:border-slate-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Deal Size</span>
                  <div className="p-2 bg-slate-500/10 rounded-xl border border-slate-500/20 text-slate-300">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
                    ₹{stats.avgDealSize.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                    Per transaction average
                  </div>
                </div>
              </div>

              {/* Pipeline Conversion Rate */}
              <div className="glass-card rounded-2xl p-6 hover:border-slate-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300 text-emerald-500">
                  <CircleDot className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deal Conversion Rate</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <CircleDot className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
                    {stats.conversionRate.toFixed(1)}%
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                    Ratio of accepted deals
                  </div>
                </div>
              </div>

            </div>

            {/* Charts & Interactive Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Donut Chart: Sales Pipeline Ratio */}
              <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-cyan-400" />
                    Pipeline Proposal Ratios
                  </h3>
                </div>

                <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {donutData.length === 0 ? (
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#1e293b" strokeWidth="10" />
                    ) : (
                      donutData.map((seg, idx) => (
                        <circle
                          key={idx}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke={hoveredDonutSegment === seg.name ? seg.hoverColor : seg.color}
                          strokeWidth={hoveredDonutSegment === seg.name ? '14' : '10'}
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          pathLength="100"
                          className="transition-all duration-300 cursor-pointer"
                          style={{
                            filter: hoveredDonutSegment === seg.name ? `drop-shadow(0 0 8px ${seg.color})` : 'none'
                          }}
                          onMouseEnter={() => setHoveredDonutSegment(seg.name)}
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                        />
                      ))
                    )}
                  </svg>

                  <div className="absolute flex flex-col items-center text-center">
                    {hoveredDonutSegment ? (
                      (() => {
                        const seg = donutData.find(s => s.name === hoveredDonutSegment)
                        return (
                          <>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{seg.name}</span>
                            <span className="text-2xl font-black text-slate-100 font-mono mt-0.5">{seg.count}</span>
                            <span className="text-[11px] font-bold text-cyan-400">{seg.percentage.toFixed(1)}%</span>
                          </>
                        )
                      })()
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Proposals</span>
                        <span className="text-3xl font-black text-slate-100 font-mono mt-0.5">{stats.totalDeals}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="w-full grid grid-cols-4 gap-1 mt-8 border-t border-slate-800/80 pt-5">
                  {donutData.map((seg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col items-center p-1.5 rounded-xl transition-all cursor-pointer text-center ${hoveredDonutSegment === seg.name ? 'bg-white/5 border border-white/5' : 'border border-transparent'}`}
                      onMouseEnter={() => setHoveredDonutSegment(seg.name)}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    >
                      <div className="flex items-center gap-1 mb-1 justify-center">
                        <span className={`w-1.5 h-1.5 rounded-full ${seg.bgClass}`} style={{ boxShadow: `0 0 6px ${seg.color}` }} />
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-16">{seg.name}</span>
                      </div>
                      <span className="text-[12px] font-bold font-mono text-slate-200">{seg.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Area Chart: Monthly Quotation Trend */}
              <div 
                className="glass-card rounded-2xl p-6 lg:col-span-2 relative flex flex-col"
                onMouseMove={handleMouseMove}
              >
                <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Quotation Value Trends (MoM)
                  </h3>
                </div>

                <div className="flex-1 relative min-h-[160px]">
                  {monthlyTrendData.length < 2 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Insufficient data points to map trend line</div>
                  ) : (
                    <>
                      <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00bcd4" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#00bcd4" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={areaChartPath.area} fill="url(#areaGradient)" />
                        <path d={areaChartPath.line} fill="none" stroke="#00bcd4" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 4px rgba(0,188,212,0.3))' }} />
                        {areaChartPath.points.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint && hoveredPoint.name === p.name ? "6" : "4"}
                            fill="#00bcd4"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredPoint({ name: p.name, value: p.value })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        ))}
                      </svg>
                      
                      <div className="flex justify-between mt-2 px-4">
                        {monthlyTrendData.map((d, i) => (
                          <span key={i} className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{d.label.split(' ')[0]}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <ChartTooltip active={!!hoveredPoint} payload={hoveredPoint} x={tooltipPos.x} y={tooltipPos.y} />
              </div>

            </div>

            {/* Bottom Grid: Top Customers & Recent Quotations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Top Customers Horizontal Bar Chart */}
              <div 
                className="glass-card rounded-2xl p-6 lg:col-span-1 relative flex flex-col"
                onMouseMove={handleMouseMove}
              >
                <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-350 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Top Customer Accounts
                  </h3>
                </div>

                <div className="flex-1 flex flex-col justify-between min-h-[220px]">
                  {topCustomerData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No Customer Data Available</div>
                  ) : (
                    topCustomerData.map((customer, idx) => {
                      const maxVal = Math.max(...topCustomerData.map(c => c.value)) || 1
                      const barPercentage = (customer.value / maxVal) * 100
                      return (
                        <div 
                          key={idx} 
                          className="group/bar flex items-center gap-4 py-1.5 hover:bg-white/5 px-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5"
                          onMouseEnter={(e) => setHoveredBar({ name: customer.name, value: customer.value, count: customer.count })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div className="w-24 text-left truncate">
                            <span className="text-[11.5px] font-bold text-slate-400 group-hover/bar:text-cyan-400 transition-colors uppercase tracking-wider">{customer.name}</span>
                          </div>
                          <div className="flex-1 h-6 bg-slate-950/80 rounded-lg overflow-hidden relative border border-white/5 shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-[#00bcd4]/40 to-[#00bcd4] rounded-lg transition-all duration-500"
                              style={{ 
                                width: `${barPercentage}%`,
                                boxShadow: '0 0 10px rgba(0, 188, 212, 0.3)' 
                              }}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9.5px] font-mono font-bold text-slate-300">
                              ₹{customer.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <ChartTooltip active={!!hoveredBar} payload={hoveredBar} x={tooltipPos.x} y={tooltipPos.y} />
              </div>

              {/* Recent Quotation Proposals Table */}
              <div className="glass-card rounded-2xl p-6 lg:col-span-2 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-350 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Recent Quotations log
                  </h3>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-white/5 border border-white/5 px-2.5 py-0.5 rounded tracking-wider">Pipeline Logs</span>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[9px] uppercase text-slate-500 font-extrabold">
                        <th className="py-2.5 px-2">Proposal Ref</th>
                        <th className="py-2.5 px-2">Customer Account</th>
                        <th className="py-2.5 px-2 text-right">Total amount</th>
                        <th className="py-2.5 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {recentQuotationsList.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-500 text-sm font-semibold">No recent proposals logged</td>
                        </tr>
                      ) : (
                        recentQuotationsList.map((row, idx) => {
                          const custObj = customers.find(c => c.id === row.customerId)
                          const customerName = custObj ? custObj.customerName : '—'
                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-all">
                              <td className="py-3.5 px-2 font-bold text-slate-200 text-[12px]">{row.quotationNo}</td>
                              <td className="py-3.5 px-2 text-[12.5px] text-slate-450 font-bold truncate max-w-44">{customerName}</td>
                              <td className="py-3.5 px-2 text-right font-mono font-bold text-slate-350 text-[12px]">
                                ₹{(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-2 text-center">
                                <span className={`inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-full ${
                                  row.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                  row.status === 'Sent' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                  row.status === 'Draft' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  )
}