import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight, ArrowUpRight, ArrowDownRight, Warehouse, AlertTriangle,
  Search, ShieldAlert, Package, CircleDot, RefreshCw, Layers, TrendingUp,
  Plus, ArrowRight, BarChart2, CheckCircle2, ShoppingCart, Send, FileText,
  Clock, CheckSquare, Settings, Play, BarChart, Hammer, Info, User
} from 'lucide-react'
import api from '../services/api'
import { useCustomers } from '../hooks/useMasterData'
import { useToast } from '../components/Toast'
import { getSocket } from '../services/socket'

// --- Custom Tooltip Component ---
const ChartTooltip = ({ active, payload, x, y }) => {
  if (!active || !payload) return null
  return (
    <div
      className="absolute z-50 bg-[#0D0E16] backdrop-blur-md text-[#fafafa] px-4 py-2.5 rounded-xl shadow-2xl border border-slate-800 text-[12px] pointer-events-none transition-all duration-150"
      style={{ left: `${x}px`, top: `${y - 50}px`, transform: 'translateX(-50%)' }}
    >
      <div className="font-extrabold text-[#0C5CAB] border-b border-slate-800 pb-1 mb-2 uppercase tracking-wider">{payload.name}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-slate-400">{payload.label || 'Value'}:</span>
        <span className="font-mono font-bold text-[#fafafa]">
          {payload.value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// --- Radial Progress Gauge for Machine OEE ---
const RadialGauge = ({ value, label, size = 110, strokeWidth = 8, color = '#10b981' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth={strokeWidth}
        />
        {/* Active Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}33)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-black font-mono tracking-tighter text-[#fafafa]">{Math.round(value)}%</span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )
}

// --- Historical Line Chart (30 Days) ---
const ProductionHistoryChart = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const width = 600
  const height = 220
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 30

  const drawWidth = width - paddingLeft - paddingRight
  const drawHeight = height - paddingTop - paddingBottom

  const values = useMemo(() => data.map(d => d.qty), [data])
  const targetValues = useMemo(() => data.map(d => d.target), [data])
  const maxVal = useMemo(() => Math.max(...values, ...targetValues, 10), [values, targetValues])

  const coordinates = useMemo(() => {
    return data.map((d, idx) => {
      const x = paddingLeft + (idx / (data.length - 1)) * drawWidth
      const y = paddingTop + drawHeight - (d.qty / maxVal) * drawHeight
      const targetY = paddingTop + drawHeight - (d.target / maxVal) * drawHeight
      return { x, y, targetY, date: d.date, qty: d.qty, target: d.target }
    })
  }, [data, maxVal, drawWidth, drawHeight])

  const linePath = useMemo(() => {
    if (coordinates.length === 0) return ''
    return coordinates.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  }, [coordinates])

  const targetPath = useMemo(() => {
    if (coordinates.length === 0) return ''
    return coordinates.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.targetY}`).join(' ')
  }, [coordinates])

  const areaPath = useMemo(() => {
    if (coordinates.length === 0) return ''
    const baselineY = paddingTop + drawHeight
    return `${linePath} L ${coordinates[coordinates.length - 1].x} ${baselineY} L ${coordinates[0].x} ${baselineY} Z`
  }, [coordinates, linePath, drawHeight])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) * (width / rect.width)
    const relativeX = mouseX - paddingLeft
    const pct = relativeX / drawWidth
    const rawIdx = Math.round(pct * (data.length - 1))
    const index = Math.min(data.length - 1, Math.max(0, rawIdx))
    setHoveredIndex(index)
    setTooltipPos({
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top)
    })
  }

  return (
    <div className="relative w-full h-[220px]" onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredIndex(null)}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0C5CAB" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0C5CAB" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + ratio * drawHeight
          const gridVal = maxVal - ratio * maxVal
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="4,4" />
              <text x={paddingLeft - 8} y={y + 4} fill="#888" fontSize="9" textAnchor="end" className="font-mono">
                {Math.round(gridVal)}
              </text>
            </g>
          )
        })}

        {/* Areas & Lines */}
        {areaPath && <path d={areaPath} fill="url(#prodGradient)" />}
        {targetPath && <path d={targetPath} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />}
        {linePath && <path d={linePath} fill="none" stroke="#0C5CAB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Hover elements */}
        {hoveredIndex !== null && coordinates[hoveredIndex] && (
          <g>
            <line
              x1={coordinates[hoveredIndex].x}
              y1={paddingTop}
              x2={coordinates[hoveredIndex].x}
              y2={paddingTop + drawHeight}
              stroke="rgba(12, 92, 171, 0.3)"
              strokeDasharray="2,2"
            />
            <circle cx={coordinates[hoveredIndex].x} cy={coordinates[hoveredIndex].y} r="5" fill="#0C5CAB" stroke="#fafafa" strokeWidth="1.5" />
            <circle cx={coordinates[hoveredIndex].x} cy={coordinates[hoveredIndex].targetY} r="4" fill="#666" stroke="#fafafa" strokeWidth="1" />
          </g>
        )}
      </svg>

      {hoveredIndex !== null && coordinates[hoveredIndex] && (
        <div
          className="absolute z-50 bg-[#090D16] border border-slate-800 rounded-xl p-2.5 text-left pointer-events-none shadow-xl text-[11px]"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 65}px`, transform: 'translateX(-50%)' }}
        >
          <div className="font-bold text-slate-400">{coordinates[hoveredIndex].date}</div>
          <div className="flex gap-4 mt-1.5">
            <span className="text-[#0C5CAB] font-bold">Qty Produced: <span className="font-mono text-white font-black">{coordinates[hoveredIndex].qty}</span></span>
            <span className="text-slate-500">Target: <span className="font-mono text-slate-350">{coordinates[hoveredIndex].target}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MainDashboard() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('executive')
  const [loading, setLoading] = useState(true)

  const { data: customers = [] } = useCustomers()

  // Database States
  const [jobCards, setJobCards] = useState([])
  const [machines, setMachines] = useState([])
  const [breakdowns, setBreakdowns] = useState([])
  const [quotations, setQuotations] = useState([])
  const [qcMethods, setQcMethods] = useState([])
  const [complaints, setComplaints] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])

  const loadAllMetrics = async () => {
    setLoading(true)
    try {
      const [jobsRes, machRes, breakRes, quotRes, qcRes, compRes, prRes, poRes] = await Promise.all([
        api.get('/api/job-card', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/machine-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/machine-breakdown', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/quotation-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/qc-check-method', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/customer-complaint', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/purchase-request', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/purchase-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => [])
        api.get('/api/job-card?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/machine-master?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/machine-breakdown?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/quotation-master?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/qc-check-method?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/customer-complaint?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/purchase-request?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/purchase-master?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => [])
      ])

      setJobCards(jobsRes)
      setMachines(machRes)
      setBreakdowns(breakRes)
      setQuotations(quotRes)
      setQcMethods(qcRes)
      setComplaints(compRes)
      setPurchaseRequests(prRes)
      setPurchaseOrders(poRes)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load system dashboard analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllMetrics()

    // Realtime Socket.IO listener to keep data fresh without refreshing the page
    const socket = getSocket()
    const handleRefresh = (data) => {
      console.log('[Socket] Refreshing Main Dashboard data in realtime:', data)
      loadAllMetrics()
    }

    socket.on('dashboard.refresh', handleRefresh)
    socket.on('stock.adjusted', handleRefresh)
    socket.on('stock.updated', handleRefresh)
    socket.on('jobcard.completed', handleRefresh)
    socket.on('complaint.created', handleRefresh)

    return () => {
      socket.off('dashboard.refresh', handleRefresh)
      socket.off('stock.adjusted', handleRefresh)
      socket.off('stock.updated', handleRefresh)
      socket.off('jobcard.completed', handleRefresh)
      socket.off('complaint.created', handleRefresh)
    }
  }, [])

  // Dynamic calculations connected to database records
  const stats = useMemo(() => {
    // 1. Sales metrics
    let acceptedSalesValue = 0
    let pendingSalesValue = 0
    quotations.forEach(q => {
      const val = q.grandTotal || q.total || 0
      if (q.status === 'Accepted' || q.status === 'Approved') {
        acceptedSalesValue += val
      } else {
        pendingSalesValue += val
      }
    })

    // 2. Active Job cards
    const activeJobs = jobCards.filter(j => j.status !== 'Closed' && j.status !== 'Cancelled')
    const completedJobs = jobCards.filter(j => j.status === 'Completed' || j.status === 'Closed')

    // 3. Machine Breakdowns
    const activeBreakdowns = breakdowns.filter(b => b.status === 'Open' || b.status === 'waiting_clearance')

    // 4. Procurement metrics
    const activePRs = purchaseRequests.filter(pr => pr.status !== 'Approved' && pr.status !== 'Completed')
    const activePOs = purchaseOrders.filter(po => po.status !== 'Closed' && po.status !== 'Cancelled')

    return {
      acceptedSalesValue,
      pendingSalesValue,
      activeJobsCount: activeJobs.length,
      completedJobsCount: completedJobs.length,
      activeBreakdownsCount: activeBreakdowns.length,
      activePRsCount: activePRs.length,
      activePOsCount: activePOs.length,
      totalQuotationCount: quotations.length,
      complaintsOpenCount: complaints.filter(c => c.status === 'Open').length
    }
  }, [quotations, jobCards, breakdowns, purchaseRequests, purchaseOrders, complaints])

  // Parse actual Job Cards into a 30-day historical chart (reading from workingEndDate/approvedDate/createdAt)
  const productionHistory = useMemo(() => {
    const dailyData = {}
    const now = new Date()

    // Initialise 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dailyData[key] = {
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        qty: 0,
        target: 100 // static comparison target
      }
    }

    // Populate actual data from database
    jobCards.forEach(jc => {
      // User selected: Read from 'approvedDate' or 'workingEndDate'
      const dateVal = jc.workingEndDate || jc.approvedDate || jc.createdAt
      if (dateVal) {
        const dateKey = new Date(dateVal).toISOString().split('T')[0]
        if (dailyData[dateKey]) {
          // Accumulate target yield quantities
          let qty = jc.qtyV || 0
          if (jc.lineItems && jc.lineItems.length > 0) {
            jc.lineItems.forEach(li => {
              qty += li.planQty || 0
            })
          }
          dailyData[dateKey].qty += qty
        }
      }
    })

    return Object.values(dailyData)
  }, [jobCards])

  // Calculate dynamic OEE per Machine based on active breakdown status
  const machineOeeList = useMemo(() => {
    return machines.map(mach => {
      const activeBDs = breakdowns.filter(b => b.machineName === mach.machineName && (b.status === 'Open' || b.status === 'waiting_clearance'))
      const allBDs = breakdowns.filter(b => b.machineName === mach.machineName)

      let oee = 88 // baseline OEE
      let availability = 92
      let performance = 95
      let quality = 99

      if (activeBDs.length > 0) {
        oee = 0
        availability = 0
        performance = 0
      } else {
        // Decrease OEE value dynamically based on historical breakdown frequency
        const penalty = allBDs.length * 4
        oee = Math.max(50, 88 - penalty)
        availability = Math.max(60, 92 - penalty)
        performance = Math.max(70, 95 - penalty / 2)
      }

      return {
        ...mach,
        isDown: activeBDs.length > 0,
        activeBD: activeBDs[0] || null,
        oee,
        availability,
        performance,
        quality
      }
    })
  }, [machines, breakdowns])

  const navigateTo = (pageName) => {
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: pageName } }))
  }

  return (
    <div className="bg-[#090D16] min-h-screen text-[#fafafa] pb-16 font-sans selection:bg-[#0C5CAB]/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700;800;900&display=swap');
        .font-sans { font-family: 'IBM Plex Sans', sans-serif; }
        .glass-panel {
          background: #0E1320;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.03);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        }
        .glass-panel:hover {
          border-color: rgba(255, 255, 255, 0.06);
        }
        .active-tab-glow {
          box-shadow: 0 0 15px rgba(12, 92, 171, 0.25);
        }
      `}</style>

      {/* Header */}
      <div className="px-8 py-6 bg-[#090D16]/95 border-b border-slate-900 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-extrabold">
              <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={() => navigateTo('Dashboard')}>Velson ERP</span>
              <ChevronRight className="w-3 h-3 text-slate-700" />
              <span className="text-[#0C5CAB]">Production Console</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-[#0C5CAB]/10 border border-[#0C5CAB]/20 text-[#0C5CAB] rounded-xl active-tab-glow">
                <BarChart className="w-6 h-6 animate-pulse" />
              </div>
              SYSTEM OPERATIONS CENTER
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllMetrics}
              className="p-3 bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-[#0C5CAB]"
              title="Refresh Live Metrics"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#0C5CAB]' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 mt-8 max-w-[1600px] mx-auto space-y-8">

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Sales Pipeline */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300 text-blue-500">
              <TrendingUp className="w-36 h-36" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Funnel Value</span>
            <h3 className="text-2xl font-extrabold font-mono tracking-tight text-[#fafafa] mt-4">
              ₹{stats.acceptedSalesValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Pipeline: ₹{stats.pendingSalesValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Active Job Cards */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300 text-indigo-500">
              <CheckSquare className="w-36 h-36" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Job Cards</span>
            <h3 className="text-2xl font-extrabold font-mono tracking-tight text-[#fafafa] mt-4">
              {stats.activeJobsCount}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Completed runs: {stats.completedJobsCount}</span>
            </div>
          </div>

          {/* Procures pending */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300 text-emerald-500">
              <ShoppingCart className="w-36 h-36" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Procurement Drafts</span>
            <h3 className="text-2xl font-extrabold font-mono tracking-tight text-[#fafafa] mt-4">
              {stats.activePRsCount}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Approved POs: {stats.activePOsCount}</span>
            </div>
          </div>

          {/* Alert Counter */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300 text-rose-500">
              <AlertTriangle className="w-36 h-36" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Critical Warnings</span>
            <h3 className={`text-2xl font-extrabold font-mono tracking-tight mt-4 ${stats.activeBreakdownsCount > 0 || stats.complaintsOpenCount > 0 ? 'text-[#ef4444]' : 'text-[#fafafa]'}`}>
              {stats.activeBreakdownsCount + stats.complaintsOpenCount}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>{stats.activeBreakdownsCount} Breakdowns | {stats.complaintsOpenCount} Complaints</span>
            </div>
          </div>

        </div>

        {/* Tab Selection */}
        <div className="border-b border-slate-900 pb-px flex items-center gap-6 overflow-x-auto scrollbar-none">
          {[
            { id: 'executive', name: 'Executive Overview', icon: BarChart },
            { id: 'shopfloor', name: 'Shop Floor & Jobs', icon: CheckSquare },
            { id: 'machine', name: 'Machine OEE Grid', icon: Settings },
            { id: 'quality', name: 'Quality & Complaints', icon: CheckCircle2 }
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 relative ${active
                  ? 'text-[#0C5CAB] border-[#0C5CAB]'
                  : 'text-slate-500 border-transparent hover:text-slate-350'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="glass-panel rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[350px]">
            <RefreshCw className="w-12 h-12 text-[#0C5CAB] animate-spin mb-4" />
            <h3 className="text-md font-bold uppercase text-slate-200 tracking-wider">Syncing Databases</h3>
            <p className="text-slate-500 text-xs mt-1">Fetching live system parameters...</p>
          </div>
        )}

        {/* Dynamic tabs data view */}
        {!loading && (
          <div className="space-y-8">

            {/* Executive Tab */}
            {activeTab === 'executive' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 30 Day Production Line Chart */}
                <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">30-Day Historical Yield Chart</span>
                    <div className="flex items-center gap-4 text-[10px] text-slate-450 font-bold uppercase">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0C5CAB]" /> Produced (Line Items)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white/20 border border-dashed border-white/40" /> Schedule Target</span>
                    </div>
                  </div>
                  {productionHistory.every(d => d.qty === 0) ? (
                    <div className="h-[220px] flex flex-col items-center justify-center text-slate-500">
                      <BarChart2 className="w-8 h-8 opacity-20 mb-2" />
                      <span className="text-xs">No production records found for approved/completed jobs in this window</span>
                    </div>
                  ) : (
                    <ProductionHistoryChart data={productionHistory} />
                  )}
                </div>

                {/* Sales Pipeline breakdown */}
                <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sales Quotation pipeline</span>
                    </div>
                    <div className="space-y-4 py-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Total Quotations Logged:</span>
                        <span className="font-mono font-bold text-white">{stats.totalQuotationCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#10b981]">Accepted (Valued):</span>
                        <span className="font-mono font-bold text-[#10b981]">₹{stats.acceptedSalesValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#f59e0b]">Pending Pipeline:</span>
                        <span className="font-mono font-bold text-[#f59e0b]">₹{stats.pendingSalesValue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-4 mt-6">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Top Customers list</span>
                    <div className="space-y-2">
                      {customers.slice(0, 4).map((cust, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs hover:bg-white/2 py-1 px-1.5 rounded transition-all">
                          <span className="text-slate-350 truncate max-w-40 font-bold">{cust.customerName}</span>
                          <span className="text-[9px] font-bold bg-[#0C5CAB]/10 text-cyan-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{cust.companyType || 'Client'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Shop Floor & Job Cards */}
            {activeTab === 'shopfloor' && (
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Manufacturing Routing runs</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-[10px] uppercase text-slate-500 font-black">
                        <th className="pb-3 pr-4">Job No</th>
                        <th className="pb-3 pr-4">Part details</th>
                        <th className="pb-3 pr-4">Priority</th>
                        <th className="pb-3 pr-4 text-right">Target Qty</th>
                        <th className="pb-3 pr-4 text-right">Yield Progress</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {jobCards.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-10 text-center text-slate-500 text-xs">No active Job Cards compiled</td>
                        </tr>
                      ) : (
                        jobCards.slice(0, 10).map((job, idx) => {
                          const progress = job.completedPct || 0
                          return (
                            <tr key={idx} className="hover:bg-white/2 transition-colors">
                              <td className="py-3.5 pr-4 font-bold text-white text-[12.5px]">{job.jobNo}</td>
                              <td className="py-3.5 pr-4">
                                <div className="text-[12px] text-slate-200">{job.productName || 'General Machine Part'}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{job.partNo || 'SKU-NONE'}</div>
                              </td>
                              <td className="py-3.5 pr-4">
                                <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${job.priority === 'High'
                                  ? 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse'
                                  : 'bg-slate-800/40 text-slate-400'
                                  }`}>
                                  {job.priority || 'Medium'}
                                </span>
                              </td>
                              <td className="py-3.5 pr-4 text-right font-mono text-[12px] text-slate-300">{job.qty || 0}</td>
                              <td className="py-3.5 pr-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <span className="font-mono text-[11px] font-bold text-slate-350">{Math.round(progress)}%</span>
                                  <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-[#0C5CAB]" style={{ width: `${progress}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="inline-block px-2 py-0.5 text-[8.5px] font-black uppercase rounded bg-white/3 text-slate-450 border border-white/5">
                                  {job.status}
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
            )}

            {/* Machine Monitor OEE Grid */}
            {activeTab === 'machine' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {machineOeeList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-500 text-xs">No machines registered in database</div>
                ) : (
                  machineOeeList.map((mach, idx) => (
                    <div key={idx} className="glass-panel rounded-2xl p-6 flex items-center justify-between group">
                      <div className="space-y-4 pr-4 flex-1">
                        <div>
                          <div className="text-[13px] font-bold text-white tracking-wide uppercase">{mach.machineName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{mach.machineCode}</div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
                          {mach.isDown ? (
                            <span className="flex flex-col gap-1 text-[#ef4444]">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444] animate-ping" /> BREAKDOWN ACTIVE</span>
                              <span className="text-[8.5px] text-slate-500 lowercase truncate max-w-40 font-mono">"{mach.activeBD?.problemDescription}"</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[#10b981]"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> ONLINE</span>
                          )}
                        </div>
                      </div>

                      <RadialGauge
                        value={mach.oee}
                        label="OEE"
                        color={mach.isDown ? '#ef4444' : '#10b981'}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* QC & Complaints */}
            {activeTab === 'quality' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* QC Standard Checklist list */}
                <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Quality Check methods</span>
                  </div>
                  <div className="space-y-3">
                    {qcMethods.length === 0 ? (
                      <div className="text-center text-slate-500 text-xs py-8 font-semibold">No QC check standards configured yet</div>
                    ) : (
                      qcMethods.slice(0, 5).map((qc, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white/2 rounded-xl border border-white/5 hover:bg-white/3 transition-all">
                          <div>
                            <div className="text-xs font-bold text-white">{qc.checkName || 'Inspection'}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{qc.parameter || 'Dimension checks'}</div>
                          </div>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20 font-black uppercase">Active Standard</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Customer complaints logs */}
                <div className="glass-panel rounded-2xl p-6">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Complaints feed</span>
                    <span className="text-[8.5px] bg-[#ef4444]/15 border border-[#ef4444]/25 text-[#ef4444] px-2 py-0.5 rounded font-black uppercase tracking-wider">{stats.complaintsOpenCount} Open</span>
                  </div>
                  <div className="space-y-4 overflow-y-auto max-h-[250px]">
                    {complaints.length === 0 ? (
                      <div className="text-center text-slate-500 text-xs py-8">No customer complaints logged</div>
                    ) : (
                      complaints.slice(0, 5).map((comp, idx) => (
                        <div key={idx} className="flex gap-3 text-xs border-b border-slate-900 pb-3 last:border-b-0">
                          <div className={`p-1.5 rounded h-fit ${comp.status === 'Open' ? 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20' : 'bg-slate-800 text-slate-400'}`}>
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-200 truncate max-w-32">{comp.customerName}</span>
                              <span className="text-[9px] font-mono text-slate-500">{comp.ccNo}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">"{comp.natureOfComplaint || 'No description provided'}"</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
