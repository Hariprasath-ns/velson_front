import { useState, useEffect } from 'react'
import { ChevronRight, Search, X, FileSpreadsheet, FileText, Filter, Settings, Printer } from 'lucide-react'
import { useToast } from '../components/Toast'

const FilterInput = ({ value, onChange, type = 'text', placeholder = '', className = '' }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    className={`px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all ${className}`} />
)

const PROCESSES = [
  'LASER CUTTING', 'LATHE', 'BANDSAW CUTTING', 'Grinding', 'Turning-CNC',
  'DRILLING', 'GAS CUTTING', 'Bandsaw Cutting', 'MANUAL GAS CUTTING',
  'Milling', 'Heat Treatment', 'Surface Finishing', 'Assembly', 'Inspection',
  'Welding', 'CNC Milling', 'CNC Turning',
]
const OPERATORS = [
  'N.SOWNDARYA', 'SURAMANI', 'SURESH TURNER', 'VENKATESHWARAN-DRAW',
  'KALAISELVAN-TURNER', 'SHANMUGAM', 'SATHYAMOORTHY', 'HARISH',
  'HARISH - BANDSAW CUTTING', 'KARTHICK-V10', 'KALAISELVAN-TURNER', 'ERP2',
  'ERP1', 'ERP3', 'conventional',
]

