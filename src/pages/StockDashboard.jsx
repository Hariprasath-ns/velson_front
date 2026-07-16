import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight, ArrowUpRight, ArrowDownRight, Warehouse, AlertTriangle, 
  Search, ShieldAlert, Package, CircleDot, RefreshCw, Layers, TrendingUp,
  Plus, ArrowRight, BarChart2, CheckCircle2, ShoppingCart, Send, FileText,
  Percent, DollarSign, Activity
} from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import { getSocket } from '../services/socket'

// --- Custom Tooltip Component ---
const ChartTooltip = ({ active, payload, x, y }) => {
  if (!active || !payload) return null
  return (
    <div 
      className="absolute z-50 bg-slate-950/95 backdrop-blur-xl text-white px-4 py-2.5 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-slate-800/80 text-[12px] pointer-events-none transition-all duration-150"
      style={{ left: `${x}px`, top: `${y - 50}px`, transform: 'translateX(-50%)' }}
    >
      <div className="font-extrabold text-cyan-400 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wider text-[11px]">{payload.name}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-slate-400">Total Value:</span>
        <span className="font-mono font-bold text-slate-100 text-right">
          ₹{payload.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      {payload.qty !== undefined && (
        <div className="flex items-center justify-between gap-6 mt-1.5">
          <span className="text-slate-400">Stock Qty:</span>
          <span className="font-mono font-semibold text-slate-200 text-right">{payload.qty.toLocaleString('en-IN')}</span>
        </div>
      )}
      {payload.itemsCount !== undefined && (
        <div className="flex items-center justify-between gap-6 mt-1.5">
          <span className="text-slate-400">Total Items:</span>
          <span className="font-mono font-semibold text-slate-200 text-right">{payload.itemsCount}</span>
        </div>
      )}
    </div>
  )
}

// Helper to draw mini-sparklines for the KPI cards
const Sparkline = ({ points, color }) => {
  if (!points || points.length < 2) return null;
  const width = 120;
  const height = 30;
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;
  const path = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - minVal) / range) * (height - 4) - 2;
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-80">
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};export default function StockDashboard() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [itemGroups, setItemGroups] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [materialRequests, setMaterialRequests] = useState([])
  const [grnMasters, setGrnMasters] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [deliveryChallans, setDeliveryChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null)
  const [hoveredBar, setHoveredBar] = useState(null)
  const [hoveredTrendDay, setHoveredTrendDay] = useState(null)
  const [hoveredSupplierSegment, setHoveredSupplierSegment] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [itemsRes, groupsRes, adjustmentsRes, mrRes, grnRes, prRes, dcRes] = await Promise.all([
        api.get('/api/item-master?limit=100000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/item-group-master?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/stock-adjustment?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/material-request?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/grn-master?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/purchase-request?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/delivery-challan?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => [])
      ])

      setItems(itemsRes)
      setItemGroups(groupsRes)
      setAdjustments(adjustmentsRes)
      setMaterialRequests(mrRes)
      setGrnMasters(grnRes)
      setPurchaseRequests(prRes)
      setDeliveryChallans(dcRes)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Realtime Socket.IO listener to keep data fresh without refreshing the page
    const socket = getSocket()
    const handleRefresh = (data) => {
      console.log('[Socket] Refreshing Stock Dashboard data in realtime:', data)
      fetchDashboardData()
    }

    const events = [
      'dashboard.refresh',
      'stock.adjusted',
      'stock.updated',
      'item.created',
      'item.updated',
      'item.deleted',
      'purchase-request.created',
      'purchase-request.approved',
      'grn.created',
      'grn.updated',
      'grn.completed',
      'material-request.created',
      'material-request.approved',
      'delivery-challan.created'
    ]

    events.forEach(event => socket.on(event, handleRefresh))

    return () => {
      events.forEach(event => socket.off(event, handleRefresh))
    }
  }, [])

  // Calculate stock ledger (identical logic to StockManagement)
  const stockLedger = useMemo(() => {
    const adjustmentBalance = {}
    adjustments.forEach(adj => {
      const code = String(adj.partNo || '').trim().toLowerCase()
      if (code) {
        const delta = adj.type === 'INWARD' ? (adj.qty || 0) : -(adj.qty || 0)
        adjustmentBalance[code] = (adjustmentBalance[code] || 0) + delta
      }
    })

    return items.map(item => {
      const codeKey = String(item.partNo || '').trim().toLowerCase()
      const adjVal = adjustmentBalance[codeKey] || 0
      const currentStock = Math.max(0, adjVal) 
      const purchaseRate = item.purchaseRate || item.rate || 0
      const stockValue = currentStock * purchaseRate

      let status = 'Normal'
      const minVal = item.minStock || 0
      if (currentStock <= 0) {
        status = 'Out of Stock'
      } else if (currentStock <= minVal) {
        status = 'Low Stock'
      }

      const groupObj = itemGroups.find(g => g.id === item.groupId)
      const groupName = groupObj ? groupObj.groupName : 'General'

      return {
        ...item,
        groupName,
        currentStock,
        stockValue,
        status
      }
    })
  }, [items, itemGroups, adjustments])

  const filteredLedger = useMemo(() => {
    return stockLedger.filter(item => {
      const matchesGroup = selectedGroup === 'ALL' || item.groupName === selectedGroup
      const matchesSearch = !searchQuery || 
        String(item.partNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.partName || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchesGroup && matchesSearch
    })
  }, [stockLedger, selectedGroup, searchQuery])

  const stats = useMemo(() => {
    let totalVal = 0
    let totalQty = 0
    let normalCount = 0
    let lowCount = 0
    let outCount = 0

    filteredLedger.forEach(item => {
      totalVal += item.stockValue
      totalQty += item.currentStock
      if (item.status === 'Normal') normalCount++
      else if (item.status === 'Low Stock') lowCount++
      else if (item.status === 'Out of Stock') outCount++
    })

    return {
      totalValue: totalVal,
      totalQty,
      totalItems: filteredLedger.length,
      normalCount,
      lowCount,
      outCount
    }
  }, [filteredLedger])

  const donutData = useMemo(() => {
    const total = stats.normalCount + stats.lowCount + stats.outCount
    if (total === 0) return []

    const raw = [
      { name: 'Normal', count: stats.normalCount, color: '#10b981', hoverColor: '#34d399', glowColor: 'rgba(16,185,129,0.3)', bgClass: 'bg-emerald-500' },
      { name: 'Low Stock', count: stats.lowCount, color: '#f59e0b', hoverColor: '#fbbf24', glowColor: 'rgba(245,158,11,0.3)', bgClass: 'bg-amber-500' },
      { name: 'Out of Stock', count: stats.outCount, color: '#ef4444', hoverColor: '#f87171', glowColor: 'rgba(239,68,68,0.3)', bgClass: 'bg-rose-500' }
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

  const groupChartData = useMemo(() => {
    const map = {}
    filteredLedger.forEach(item => {
      if (!map[item.groupName]) {
        map[item.groupName] = { name: item.groupName, value: 0, qty: 0, itemsCount: 0 }
      }
      map[item.groupName].value += item.stockValue
      map[item.groupName].qty += item.currentStock
      map[item.groupName].itemsCount++
    })

    return Object.values(map)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6) 
  }, [filteredLedger])

  const topValueItems = useMemo(() => {
    return [...filteredLedger]
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 5)
  }, [filteredLedger])

  const recentAdjustments = useMemo(() => {
    return [...adjustments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  }, [adjustments])

  // Sparkline data simulations based on active stats
  const valueTrendPoints = useMemo(() => {
    const base = stats.totalValue;
    return [base * 0.92, base * 0.94, base * 0.98, base * 0.95, base * 0.97, base * 0.99, base];
  }, [stats.totalValue]);

  const qtyTrendPoints = useMemo(() => {
    const base = stats.totalQty;
    return [base * 1.05, base * 1.02, base * 0.98, base * 1.01, base * 0.99, base * 1.03, base];
  }, [stats.totalQty]);

  // --- 1. Stock Inward vs Outward Trend (Daily over last 30 days) ---
  const trendData = useMemo(() => {
    const dailyData = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const key = d.toISOString().split('T')[0]
      dailyData[key] = { key, name: dateStr, inward: 0, outward: 0 }
    }

    adjustments.forEach(adj => {
      const createdDate = new Date(adj.createdAt)
      const key = createdDate.toISOString().split('T')[0]
      if (dailyData[key]) {
        if (adj.type === 'INWARD') {
          dailyData[key].inward += adj.qty || 0
        } else {
          dailyData[key].outward += adj.qty || 0
        }
      }
    })

    return Object.values(dailyData)
  }, [adjustments])

  // --- 2. Internal Material Requests Status Breakdown ---
  const mrStats = useMemo(() => {
    let draft = 0
    let pending = 0
    let approved = 0
    let issued = 0
    let total = materialRequests.length

    materialRequests.forEach(mr => {
      const status = String(mr.status || '').toUpperCase()
      if (status === 'DRAFT') draft++
      else if (status === 'PENDING' || status === 'OPEN' || status === 'WAITING_APPROVAL') pending++
      else if (status === 'APPROVED') approved++
      else if (status === 'ISSUED' || status === 'COMPLETED') issued++
    })

    return { total, draft, pending, approved, issued }
  }, [materialRequests])

  // --- 3. Stock Aging & Turnover Analysis ---
  const stockAging = useMemo(() => {
    const lastAdjustmentMap = {}
    adjustments.forEach(adj => {
      const part = String(adj.partNo || '').trim().toLowerCase()
      if (part) {
        const date = new Date(adj.createdAt)
        if (!lastAdjustmentMap[part] || date > lastAdjustmentMap[part]) {
          lastAdjustmentMap[part] = date
        }
      }
    })

    const now = new Date()
    return stockLedger
      .map(item => {
        const partKey = String(item.partNo || '').trim().toLowerCase()
        const lastDate = lastAdjustmentMap[partKey]
        let days = 999 
        if (lastDate) {
          const diffTime = Math.abs(now - lastDate)
          days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        }

        let category = 'Stagnant'
        let color = '#ef4444'
        let textColor = 'text-rose-400'
        let bgClass = 'bg-rose-500/10 border-rose-500/20'
        
        if (days <= 15) {
          category = 'Fast Moving'
          color = '#10b981'
          textColor = 'text-emerald-400'
          bgClass = 'bg-emerald-500/10 border-emerald-500/20'
        } else if (days <= 60) {
          category = 'Slow Moving'
          color = '#f59e0b'
          textColor = 'text-amber-400'
          bgClass = 'bg-amber-500/10 border-amber-500/20'
        }

        return {
          ...item,
          daysSinceLastAdj: lastDate ? `${days} days` : 'No tx',
          daysVal: days,
          category,
          color,
          textColor,
          bgClass
        }
      })
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 5)
  }, [stockLedger, adjustments])

  // --- 4. GRN Receipt Value by Supplier ---
  const supplierGrnData = useMemo(() => {
    const map = {}
    grnMasters.forEach(grn => {
      const sup = grn.supplierName || 'Unknown'
      map[sup] = (map[sup] || 0) + (grn.totalAmount || 0)
    })

    const raw = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const totalVal = raw.reduce((sum, item) => sum + item.value, 0)
    if (totalVal === 0) return []

    const colors = ['#0C5CAB', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
    let cumulativePercentage = 0

    return raw.map((item, idx) => {
      const percentage = (item.value / totalVal) * 100
      const strokeDasharray = `${percentage} ${100 - percentage}`
      const strokeDashoffset = 100 - cumulativePercentage + 25
      cumulativePercentage += percentage
      return {
        ...item,
        percentage,
        strokeDasharray,
        strokeDashoffset,
        color: colors[idx % colors.length]
      }
    })
  }, [grnMasters])

  // --- 5. Safety Buffer vs Active Purchase Requests ---
  const safetyBufferPrCorrelation = useMemo(() => {
    const prMap = {}
    purchaseRequests.forEach(pr => {
      if (pr.status !== 'Approved' && pr.status !== 'Completed') {
        const details = pr.details || []
        details.forEach(det => {
          const code = String(det.itemCode || det.itemId || '').trim().toLowerCase()
          if (code) {
            prMap[code] = (prMap[code] || 0) + (det.qty || 0)
          }
        })
      }
    })

    return stockLedger
      .filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock')
      .map(item => {
        const codeKey = String(item.partNo || '').trim().toLowerCase()
        const pendingPrQty = prMap[codeKey] || 0
        return {
          ...item,
          pendingPrQty
        }
      })
      .slice(0, 5)
  }, [stockLedger, purchaseRequests])

  // --- 6. Delivery Challan Shipment Tracking ---
  const dcStats = useMemo(() => {
    let salesCount = 0
    let returnableCount = 0
    let supplierCount = 0
    let customerCount = 0
    let totalVal = 0

    deliveryChallans.forEach(dc => {
      totalVal += dc.totalAmount || 0
      if (dc.partyType === 'Customer') customerCount++
      else if (dc.partyType === 'Supplier') supplierCount++

      const type = String(dc.dcType || '').toLowerCase()
      if (type.includes('sale')) salesCount++
      else if (type.includes('return')) returnableCount++
    })

    return {
      totalVal,
      totalCount: deliveryChallans.length,
      customerCount,
      supplierCount,
      salesCount,
      returnableCount
    }
  }, [deliveryChallans])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const navigateTo = (pageName) => {
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: pageName } }))
  }

  return (
    <div className="bg-[#080b11] min-h-screen text-slate-100 pb-16 font-sans selection:bg-cyan-500/30">
      {/* Import Premium Font & Dynamic Styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .glass-card {
          background: #0E1320;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .glass-card:hover {
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 15px 45px -5px rgba(0, 0, 0, 0.6);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: #f1f5f9;
        }
        .glass-input:focus {
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
          background: rgba(255, 255, 255, 0.04);
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.3);
        }
      `}</style>

      {/* Top Glass Header */}
      <div className="px-8 py-6 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/60 shadow-[0_4px_30px_rgba(0,0,0,0.4)] sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-extrabold">
              <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={() => navigateTo('Dashboard')}>Velson ERP</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-cyan-400">Stock Dashboard</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Warehouse className="w-6 h-6 animate-pulse" />
              </div>
              INVENTORY HUB
            </h1>
          </div>

          {/* Search, Filter & Refresh Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search parts, descriptions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 glass-input rounded-xl text-[13px] focus:outline-none transition-all w-64 placeholder-slate-600"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchDashboardData}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all shadow-md active:scale-95 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20"
              title="Refresh Metrics"
            >
              <RefreshCw size={15} className={`${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 mt-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-4 py-2 rounded-xl text-[11.5px] font-bold tracking-wider uppercase transition-all duration-200 border whitespace-nowrap ${
              selectedGroup === 'ALL'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-black'
                : 'bg-white/2 hover:bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          {itemGroups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.groupName)}
              className={`px-4 py-2 rounded-xl text-[11.5px] font-bold tracking-wider uppercase transition-all duration-200 border whitespace-nowrap ${
                selectedGroup === g.groupName
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-black'
                  : 'bg-white/2 hover:bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {g.groupName}
            </button>
          ))}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="glass-card rounded-3xl p-20 text-center flex flex-col items-center justify-center min-h-[480px]">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500/10 border-t-cyan-400 animate-spin" />
              <Warehouse className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 tracking-wide uppercase">Auditing Stock Ledger</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">Re-indexing inward records, material requests, and real-time ledger valuations...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Capital Value Card */}
              <div className="glass-card rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group hover:border-cyan-500/30">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300 text-cyan-400">
                  <Warehouse className="w-36 h-36" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Capital Value</span>
                  <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="text-2xl font-black font-mono tracking-tight text-white">
                    ₹{stats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-slate-500"><strong className="text-cyan-400 font-bold">{stats.totalItems}</strong> active SKUs</span>
                    <Sparkline points={valueTrendPoints} color="#06b6d4" />
                  </div>
                </div>
              </div>

              {/* Total Stock Qty Card */}
              <div className="glass-card rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group hover:border-emerald-500/30">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300 text-emerald-450">
                  <Package className="w-36 h-36" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock Count</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="text-2xl font-black font-mono tracking-tight text-white">
                    {stats.totalQty.toLocaleString('en-IN')}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-slate-500">Unit Valuation: <strong className="text-slate-300 font-bold">₹{stats.totalItems ? (stats.totalValue / (stats.totalQty || 1)).toFixed(1) : '0'}</strong></span>
                    <Sparkline points={qtyTrendPoints} color="#10b981" />
                  </div>
                </div>
              </div>

              {/* Low Stock Warning Card */}
              <div className="glass-card rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group hover:border-amber-500/30">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300 text-amber-500">
                  <AlertTriangle className="w-36 h-36" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Safety Threshold Warnings</span>
                  <div className={`p-2 rounded-xl border ${stats.lowCount > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className={`text-2xl font-black font-mono tracking-tight ${stats.lowCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                    {stats.lowCount}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Below minimum buffer limit</span>
                    {stats.lowCount > 0 && <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-amber-400 font-extrabold uppercase animate-pulse">Needs Reorder</span>}
                  </div>
                </div>
              </div>

              {/* Out of Stock Card */}
              <div className="glass-card rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group hover:border-rose-500/30">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300 text-rose-500">
                  <ShieldAlert className="w-36 h-36" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Critical Shortages</span>
                  <div className={`p-2 rounded-xl border ${stats.outCount > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className={`text-2xl font-black font-mono tracking-tight ${stats.outCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-100'}`}>
                    {stats.outCount}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Zero stock balance</span>
                    {stats.outCount > 0 && <span className="text-[9px] bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full text-rose-450 font-black uppercase animate-bounce">Out of Stock</span>}
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Panel */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Inventory Operations Center
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => navigateTo('StockManagement')}
                  className="flex items-center justify-between p-4 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all duration-200 text-left group active:scale-[0.98]"
                >
                  <div>
                    <div className="font-bold text-[12.5px] text-slate-200">Stock Adjustment</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Adjust stock inward/outward</div>
                  </div>
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('PurchaseRequestEntry')}
                  className="flex items-center justify-between p-4 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all duration-200 text-left group active:scale-[0.98]"
                >
                  <div>
                    <div className="font-bold text-[12.5px] text-slate-200">Procure Request</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Submit new materials draft</div>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('GRNEntry')}
                  className="flex items-center justify-between p-4 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all duration-200 text-left group active:scale-[0.98]"
                >
                  <div>
                    <div className="font-bold text-[12.5px] text-slate-200">Gate Inward / GRN</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Receive item deliveries</div>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:translate-x-1 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('MaterialIssue')}
                  className="flex items-center justify-between p-4 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all duration-200 text-left group active:scale-[0.98]"
                >
                  <div>
                    <div className="font-bold text-[12.5px] text-slate-200">Issue Materials</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Deliver shop floor stock</div>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>

            {/* 1. Stock Inward vs Outward Trend & Donut Status Ratio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Status Ratio Donut */}
              <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-cyan-400" />
                    Status Balance Ratio
                  </h3>
                </div>

                <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(255,255,255,0.015)" strokeWidth="10" />
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
                            <span className="text-3xl font-black text-white font-mono mt-0.5">{seg.count}</span>
                            <span className="text-[11px] font-bold text-cyan-400">{seg.percentage.toFixed(1)}%</span>
                          </>
                        )
                      })()
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active SKUs</span>
                        <span className="text-4xl font-black text-white font-mono mt-0.5">{stats.totalItems}</span>
                        <span className="text-[9px] text-cyan-400 font-extrabold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full mt-2 uppercase tracking-wide">Live Feed</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full grid grid-cols-3 gap-2 mt-8 border-t border-slate-900 pt-5">
                  {donutData.map((seg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer text-center ${hoveredDonutSegment === seg.name ? 'bg-white/5 border border-white/5' : 'border border-transparent'}`}
                      onMouseEnter={() => setHoveredDonutSegment(seg.name)}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    >
                      <div className="flex items-center gap-1.5 mb-1 justify-center">
                        <span className={`w-2.5 h-2.5 rounded-full ${seg.bgClass}`} style={{ boxShadow: `0 0 6px ${seg.color}` }} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{seg.name}</span>
                      </div>
                      <span className="text-[13px] font-bold font-mono text-slate-200">{seg.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-Day Line Chart: Inward vs Outward */}
              <div 
                className="glass-card rounded-2xl p-6 lg:col-span-2 relative flex flex-col"
                onMouseMove={handleMouseMove}
              >
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    30-Day Movement Trend (Inward vs Outward)
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Inward</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Outward</span>
                  </div>
                </div>

                {/* SVG Line Graph */}
                <div className="flex-1 min-h-[220px] relative mt-4">
                  {trendData.length > 0 ? (
                    (() => {
                      const width = 640
                      const height = 180
                      const maxVal = Math.max(...trendData.map(d => Math.max(d.inward, d.outward)), 5) || 5
                      
                      // Compute path coordinates
                      const getPointsStr = (type) => {
                        return trendData.map((d, idx) => {
                          const x = (idx / (trendData.length - 1)) * width
                          const val = type === 'inward' ? d.inward : d.outward
                          const y = height - (val / maxVal) * (height - 20) - 10
                          return `${x},${y}`
                        }).join(' ')
                      }

                      const inwardPoints = getPointsStr('inward')
                      const outwardPoints = getPointsStr('outward')

                      return (
                        <div className="w-full h-full">
                          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                            {/* Horizontal grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                              <line
                                key={i}
                                x1="0"
                                y1={height - r * (height - 20) - 10}
                                x2={width}
                                y2={height - r * (height - 20) - 10}
                                stroke="rgba(255, 255, 255, 0.03)"
                                strokeWidth="1"
                              />
                            ))}

                            {/* Inward Area & Line */}
                            <path
                              d={`M 0,${height - 10} L ${inwardPoints} L ${width},${height - 10} Z`}
                              fill="url(#inwardGlow)"
                              className="opacity-20"
                            />
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                              points={inwardPoints}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Outward Area & Line */}
                            <path
                              d={`M 0,${height - 10} L ${outwardPoints} L ${width},${height - 10} Z`}
                              fill="url(#outwardGlow)"
                              className="opacity-20"
                            />
                            <polyline
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="2.5"
                              points={outwardPoints}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Hover interaction overlay circles */}
                            {trendData.map((d, idx) => {
                              const x = (idx / (trendData.length - 1)) * width
                              const inY = height - (d.inward / maxVal) * (height - 20) - 10
                              const outY = height - (d.outward / maxVal) * (height - 20) - 10
                              
                              return (
                                <g 
                                  key={idx} 
                                  className="cursor-pointer group/node"
                                  onMouseEnter={() => setHoveredTrendDay(d)}
                                  onMouseLeave={() => setHoveredTrendDay(null)}
                                >
                                  {/* Interaction Trigger Area */}
                                  <rect
                                    x={x - 10}
                                    y="0"
                                    width="20"
                                    height={height}
                                    fill="transparent"
                                  />
                                  <circle cx={x} cy={inY} r="4" fill="#10b981" className="opacity-0 group-hover/node:opacity-100 transition-opacity" />
                                  <circle cx={x} cy={outY} r="4" fill="#ef4444" className="opacity-0 group-hover/node:opacity-100 transition-opacity" />
                                </g>
                              )
                            })}

                            <defs>
                              <linearGradient id="inwardGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                              </linearGradient>
                              <linearGradient id="outwardGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Interactive Day Tooltip */}
                          {hoveredTrendDay && (
                            <div 
                              className="absolute bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-800 shadow-2xl text-[12px]"
                              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 80}px`, transform: 'translateX(-50%)' }}
                            >
                              <div className="font-extrabold text-cyan-400 mb-1.5 uppercase tracking-widest text-[10px]">{hoveredTrendDay.name}</div>
                              <div className="flex gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-500 uppercase">Inward</span>
                                  <span className="font-mono font-black text-emerald-400">{hoveredTrendDay.inward.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-500 uppercase">Outward</span>
                                  <span className="font-mono font-black text-rose-400">{hoveredTrendDay.outward.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    <div className="flex items-center justify-center text-slate-500 text-sm">No transaction movement compiled</div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900/60 pt-3">
                  <span>{trendData[0]?.name || ''}</span>
                  <span>{trendData[Math.floor(trendData.length / 2)]?.name || ''}</span>
                  <span>{trendData[trendData.length - 1]?.name || ''}</span>
                </div>
              </div>

            </div>

            {/* 2. Capital Allocation, GRN Supplier Distribution, Material Requests Status, Delivery Challans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* GRN Value by Supplier Donut */}
              <div className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-cyan-400" />
                    Receipt Value by Supplier
                  </h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(255,255,255,0.015)" strokeWidth="8" />
                      {supplierGrnData.length === 0 ? (
                        <circle cx="60" cy="60" r="50" fill="transparent" stroke="#1e293b" strokeWidth="8" />
                      ) : (
                        supplierGrnData.map((seg, idx) => (
                          <circle
                            key={idx}
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth={hoveredSupplierSegment === seg.name ? '12' : '8'}
                            strokeDasharray={seg.strokeDasharray}
                            strokeDashoffset={seg.strokeDashoffset}
                            pathLength="100"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredSupplierSegment(seg.name)}
                            onMouseLeave={() => setHoveredSupplierSegment(null)}
                          />
                        ))
                      )}
                    </svg>

                    <div className="absolute flex flex-col items-center text-center">
                      {hoveredSupplierSegment ? (
                        (() => {
                          const seg = supplierGrnData.find(s => s.name === hoveredSupplierSegment)
                          return (
                            <>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[100px]">{seg.name}</span>
                              <span className="text-[16px] font-black text-white font-mono mt-0.5">₹{(seg.value / 1000).toFixed(1)}k</span>
                              <span className="text-[10px] font-bold text-cyan-400">{seg.percentage.toFixed(1)}%</span>
                            </>
                          )
                        })()
                      ) : (
                        <>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Total Receipts</span>
                          <span className="text-[18px] font-black text-white font-mono mt-0.5">
                            ₹{(grnMasters.reduce((s, g) => s + (g.totalAmount || 0), 0) / 1000).toFixed(0)}k
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-2 mt-6 border-t border-slate-900/60 pt-4">
                    {supplierGrnData.map((seg, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between text-[11px]"
                        onMouseEnter={() => setHoveredSupplierSegment(seg.name)}
                        onMouseLeave={() => setHoveredSupplierSegment(null)}
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                          <span className="text-slate-400 font-bold truncate">{seg.name}</span>
                        </div>
                        <span className="font-mono text-slate-200 font-bold">₹{seg.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Material Requests Status breakdown Circular rings */}
              <div className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Material Requests Status
                  </h3>
                  <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded text-cyan-400 font-bold uppercase">{mrStats.total} Total</span>
                </div>

                <div className="flex-1 flex flex-col justify-around">
                  {/* Status pills list with customized circular indicator */}
                  {[
                    { name: 'Draft Mode', val: mrStats.draft, color: '#6b7280', ringClass: 'stroke-slate-500' },
                    { name: 'Pending / Open', val: mrStats.pending, color: '#f59e0b', ringClass: 'stroke-amber-500' },
                    { name: 'Approved Drafts', val: mrStats.approved, color: '#10b981', ringClass: 'stroke-emerald-500' },
                    { name: 'Issued to Shop', val: mrStats.issued, color: '#8b5cf6', ringClass: 'stroke-purple-500' }
                  ].map((status, idx) => {
                    const percentage = mrStats.total ? (status.val / mrStats.total) * 100 : 0
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/2 rounded-xl transition-all border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="14" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
                              <circle cx="18" cy="18" r="14" fill="transparent" className={status.ringClass} strokeWidth="3" strokeDasharray={`${percentage} 100`} />
                            </svg>
                            <span className="absolute text-[9.5px] font-extrabold text-slate-200">{Math.round(percentage)}%</span>
                          </div>
                          <div>
                            <div className="font-bold text-[12px] text-slate-300">{status.name}</div>
                            <div className="text-[10px] text-slate-500">Volume status allocation</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-extrabold text-slate-100 text-[14px]">{status.val}</div>
                          <div className="text-[9px] text-slate-500">requests</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Delivery Challan Shipment Tracking */}
              <div className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Delivery Challan (DC) Metrics
                  </h3>
                  <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400 font-bold uppercase">{dcStats.totalCount} Raised</span>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  {/* Total DC Value display */}
                  <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-center shadow-inner">
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Total Challan Amount Flow</div>
                    <div className="text-2xl font-black text-white font-mono mt-1">₹{dcStats.totalVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-white/2 border border-white/5 rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Customer Shipped</span>
                      <span className="font-mono font-black text-[18px] text-cyan-400 mt-1 block">{dcStats.customerCount}</span>
                      <span className="text-[9px] text-slate-600 block mt-0.5">Outgoing items</span>
                    </div>
                    <div className="p-3 bg-white/2 border border-white/5 rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Supplier Issued</span>
                      <span className="font-mono font-black text-[18px] text-purple-400 mt-1 block">{dcStats.supplierCount}</span>
                      <span className="text-[9px] text-slate-600 block mt-0.5">Returnable items</span>
                    </div>
                  </div>

                  {/* Dual Bar: Customer vs Supplier ratio */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-bold uppercase">
                      <span>Customer ({Math.round(dcStats.totalCount ? (dcStats.customerCount / dcStats.totalCount) * 100 : 0)}%)</span>
                      <span>Supplier ({Math.round(dcStats.totalCount ? (dcStats.supplierCount / dcStats.totalCount) * 100 : 0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400" style={{ width: `${dcStats.totalCount ? (dcStats.customerCount / dcStats.totalCount) * 100 : 0}%` }} />
                      <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: `${dcStats.totalCount ? (dcStats.supplierCount / dcStats.totalCount) * 100 : 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Safety Buffer & Active PR Correlation, Stock Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Safety Buffer vs Active PR Correlation */}
              <div className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-350 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                    Buffer Threshold vs Procurement Status
                  </h3>
                  <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Critical Buffer Alert</span>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/60 text-[9px] uppercase text-slate-500 font-extrabold">
                        <th className="py-2.5 font-black">Part details</th>
                        <th className="py-2.5 text-right font-black">In Stock</th>
                        <th className="py-2.5 text-right font-black">PR Pending</th>
                        <th className="py-2.5 text-center font-black">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {safetyBufferPrCorrelation.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-500 text-sm font-semibold">No critical safety buffer alerts</td>
                        </tr>
                      ) : (
                        safetyBufferPrCorrelation.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/2 transition-all">
                            <td className="py-3 pr-2">
                              <div className="text-[12.5px] font-bold text-slate-200 tracking-tight">{item.partNo}</div>
                              <div className="text-[10px] text-slate-500 truncate uppercase mt-0.5 max-w-[200px]">{item.partName}</div>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-slate-300 text-[12px]">
                              {item.currentStock.toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-mono text-[12px]">
                              {item.pendingPrQty > 0 ? (
                                <span className="text-emerald-400 font-extrabold">{item.pendingPrQty.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-600">0.00</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {item.pendingPrQty > 0 ? (
                                <span className="text-[8.5px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">PR Raised</span>
                              ) : (
                                <button
                                  onClick={() => navigateTo('PurchaseRequestEntry')}
                                  className="text-[8.5px] font-extrabold uppercase bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                                >
                                  Procure
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stock Aging & Turnover Table */}
              <div className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-350 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Asset Turnover & Aging Analysis
                  </h3>
                  <span className="text-[9px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Stock Age</span>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/60 text-[9px] uppercase text-slate-500 font-extrabold">
                        <th className="py-2.5 font-black">Part details</th>
                        <th className="py-2.5 text-right font-black">Total Value</th>
                        <th className="py-2.5 text-right font-black">Last Tx Time</th>
                        <th className="py-2.5 text-center font-black">Velocity Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {stockAging.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-500 text-sm font-semibold">No stock values calculated</td>
                        </tr>
                      ) : (
                        stockAging.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/2 transition-all">
                            <td className="py-3 pr-2">
                              <div className="text-[12.5px] font-bold text-slate-200 tracking-tight">{item.partNo}</div>
                              <div className="text-[10px] text-slate-500 truncate uppercase mt-0.5 max-w-[200px]">{item.partName}</div>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-slate-300 text-[12px]">
                              ₹{item.stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-400 text-[12px]">
                              {item.daysSinceLastAdj}
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-full border ${item.bgClass} ${item.textColor}`}>
                                {item.category}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Group Stock Values list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Bar Chart Component: Group Stock Values */}
              <div 
                className="glass-card rounded-2xl p-6 lg:col-span-3 relative flex flex-col"
                onMouseMove={handleMouseMove}
              >
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                  <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    Capital Allocation by Group
                  </h3>
                  <span className="text-[9px] bg-[#00bcd4]/10 border border-[#00bcd4]/20 px-2.5 py-0.5 rounded text-cyan-400 font-black uppercase tracking-wider">Values in INR</span>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupChartData.length === 0 ? (
                    <div className="col-span-2 flex items-center justify-center text-slate-500 text-sm">No group metrics compiled</div>
                  ) : (
                    groupChartData.map((group, idx) => {
                      const maxVal = Math.max(...groupChartData.map(g => g.value)) || 1
                      const barPercentage = (group.value / maxVal) * 100
                      return (
                        <div 
                          key={idx} 
                          className="group/bar flex items-center gap-4 py-2 hover:bg-white/2 px-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5"
                          onMouseEnter={(e) => setHoveredBar({ name: group.name, value: group.value, qty: group.qty, itemsCount: group.itemsCount })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div className="w-28 text-left truncate">
                            <span className="text-[11.5px] font-bold text-slate-400 group-hover/bar:text-cyan-400 transition-colors uppercase tracking-wider">{group.name}</span>
                          </div>
                          <div className="flex-1 h-7 bg-slate-950/80 rounded-lg overflow-hidden relative border border-white/5 shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500/25 to-cyan-400 rounded-lg transition-all duration-500 group-hover/bar:brightness-110"
                              style={{ 
                                width: `${barPercentage}%`,
                                boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)' 
                              }}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10.5px] font-mono font-bold text-slate-300">
                              ₹{group.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <ChartTooltip active={!!hoveredBar} payload={hoveredBar} x={tooltipPos.x} y={tooltipPos.y} />
              </div>

            </div>

            {/* Recent Adjustments Transactions log */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                <h3 className="text-[11.5px] font-black uppercase tracking-widest text-slate-350 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Recent Transaction Audits
                </h3>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase bg-white/2 border border-white/5 px-2.5 py-0.5 rounded tracking-wider">Realtime Logs</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-500 font-extrabold bg-[#0b0f19]/40">
                      <th className="py-3 px-4 font-black">Date/Time</th>
                      <th className="py-3 px-4 font-black">Part No</th>
                      <th className="py-3 px-4 font-black">Type</th>
                      <th className="py-3 px-4 text-right font-black">Adjustment Qty</th>
                      <th className="py-3 px-4 font-black">Barcode details</th>
                      <th className="py-3 px-4 font-black">Log User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {recentAdjustments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-slate-500 text-sm font-semibold">No recent adjustments logged</td>
                      </tr>
                    ) : (
                      recentAdjustments.map((adj, idx) => (
                        <tr key={idx} className="hover:bg-white/2 transition-all">
                          <td className="py-3 px-4 text-[12px] text-slate-400">
                            {new Date(adj.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200 text-[12.5px]">{adj.partNo}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[8.5px] font-black uppercase rounded-full ${
                              adj.type === 'INWARD' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {adj.type === 'INWARD' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {adj.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-200 text-[12px]">
                            {adj.qty}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                            {adj.barcode || 'N/A'} <span className="text-[9px] text-slate-500 font-sans">({adj.barcodeType})</span>
                          </td>
                          <td className="py-3 px-4 text-[11.5px] text-slate-350 font-bold">{adj.createdBy || 'Admin'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
