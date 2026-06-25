import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, X, Edit2, Trash2, Printer, 
  ChevronDown, ChevronUp, Search
} from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
const Label = ({ children, required, className = "" }) => (
  <label className={`block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider ${className}`}>
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const HeaderButton = ({ children, onClick, className = "", color = "slate", disabled = false }) => {
  const colors = {
    slate: "text-slate-600 hover:bg-slate-50 border-slate-200",
    emerald: "text-emerald-600 hover:bg-emerald-50 border-slate-200",
    rose: "text-rose-600 hover:bg-rose-50 border-slate-200",
    teal: "text-[#0097A7] hover:bg-[#f0f9fa] border-slate-200"
  }
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 border bg-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none ${colors[color]} ${className}`}
    >
      {children}
    </button>
  )
}

export default function OutsourcePartsRegisterDetails() {
  const toast = useToast()
  const navigate = useNavigate()

  // Data State
  const [dcs, setDcs] = useState([])
  const [filteredDcs, setFilteredDcs] = useState([])
  
  // Selection & UI State
  const [selectedCustomerName, setSelectedCustomerName] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))

  // Load DCs on mount
  useEffect(() => {
    loadDcs()
  }, [])

  const loadDcs = () => {
    const existing = localStorage.getItem('velson_dc_sales')
    if (existing) {
      try {
        const parsed = JSON.parse(existing)
        setDcs(parsed)
        setFilteredDcs(parsed)
      } catch (e) {
        setDcs([])
        setFilteredDcs([])
      }
    }
  }

  // Handle Search / Date filter
  const handleSearch = () => {
    let result = [...dcs]

    // Date range filter
    if (fromDate) {
      result = result.filter(d => d.dcDate >= fromDate)
    }
    if (toDate) {
      result = result.filter(d => d.dcDate <= toDate)
    }

    // Text search filter (matches Customer Name or DC No)
    if (searchText.trim()) {
      const query = searchText.toLowerCase()
      result = result.filter(
        d => d.dcNo.includes(query) || 
             d.partyName.toLowerCase().includes(query)
      )
    }

    setFilteredDcs(result)
    setSelectedCustomerName(null) // Reset selection
    toast.success('List filtered!')
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearchText('')
    setFromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    setToDate(new Date().toISOString().slice(0, 10))
    setFilteredDcs(dcs)
    setSelectedCustomerName(null)
  }

  // Toggle Row Expansion
  const handleRowClick = (customerName) => {
    setSelectedCustomerName(prev => prev === customerName ? null : customerName)
  }

  // Grouping Helper: Displays one row per Customer Name only.
  // The DC No and DC Date shown are from the latest record.
  const getGroupedList = (records) => {
    const groupedMap = {}
    records.forEach(d => {
      const key = d.partyName
      if (!groupedMap[key]) {
        groupedMap[key] = {
          dcNo: d.dcNo,
          partyName: d.partyName,
          dcDate: d.dcDate, // Will hold the latest date
          address: d.address,
          originalRecords: [d]
        }
      } else {
        groupedMap[key].originalRecords.push(d)
        // Set to the latest (last entered date)
        if (d.dcDate > groupedMap[key].dcDate) {
          groupedMap[key].dcDate = d.dcDate
          groupedMap[key].dcNo = d.dcNo // Display the latest DC No
          groupedMap[key].address = d.address
        }
      }
    })
    return Object.values(groupedMap)
  }

  // Helper: Retrieve all items purchased by the selected customer
  // across all dates and DC transactions in the system.
  const getCustomerPurchaseHistory = (customerName) => {
    const history = []
    dcs.forEach(d => {
      if (d.partyName === customerName) {
        if (d.items) {
          d.items.forEach(it => {
            history.push({
              itemName: it.itemName,
              date: it.date || d.dcDate
            })
          })
        }
      }
    })
    // Sort history by date descending (latest first)
    history.sort((a, b) => b.date.localeCompare(a.date))
    return history
  }

  const groupedList = getGroupedList(filteredDcs)

  // Action: Edit selected Customer's latest DC
  const handleEdit = () => {
    if (!selectedCustomerName) {
      toast.error('Please select a customer from the table first!')
      return
    }
    const group = groupedList.find(g => g.partyName === selectedCustomerName)
    const targetNo = group ? group.dcNo : null
    const targetDate = group ? group.dcDate : null
    navigate('/sales/dc-sales', { state: { editDcNo: targetNo, editDcDate: targetDate } })
  }

  // Action: Delete selected Customer's DCs
  const handleDelete = () => {
    if (!selectedCustomerName) {
      toast.error('Please select a customer from the table first!')
      return
    }
    if (window.confirm(`Are you sure you want to delete all DC records for customer "${selectedCustomerName}"?`)) {
      const updated = dcs.filter(d => d.partyName !== selectedCustomerName)
      localStorage.setItem('velson_dc_sales', JSON.stringify(updated))
      setDcs(updated)
      setFilteredDcs(prev => prev.filter(d => d.partyName !== selectedCustomerName))
      setSelectedCustomerName(null)
      toast.success(`All DC records for customer "${selectedCustomerName}" deleted successfully`)
    }
  }

  const handlePrint = () => {
    if (!selectedCustomerName) {
      toast.error('Please select a customer to print!')
      return
    }
    window.print()
  }

  return (
    <div className="bg-[#f1f5f9] min-h-screen">
      <div className="p-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-3 px-1">
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Outsource Parts Register Details</span>
        </div>

        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          
          {/* Main Action Header */}
          <div className="flex items-center justify-between border-b border-slate-300 bg-[#f8fafc] px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[13.5px] font-bold text-slate-800 uppercase tracking-tight">Outsource Parts Register Details</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <HeaderButton color="emerald" onClick={handleEdit} disabled={!selectedCustomerName}>
                <Edit2 size={13} /> Edit
              </HeaderButton>
              <HeaderButton color="rose" onClick={handleDelete} disabled={!selectedCustomerName}>
                <Trash2 size={13} /> Delete
              </HeaderButton>
              <div className="w-[1px] h-5 bg-slate-300 mx-1" />
              <HeaderButton onClick={handlePrint} disabled={!selectedCustomerName}>
                <Printer size={13} /> Print
              </HeaderButton>
              {/* <HeaderButton onClick={() => navigate('/sales/dc-sales')} color="rose">
                <X size={15} strokeWidth={2.5} /> Close / Entry Form
              </HeaderButton> */}
            </div>
          </div>

          {/* Filtering Sub-Bar */}
          <div className="flex items-center gap-4 bg-white border-b border-slate-200 px-4 py-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="!mb-0">From:</Label>
              <Input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="!mb-0">To:</Label>
              <Input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                className="w-36"
              />
            </div>

            <div className="w-[1px] h-6 bg-slate-200" />

            <div className="flex items-center gap-2">
              <Label className="!mb-0">Search:</Label>
              <Input 
                type="text" 
                value={searchText} 
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search DC No / Customer..." 
                className="w-56"
              />
            </div>

            <button 
              onClick={handleSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded shadow-sm transition-colors"
            >
              <Search size={13} /> Search
            </button>
            <button 
              onClick={handleClearFilters}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold rounded border border-slate-300 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Master Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8fafc] text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300 sticky top-0 z-10">
                <tr className="divide-x divide-slate-200">
                  <th className="px-4 py-2.5 w-40">DC No (Latest)</th>
                  <th className="px-4 py-2.5 w-56">DC Date (Last Entered)</th>
                  <th className="px-4 py-2.5">Customer Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[13px]">
                {groupedList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-slate-400 font-medium italic">
                      No DC Sales records found matching the filters.
                    </td>
                  </tr>
                ) : (
                  groupedList.map((row) => (
                    <>
                      {/* Master Row */}
                      <tr 
                        key={row.partyName} 
                        onClick={() => handleRowClick(row.partyName)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer divide-x divide-slate-200 ${
                          selectedCustomerName === row.partyName ? 'bg-sky-50/50 hover:bg-sky-50' : ''
                        }`}
                      >
                        <td className="px-4 py-2 font-bold text-[#0097A7]">
                          <span>#{row.dcNo}</span>
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {row.dcDate ? new Date(row.dcDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-2 font-semibold text-slate-700 flex items-center justify-between">
                          <span>{row.partyName}</span>
                          {selectedCustomerName === row.partyName ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                      </tr>

                      {/* Detail Sub-row */}
                      {selectedCustomerName === row.partyName && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={3} className="px-6 py-4">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm max-w-3xl">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[12.5px] font-bold text-[#0097A7] uppercase tracking-wider">
                                  Customer Purchase History ({row.partyName})
                                </h4>
                                {row.address && (
                                  <div className="text-[11px] text-slate-500">
                                    <span className="font-bold">Address:</span> {row.address}
                                  </div>
                                )}
                              </div>
                              
                              <table className="w-full text-left border-collapse text-[12px]">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                  <tr>
                                    <th className="px-3 py-2 font-bold w-16 text-center">S.No</th>
                                    <th className="px-3 py-2 font-bold">Item Name</th>
                                    <th className="px-3 py-2 font-bold w-40 text-center">Date Stored</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {getCustomerPurchaseHistory(row.partyName).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="px-3 py-2 text-center text-slate-400 font-bold">
                                        {idx + 1}
                                      </td>
                                      <td className="px-3 py-2">{item.itemName}</td>
                                      <td className="px-3 py-2 text-center whitespace-nowrap text-slate-500">
                                        {item.date ? new Date(item.date).toLocaleDateString('en-IN') : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
