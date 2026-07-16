import { useState, useEffect } from 'react'
import { 
  ChevronRight, Search, Printer, X, Trash2, Download, 
  FileSpreadsheet, FileJson, Filter, Settings, Eye, Image as ImageIcon, RotateCcw 
} from 'lucide-react'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

export default function MainIndexReport() {
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [customerName, setCustomerName] = useState('')
  const [bookingCode, setBookingCode] = useState('')
  const [vehicleCount, setVehicleCount] = useState('')
  const [serialJobNo, setSerialJobNo] = useState('')
  const [modelNo, setModelNo] = useState('')
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('velson_bom_main_index') || '[]')
    setData(saved)
    setFilteredData(saved)
  }, [])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      const start = new Date(fromDate)
      const end = new Date(toDate)
      const result = data.filter(r => {
        const d = new Date(r.date)
        const dateMatch = d >= start && d <= end
        const customerMatch = customerName ? r.customerName === customerName : true
        const jobMatch = serialJobNo ? r.serialJobNo === serialJobNo : true
        const modelMatch = modelNo ? r.vehicleModelNo === modelNo : true
        return dateMatch && customerMatch && jobMatch && modelMatch
      })
      setFilteredData(result)
      setSearching(false)
    }, 600)
  }

  const handleDelete = (id) => {
    const next = data.filter(r => r.id !== id)
    setData(next)
    setFilteredData(next)
    localStorage.setItem('velson_bom_main_index', JSON.stringify(next))
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Production Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[750px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Main Index Analytics</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50">
                <Eye size={14} /> Job View
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50">
                <Printer size={14} /> View
              </button>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded shadow-sm cursor-pointer">
                <input type="radio" checked readOnly className="accent-[#0097A7] w-3 h-3" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">New PDF</span>
              </label>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold rounded shadow-sm hover:bg-rose-100">
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black rounded transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-8 space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label>From Date :</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36 shadow-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Label>To Date :</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36 shadow-sm" />
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={handleSearch} className="flex items-center gap-1.5 px-6 py-1.5 bg-[#0097A7] text-white text-[12px] font-bold rounded border border-[#0097A7] shadow-sm hover:bg-[#007a87] transition-all">
                    <Search size={14} /> Search
                  </button>
                  <button onClick={handleSearch} className="flex items-center gap-1.5 px-6 py-1.5 bg-white text-slate-700 text-[12px] font-bold rounded border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                    <Search size={14} /> Search Details
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-8 space-y-4">
                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3 text-right"><Label>Customer Name :</Label></div>
                    <div className="col-span-9"><Select options={['Customer A', 'Customer B', 'Customer C']} placeholder="--- All Customers ---" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3 text-right"><Label>Booking Customer Code :</Label></div>
                    <div className="col-span-4"><Input placeholder="Search Code..." value={bookingCode} onChange={e => setBookingCode(e.target.value)} /></div>
                    <div className="col-span-2 text-right"><Label>Vehicle Count :</Label></div>
                    <div className="col-span-3"><Select options={['1', '2', '3', '4', '5']} placeholder="--" value={vehicleCount} onChange={e => setVehicleCount(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3 text-right"><Label required>Serial Job No :</Label></div>
                    <div className="col-span-9"><Select options={['JOB-001', 'JOB-002']} placeholder="Select Job" value={serialJobNo} onChange={e => setSerialJobNo(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3 text-right"><Label>Model No :</Label></div>
                    <div className="col-span-9"><Select options={['MOD-X', 'MOD-Y']} placeholder="Select Model" value={modelNo} onChange={e => setModelNo(e.target.value)} /></div>
                  </div>
                </div>
                <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-100 pl-8 h-full">
                  <div className="w-24 h-24 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-200 hover:border-[#0097A7] hover:text-[#0097A7] transition-all cursor-pointer group">
                    <ImageIcon size={40} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest leading-none">Model Image</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-2 h-4 bg-[#0097A7] rounded-full" />
                  Dataset Overview
               </h3>
               <div className="flex items-center gap-2">
                  {[
                    { icon: <Download size={14} />, l: 'CSV' },
                    { icon: <FileSpreadsheet size={14} />, l: 'Excel' },
                    { icon: <FileJson size={14} />, l: 'PDF' },
                  ].map(tool => (
                    <button key={tool.l} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-[#0097A7] text-[10px] font-black uppercase transition-all">
                      {tool.icon} {tool.l}
                    </button>
                  ))}
               </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1500px]">
                <thead className="bg-[#fcfdfe] text-[9px] uppercase text-slate-400 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-4 border-r border-slate-100 text-center">ID</th>
                    <th className="px-4 py-4 border-r border-slate-100">Date</th>
                    <th className="px-4 py-4 border-r border-slate-100">Customer_Name</th>
                    <th className="px-4 py-4 border-r border-slate-100">Booking_Code</th>
                    <th className="px-4 py-4 border-r border-slate-100">Serial_No</th>
                    <th className="px-4 py-4 border-r border-slate-100">Model_Name</th>
                    <th className="px-4 py-4 border-r border-slate-100">Model_No</th>
                    <th className="px-4 py-4 border-r border-slate-100">Vehicle_Arrival_Date</th>
                    <th className="px-4 py-4 border-r border-slate-100">Compressor_Arrival_Date</th>
                    <th className="px-4 py-4 border-r border-slate-100">Work_Commsing_Date</th>
                    <th className="px-4 py-4 border-r border-slate-100">Work_Completed_Date</th>
                    <th className="px-4 py-4 text-center">Work_Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[12px]">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-24 text-center text-slate-300 italic">
                        No production records found for the selected parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-[#0097A7]/5 transition-colors h-14 group border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2 border-r border-slate-50 text-center text-slate-300 font-bold">{row.id || idx + 1}</td>
                        <td className="px-4 py-2 border-r border-slate-50 text-slate-500">{row.date}</td>
                        <td className="px-4 py-2 border-r border-slate-50 font-bold text-[#0097A7] uppercase">{row.customerName}</td>
                        <td className="px-4 py-2 border-r border-slate-50 font-medium text-slate-600 uppercase">{row.customerCode || '25-26/0000'}</td>
                        <td className="px-4 py-2 border-r border-slate-50 font-bold text-slate-800">{row.vehicleSerialNo || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-50 font-semibold text-slate-700">{row.vehicleModelNo}</td>
                        <td className="px-4 py-2 border-r border-slate-50 font-medium text-[11px] text-slate-400 italic">{row.bomModelNo || 'GH700-...'}</td>
                        <td className="px-4 py-2 border-r border-slate-50 text-slate-500">{row.vehicleArrivalDate || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-50 text-slate-500">{row.compressorArrivalDate || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-50 text-slate-500">{row.workCommsingDate || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-50 text-slate-500">{row.workCompleteDate || '-'}</td>
                        <td className="px-4 py-2 text-center text-slate-500">{row.workDeliveryDate || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between bg-slate-900 rounded-2xl p-5 shadow-2xl">
               <div className="flex items-center gap-10">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Total Dataset</span>
                   <span className="text-[20px] font-black text-white leading-none">{filteredData.length}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Total Vehicle Qty</span>
                   <span className="text-[20px] font-black text-[#0097A7] leading-none">
                     {filteredData.reduce((acc, r) => acc + (parseInt(r.vehicleQty) || 0), 0)}
                   </span>
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">Confidential Production Data</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
