import { useState } from 'react'
import { ChevronRight, X, Search, FileSpreadsheet, FileText, Filter, Settings, Printer } from 'lucide-react'
import { useToast } from '../components/Toast'

const FilterInput = ({ value, onChange, type = 'text', placeholder = '', className = '' }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    className={`px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all ${className}`} />
)
const TSelect = ({ options, value, onChange, placeholder = '', className = '' }) => (
  <div className={`relative ${className}`}>
    <select value={value} onChange={onChange}
      className="w-full px-2 py-[5px] pr-6 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all cursor-pointer">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
)

const MODELS = [
  'V2I', 'V4', 'V4I', 'V7', 'V3i', 'V9', 'VEDC', 'RC', 'V10',
  'POWERPACK', 'VELSON', 'Velson customer requirement', 'GRIPPER',
  'GEARBOX', 'SAMP', 'COMMON', 'UNDERGROUND DRILL', 'Consumables',
  'V3 XL', 'COMPRESSOR', 'EQUALIZER BEAM', 'VEM', 'CORE DRILL',
  'HDE', 'GRADE CONTROL MACHINE', 'MICROBLAST', 'MINICORE',
  'HD 300', 'AUTO JOB', 'HMD',
]

const PRIORITIES = ['P0', 'P1', 'P2', 'P3', 'P4', 'PE']

const SEED = [
  { id: 1, ncDate: '12/04/2026', grnNo: 'GRN-2026-0411', partNo: 'VC-100015',   partName: '10" SINGLE ROPE PULLEY 54',              qcQty: 60,  rejectionQty: 5,  okQty: 55, uom: 'NOS', barcode: '029784/2026', createdBy: 'ERP1' },
  { id: 2, ncDate: '11/04/2026', grnNo: 'GRN-2026-0409', partNo: 'VGH-1004441', partName: 'LW TILT MAST HOSE SLIDING 20MM PIN 75MM',  qcQty: 1,   rejectionQty: 1,  okQty: 0,  uom: 'NOS', barcode: '031489/2026', createdBy: 'ERP2' },
  { id: 3, ncDate: '10/04/2026', grnNo: 'GRN-2026-0407', partNo: 'VC-103207',   partName: 'FOOT CLAMP 180 TILTING JACKEY PIN',         qcQty: 4,   rejectionQty: 1,  okQty: 3,  uom: 'NOS', barcode: '004446/2026', createdBy: 'ADMIN' },
  { id: 4, ncDate: '09/04/2026', grnNo: 'GRN-2026-0406', partNo: 'VG-20114',    partName: 'XL ROTATION MOTOR OIL PUMP BODY',           qcQty: 20,  rejectionQty: 3,  okQty: 17, uom: 'NOS', barcode: '005606/2026', createdBy: 'ERP1' },
  { id: 5, ncDate: '08/04/2026', grnNo: 'GRN-2026-0404', partNo: 'VCS-300470',  partName: 'V3 CHAIN SPROCKET FOR 705C2K DEVICE',        qcQty: 6,   rejectionQty: 2,  okQty: 4,  uom: 'NOS', barcode: '000507/2026', createdBy: 'ERP3' },
  { id: 6, ncDate: '07/04/2026', grnNo: 'GRN-2026-0403', partNo: 'VC-106260',   partName: 'LW MAST CHAIN BOTTOM ROLLER BASE PLATE',    qcQty: 5,   rejectionQty: 1,  okQty: 4,  uom: 'NOS', barcode: '000508/2026', createdBy: 'ERP2' },
  { id: 7, ncDate: '06/04/2026', grnNo: 'GRN-2026-0402', partNo: 'VM-200253',   partName: 'V2-I 10.5 INCH CHASSIS BED SUPPORT PLATE 3', qcQty: 2,   rejectionQty: 1,  okQty: 1,  uom: 'NOS', barcode: '000509/2026', createdBy: 'ERP1' },
  { id: 8, ncDate: '05/04/2026', grnNo: 'GRN-2026-0401', partNo: 'VRC-601987',  partName: 'GRC CYCLONE SAMPLE INLET PIPE PLATE RH',    qcQty: 1,   rejectionQty: 1,  okQty: 0,  uom: 'NOS', barcode: '000510/2026', createdBy: 'ADMIN' },
  { id: 9, ncDate: '04/04/2026', grnNo: 'GRN-2026-0330', partNo: 'VGH-1003452', partName: 'D50 HITACHI 210 HAND RAIL FRAME 4 COVER',   qcQty: 1,   rejectionQty: 1,  okQty: 0,  uom: 'NOS', barcode: '000511/2026', createdBy: 'ERP2' },
  { id: 10,ncDate: '03/04/2026', grnNo: 'GRN-2026-0329', partNo: 'VC-101128',   partName: '6MM SQUARE ROD-83MM',                        qcQty: 100, rejectionQty: 10, okQty: 90, uom: 'NOS', barcode: '000512/2026', createdBy: 'ERP1' },
]