const SEED_DATA = [
  { sNo: 640,   partNo: '',           partName: '',                              barcode: '029784/2024', processStage: 1, lastProcess: 'LASER CUTTING',       operator: 'N.SOWNDARYA',          lastEntryDate: '09/12/2024' },
  { sNo: 1491,  partNo: '',           partName: '',                              barcode: '031489/2025', processStage: 1, lastProcess: 'LASER CUTTING',       operator: 'N.SOWNDARYA',          lastEntryDate: '03/02/2025' },
  { sNo: 7841,  partNo: '',           partName: '',                              barcode: '4397/2023',   processStage: 1, lastProcess: 'LATHE',               operator: 'SURAMANI',             lastEntryDate: '25/08/2023' },
  { sNo: 7672,  partNo: '',           partName: '',                              barcode: '4446/2023',   processStage: 1, lastProcess: 'LATHE',               operator: 'SURESH TURNER',        lastEntryDate: '13/10/2023' },
  { sNo: 8111,  partNo: '',           partName: '',                              barcode: '5606/2023',   processStage: 1, lastProcess: 'Laser cutting',       operator: 'VENKATESHWARAN-DRAW',  lastEntryDate: '20/02/2023' },
  { sNo: 9502,  partNo: '',           partName: '',                              barcode: '0005/2024',   processStage: 1, lastProcess: 'BANDSAW CUTTING',     operator: 'KALAISELVAN-TURNER',   lastEntryDate: '30/11/2024' },
  { sNo: 9797,  partNo: '',           partName: '',                              barcode: '7078/2023',   processStage: 2, lastProcess: 'Grinding',            operator: 'SHANMUGAM',            lastEntryDate: '12/04/2023' },
  { sNo: 8800,  partNo: '',           partName: '',                              barcode: '7080/2023',   processStage: 2, lastProcess: 'Grinding',            operator: 'SHANMUGAM',            lastEntryDate: '13/04/2023' },
  { sNo: 7953,  partNo: '',           partName: '',                              barcode: '7253/2023',   processStage: 2, lastProcess: 'Grinding',            operator: 'SHANMUGAM',            lastEntryDate: '22/04/2023' },
  { sNo: 8002,  partNo: '',           partName: '',                              barcode: '7268/2023',   processStage: 2, lastProcess: 'Grinding',            operator: 'SHANMUGAM',            lastEntryDate: '22/04/2023' },
  { sNo: 8005,  partNo: '',           partName: '',                              barcode: '7277/2023',   processStage: 2, lastProcess: 'Grinding',            operator: 'SHANMUGAM',            lastEntryDate: '19/04/2023' },
  { sNo: 6943,  partNo: '',           partName: '',                              barcode: '2/46/2023',   processStage: 2, lastProcess: 'Turning-CNC',        operator: 'SATHYAMOORTHY',        lastEntryDate: '25/07/2023' },
  { sNo: 7375,  partNo: 'CD20015',   partName: 'FOOT CLAMP PIN 56MM',           barcode: '3674/2023',   processStage: 3, lastProcess: 'DRILLING',            operator: 'HARISH',               lastEntryDate: '24/08/2023' },
  { sNo: 8048,  partNo: 'CD20026',   partName: 'FOOT CLAMP SUPPORT 1',          barcode: '7390/2023',   processStage: 1, lastProcess: 'Bandsaw Cutting',    operator: 'HARISH - BANDSAW CUTTING', lastEntryDate: '22/04/2023' },
  { sNo: 8532,  partNo: 'CD20026',   partName: 'FOOT CLAMP SUPPORT 2',          barcode: '7100/2023',   processStage: 1, lastProcess: 'Bandsaw Cutting',    operator: 'HARISH - BANDSAW CUTTING', lastEntryDate: '23/05/2023' },
  { sNo: 8953,  partNo: 'CD20029',   partName: 'FOOT CLAMP THREAD SHAFT',       barcode: '7242/2023',   processStage: 2, lastProcess: 'Turning',            operator: 'SATHYAMOORTHY',        lastEntryDate: '25/04/2023' },
  { sNo: 9335,  partNo: 'VAG-100551',partName: 'V2I GRIPPER ASSM',              barcode: '9056/2024',   processStage: 3, lastProcess: 'Bandsaw Cutting',    operator: 'N.SOWNDARYA',          lastEntryDate: '27/11/2024' },
  { sNo: 7316,  partNo: 'VAG-100552',partName: 'GRIPPER BOTTOM ROLLER PLATE 50X85X10MM', barcode: '3517/2025', processStage: 1, lastProcess: 'Laser cutting', operator: 'KALAISELVAN-TURNER', lastEntryDate: '24/03/2025' },
  { sNo: 6662,  partNo: 'VAG-100552',partName: 'GRIPPER BOTTOM ROLLER PLATE 50X85X10MM', barcode: '2213/2025', processStage: 1, lastProcess: 'Laser cutting', operator: 'N.SOWNDARYA',       lastEntryDate: '12/02/2025' },
  { sNo: 6114,  partNo: 'VAG-100552',partName: 'GRIPPER BOTTOM ROLLER PLATE 50X85X10MM', barcode: '1077/2025', processStage: 2, lastProcess: 'Laser cutting', operator: 'ERP2',              lastEntryDate: '13/09/2026' },
  { sNo: 452,   partNo: 'VAG-100552',partName: 'GRIPPER BOTTOM ROLLER PLATE 50X85X10MM', barcode: '02/04/2024', processStage: 1, lastProcess: 'Laser cutting', operator: 'N.SOWNDARYA',      lastEntryDate: '19/03/2024' },
  { sNo: 9336,  partNo: 'VAG-100553',partName: 'GRIPPER BASE PLATE',            barcode: '9057/2024',   processStage: 2, lastProcess: 'Laser cutting',      operator: 'KALAISELVAN-TURNER',   lastEntryDate: '18/11/2024' },
  { sNo: 7790,  partNo: 'VAG-100553',partName: 'GRIPPER BASE PLATE',            barcode: '4742/2025',   processStage: 2, lastProcess: 'Grinding',            operator: 'ERP2',                 lastEntryDate: '04/03/2025' },
  { sNo: 7817,  partNo: 'VAG-100553',partName: 'GRIPPER BASE PLATE',            barcode: '4783/2025',   processStage: 2, lastProcess: 'Grinding',            operator: 'KARTHICK-V10',         lastEntryDate: '18/01/2025' },
  { sNo: 591,   partNo: 'VAG-100553',partName: 'GRIPPER BASE PLATE',            barcode: '029668/2024', processStage: 2, lastProcess: 'Grinding',            operator: 'N.SOWNDARYA',          lastEntryDate: '10/04/2025' },
  { sNo: 2311,  partNo: 'VAG-100553',partName: 'GRIPPER BASE PLATE',            barcode: '033754/2025', processStage: 2, lastProcess: 'Grinding',            operator: 'KALAISELVAN-TURNER',   lastEntryDate: '11/03/2025' },
  { sNo: 1047,  partNo: 'VAG-100555',partName: 'GRIPPER BASE SUPPORT PLATE 2',  barcode: '030460/2024', processStage: 1, lastProcess: 'Bandsaw Cutting',    operator: 'N.SOWNDARYA',          lastEntryDate: '24/12/2024' },
  { sNo: 7524,  partNo: 'VAG-100555',partName: 'GRIPPER BASE SUPPORT PLATE 2',  barcode: '4014/2025',   processStage: 1, lastProcess: 'LASER CUTTING',      operator: 'ERP2',                 lastEntryDate: '02/12/2025' },
  { sNo: 9515,  partNo: 'VAG-100558',partName: 'GRIPPER SET 1',                 barcode: '9628/2024',   processStage: 1, lastProcess: 'GAS CUTTING',        operator: 'N.SOWNDARYA',          lastEntryDate: '27/11/2024' },
  { sNo: 9510,  partNo: 'VAG-100554',partName: 'GRIPPER SET 2',                 barcode: '9629/2024',   processStage: 1, lastProcess: 'GAS CUTTING',        operator: 'N.SOWNDARYA',          lastEntryDate: '27/11/2024' },
  { sNo: 9516,  partNo: 'VAG-100560',partName: 'GRIPPER SIDE PLATE 1',          barcode: '9630/2024',   processStage: 1, lastProcess: 'BANDSAW CUTTING',    operator: 'N.SOWNDARYA',          lastEntryDate: '27/11/2024' },
  { sNo: 6437,  partNo: 'VAG-100560',partName: 'GRIPPER SIDE PLATE 1',          barcode: '1737/2025',   processStage: 2, lastProcess: 'Bandsaw Cutting',    operator: 'conventional',         lastEntryDate: '09/09/2025' },
  { sNo: 7081,  partNo: 'VAG-100560',partName: 'GRIPPER SIDE PLATE 1',          barcode: '4491/2025',   processStage: 2, lastProcess: 'MANUAL GAS CUTTING', operator: 'ERP2',                 lastEntryDate: '03/12/2025' },
]

const stageColor = s => {
  if (s === 1) return 'bg-sky-100 text-sky-700'
  if (s === 2) return 'bg-amber-100 text-amber-700'
  if (s === 3) return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-100 text-slate-500'
}

const processColor = p => {
  const lp = (p || '').toLowerCase()
  if (lp.includes('laser') || lp.includes('gas cutting')) return 'text-red-600 font-semibold'
  if (lp.includes('grinding')) return 'text-purple-600 font-semibold'
  if (lp.includes('lathe') || lp.includes('turning')) return 'text-sky-600 font-semibold'
  if (lp.includes('bandsaw')) return 'text-amber-600 font-semibold'
  if (lp.includes('drill')) return 'text-emerald-600 font-semibold'
  return 'text-slate-600 font-semibold'
}

export default function ProcessCompleted() {
  const toast = useToast()
  const [stageFilter, setStageFilter] = useState('')
  const [rows, setRows] = useState(SEED_DATA)
  const [filtered, setFiltered] = useState(SEED_DATA)
  const [selectedRow, setSelectedRow] = useState(null)

  const handleSearch = () => {
    const q = stageFilter.trim()
    if (!q) {
      setFiltered(rows)
      toast.info(`Showing all ${rows.length} records.`)
    } else {
      const f = rows.filter(r => String(r.processStage) === q)
      setFiltered(f)
      toast.info(`${f.length} record(s) for Process Stage ${q}.`)
    }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSearch() }
  const handleExcel = () => toast.info(`Exporting ${filtered.length} records to Excel...`)
  const handlePdf   = () => toast.info('Generating PDF...')

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>Dashboard</span><ChevronRight size={12} /><span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Process Completed</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Barcode Process Status</h2>
              <span className="ml-1 text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{filtered.length} records</span>
            </div>
            <button className="text-slate-400 hover:text-red-600 transition-colors"><X size={20} strokeWidth={2.5} /></button>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Filter row ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Process Complete Stage</span>
                <FilterInput
                  value={stageFilter}
                  onChange={e => setStageFilter(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="1 / 2 / 3"
                  className="w-28"
                />
              </div>
              <button onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <Search size={13} /> Search
              </button>

              {/* Right toolbar */}
              <div className="ml-auto flex items-center gap-3 text-slate-500">
                <span className="text-[11px] font-bold">LS {filtered.length}</span>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-800 transition-colors"><Printer size={13} /> Dos</button>
                <button onClick={handleExcel} className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"><FileSpreadsheet size={13} /> Excel</button>
                <button onClick={handlePdf}   className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"><FileText size={13} /> Pdf</button>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-700 transition-colors"><Filter size={13} /> Filter</button>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-700 transition-colors"><Settings size={13} /> Setting</button>
              </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-200 inline-block" />Stage 1 — In Process</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-200 inline-block" />Stage 2 — Advanced</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-200 inline-block" />Stage 3 — Completed</div>
            </div>

            {/* ── Data Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-14 text-center">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Part No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Part Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-32">Barcode</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Process Stage</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-40">Last Process_Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-48">Last Entry_OperatorName</th>
                      <th className="px-3 py-2.5 w-28 text-center">Last_Entry_Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center text-slate-300">
                          <p className="text-[11px] font-bold uppercase tracking-widest">No records found</p>
                          <p className="text-[11px] text-slate-400 mt-1">Try a different process stage (1, 2, or 3)</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r, i) => {
                        const isSelected = selectedRow === i
                        return (
                          <tr key={i} onClick={() => setSelectedRow(i)}
                            className={`h-9 transition-colors cursor-pointer text-[12px] ${
                              isSelected ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'
                            }`}>
                            <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{r.sNo}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSelected ? 'text-white' : 'text-[#0097A7]'}`}>{r.partNo}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[240px] ${isSelected ? 'text-white' : 'text-slate-700'}`}>{r.partName}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSelected ? 'text-white' : 'text-slate-500'}`}>{r.barcode}</td>
                            <td className="px-3 py-1 border-r border-slate-100 text-center">
                              {isSelected
                                ? <span className="font-bold">{r.processStage}</span>
                                : <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageColor(r.processStage)}`}>{r.processStage}</span>
                              }
                            </td>
                            <td className={`px-3 py-1 border-r border-slate-100 ${isSelected ? 'text-white font-semibold' : processColor(r.lastProcess)}`}>{r.lastProcess}</td>
                            <td className={`px-3 py-1 border-r border-slate-100 ${isSelected ? 'text-white' : 'text-slate-600 font-semibold'}`}>{r.operator}</td>
                            <td className={`px-3 py-1 text-center ${isSelected ? 'text-white' : 'text-slate-500'}`}>{r.lastEntryDate}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500 gap-6">
                <span>Row : {filtered.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