export default function NCJobCreated() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [priority, setPriority] = useState('')
  const [model, setModel] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [selectedRow, setSelectedRow] = useState(null)
  const [rows] = useState(SEED)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleAll = (e) => {
    if (e.target.checked) setSelected(new Set(rows.map(r => r.id)))
    else setSelected(new Set())
  }

  const handleSearch = () => toast.info(`Showing ${rows.length} NC job records.`)

  const handleCreateRouteCard = () => {
    if (selected.size === 0) { toast.warning('Please select at least one row to create a Route Card.'); return }
    toast.success(`Route Card created for ${selected.size} selected job(s).`)
  }

  const handleExcel = () => toast.info(`Exporting ${rows.length} records to Excel...`)
  const handlePdf   = () => toast.info('Generating PDF...')

  const totalQC  = rows.reduce((s, r) => s + r.qcQty, 0)
  const totalRej = rows.reduce((s, r) => s + r.rejectionQty, 0)
  const totalOK  = rows.reduce((s, r) => s + r.okQty, 0)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">NC Job Created</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">NC Job Created</h2>
            </div>
            <button className="text-slate-400 hover:text-red-600 transition-colors"><X size={20} strokeWidth={2.5} /></button>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Filter Row 1: dates + Search + Created Route Card ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">From Date :</span>
                <FilterInput type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">To Date :</span>
                <FilterInput type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
              </div>
              <button onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <Search size={13} /> Search
              </button>
              <button onClick={handleCreateRouteCard}
                className="flex items-center gap-1.5 px-4 py-[5px] bg-[#d32f2f] hover:bg-[#b71c1c] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                Created Route Card
              </button>
            </div>

            {/* ── Filter Row 2: Priority + Model ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Priority</span>
                <TSelect options={PRIORITIES} value={priority} onChange={e => setPriority(e.target.value)} placeholder="All" className="w-24" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Model</span>
                <TSelect options={MODELS} value={model} onChange={e => setModel(e.target.value)} placeholder="--- Select Model ---" className="w-60" />
              </div>
              {/* Right toolbar */}
              <div className="ml-auto flex items-center gap-3 text-slate-500">
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-800 transition-colors"><Printer size={13} /> Dos</button>
                <button onClick={handleExcel} className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"><FileSpreadsheet size={13} /> Excel</button>
                <button onClick={handlePdf}   className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"><FileText size={13} /> Pdf</button>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-700 transition-colors"><Filter size={13} /> Filter</button>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-slate-700 transition-colors"><Settings size={13} /> Setting</button>
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-10 text-center">
                        <input type="checkbox" className="cursor-pointer accent-white"
                          checked={selected.size === rows.length && rows.length > 0}
                          onChange={toggleAll} />
                      </th>
                      <th className="px-2 py-2.5 border-r border-blue-400 w-10 text-center">S.No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">NC_Date</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-32">GRN_NO</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Part_No</th>
                      <th className="px-3 py-2.5 border-r border-blue-400">Part_Name</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16 text-center">QC_Qty</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Rejection_Qty</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16 text-center">OK_Qty</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-16 text-center">UOM</th>
                      <th className="px-3 py-2.5 border-r border-blue-400 w-28">Barcode</th>
                      <th className="px-3 py-2.5 w-24">Created_by</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, i) => {
                      const isSel = selectedRow === r.id
                      const isChecked = selected.has(r.id)
                      return (
                        <tr key={r.id}
                          onClick={() => setSelectedRow(r.id)}
                          className={`h-9 transition-colors cursor-pointer text-[12px] ${
                            isSel ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'
                          }`}>
                          <td className="px-2 py-1 border-r border-slate-100 text-center" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="cursor-pointer accent-[#0097A7]"
                              checked={isChecked}
                              onChange={() => toggleSelect(r.id)} />
                          </td>
                          <td className={`px-2 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-400'}`}>{i + 1}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center ${isSel ? '' : 'text-slate-500'}`}>{r.ncDate}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSel ? '' : 'text-[#0097A7]'}`}>{r.grnNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSel ? '' : 'text-[#0097A7]'}`}>{r.partNo}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[240px] ${isSel ? '' : 'text-slate-700'}`}>{r.partName}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-slate-600'}`}>{r.qcQty}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-black ${isSel ? '' : 'text-red-600'}`}>{r.rejectionQty}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSel ? '' : 'text-emerald-600'}`}>{r.okQty}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 text-center ${isSel ? '' : 'text-slate-500'}`}>{r.uom}</td>
                          <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${isSel ? '' : 'text-slate-500'}`}>{r.barcode}</td>
                          <td className={`px-3 py-1 font-semibold ${isSel ? '' : 'text-slate-600'}`}>{r.createdBy}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer totals */}
              <div className="flex items-center border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500 gap-8">
                <span>Row : {rows.length}</span>
                <span>Total QC: {totalQC}</span>
                <span className="text-red-600">Total Rejection: {totalRej}</span>
                <span className="text-emerald-600">Total OK: {totalOK}</span>
                {selected.size > 0 && <span className="text-[#0097A7]">{selected.size} selected</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
