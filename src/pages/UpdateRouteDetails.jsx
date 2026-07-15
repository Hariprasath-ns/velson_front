import { useState, useEffect } from 'react'
import { ChevronRight, Save, Search, X, FileSpreadsheet, FileText, Filter, Settings, Printer } from 'lucide-react'
import { useToast } from '../components/Toast'

const FieldLabel = ({ children, required }) => (
  <td className="bg-[#B0BEC5]/30 border border-slate-300 px-2 py-1 text-[11px] font-bold text-slate-700 uppercase whitespace-nowrap min-w-[140px]">
    {required && <span className="text-red-500 mr-0.5">*</span>}{children}
  </td>
)
const FieldCell = ({ children, colSpan = 1, className = "" }) => (
  <td colSpan={colSpan} className={`border border-slate-300 px-0 py-0 ${className}`}>{children}</td>
)
const TInput = ({ value, onChange, placeholder = "", type = "text", readOnly = false, className = "" }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
    className={`w-full px-2 py-[5px] text-[12px] border-none bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-blue-50/30 transition-all ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''} ${className}`} />
)
const TSelect = ({ options, value, onChange, placeholder = "" }) => (
  <div className="relative w-full">
    <select value={value} onChange={onChange}
      className="w-full px-2 py-[5px] pr-6 text-[12px] border-none bg-white text-slate-700 appearance-none focus:outline-none focus:bg-blue-50/30 transition-all cursor-pointer">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
)
const FilterInput = ({ value, onChange, type = "text", className = "" }) => (
  <input type={type} value={value} onChange={onChange}
    className={`px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all ${className}`} />
)

const RAW_MATERIALS = [
  'HYDRAULIC PUMP-HYDRAULIC PUMP', 'HYDRAULIC MOTOR-HYDRAULIC MOTOR', 'HYDRAULIC VALVE-HYDRAULIC VALVE',
  'ELECTRICAL-CNC-ELECTRICAL-CNC', 'ELECTRICAL-SENSOR CLAMP-ELECTRICAL-SENSOR CLAMP',
  'ELECTRICAL-SENSING CLAMP-ELECTRICAL-SENSING CLAMP', 'ELECTRICAL-V10 CNC-ELECTRICAL-V10 CNC',
  'ELECTRICAL-RPM METER SET-ELECTRICAL-RPM METER SET', 'ELECTRICAL-CORE DRILL-ELECTRICAL-CORE DRILL',
  'ELECTRICAL-ELECTRIC PART-ELECTRICAL-ELECTRIC PART', 'ELECTRICAL-METER-ELECTRICAL-METER',
  'ELECTRICAL-SENSOR-ELECTRICAL-SENSOR', 'ELECTRICAL-LAPP CABLEWIRE-ELECTRICAL-LAPP CABLEWIRE',
  'ELECTRICAL-IGAS WIRE-ELECTRICAL-IGAS WIRE', 'ELECTRICAL-SPIRAL GLAND-ELECTRICAL-SPIRAL GLAND',
  'ELECTRICAL-WIRE-ELECTRICAL-WIRE', 'ELECTRICAL-AUTOMOBILE WIRE-ELECTRICAL-AUTOMOBILE WIRE',
  'ELECTRICAL-REMOTE-ELECTRICAL-REMOTE', 'ELECTRICAL-PUSHBUTTON-ELECTRICAL-PUSHBUTTON',
  'ELECTRICAL-ELEMENTS-ELECTRICAL-ELEMENTS', 'ELECTRICAL-SWITCH-ELECTRICAL-SWITCH',
  'ELECTRICAL-CONNECTOR-ELECTRICAL-CONNECTOR', 'ELECTIRCAL-MCB BOX-ELECTIRCAL-MCB BOX',
  'ELECTRICAL-MCB-ELECTRICAL-MCB', 'ELECTRICAL-SMPS-ELECTRICAL-SMPS',
  'ELECTRICAL-RELAY-ELECTRICAL-RELAY', 'ELECTRICAL-TAG-ELECTRICAL-TAG',
  'ELECTRICAL-PRESS SLIVE-ELECTRICAL-PRESS SLIVE', 'ELECTRICAL-RING SOCKET-ELECTRICAL-RING SOCKET',
  'ELECTRICAL-GLAND-ELECTRICAL-GLAND',
  'MS FLAT-MS FLAT', 'MS ROUND BAR-MS ROUND BAR', 'SS ROUND BAR-SS ROUND BAR',
  'ALUMINIUM PLATE-ALUMINIUM PLATE', 'MS PIPE-MS PIPE', 'HR SHEET-HR SHEET',
  'WELDING WIRE-WELDING WIRE', 'CUTTING TOOL-CUTTING TOOL',
]

const STORAGE_KEY = 'velson_update_route_details'

const now = () => {
  const d = new Date()
  return d.toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function UpdateRouteDetails() {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]

  const emptyForm = {
    routeCardNo: '', entryNo: '', jobId: '',
    jobNumber: '', qtyV: '', planQty: '',
    model: '', barcode: '', planDate: '',
    partNoPart: '', requiredDate: '',
    rawMaterialWt: '', materialWtBeforeHeat: '',
    matSpecification: '', cuttingSize: '',
    noOfDrawingSheet: '', gcNo: '',
    rawMaterial: '', issueQty: '',
    issueDate: now(),
  }

  const [form, setForm] = useState(emptyForm)
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [rows, setRows] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [rowCount, setRowCount] = useState(0)

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setRows(saved)
    setRowCount(saved.length)
  }, [])

  const handleSave = () => {
    if (!form.routeCardNo) { toast.warning('Route Card No is required.'); return }
    if (!form.rawMaterial) { toast.warning('Please select a Raw Material.'); return }
    if (!form.issueQty) { toast.warning('Issue Qty is required.'); return }

    const entry = {
      id: Date.now(),
      route: form.routeCardNo,
      rowId: rows.length + 1,
      jedRowId: form.entryNo || (rows.length + 1),
      jedBarcode: form.barcode || '',
      rawMaterialWt: form.rawMaterialWt || '0.00',
      heatTRWt: form.materialWtBeforeHeat || '0.00',
      materialSpec: form.matSpecification || '',
      gcNo: form.gcNo || '',
      noOfDrawingSheet: form.noOfDrawingSheet || '',
      cuttingSize: form.cuttingSize || '',
      rawMaterialEntryBy: 'ERP1',
      rawMaterialEntryDate: now(),
      rawMaterial: form.rawMaterial,
      issueQty: form.issueQty,
      jobNo: form.jobNumber,
      partName: form.partNoPart,
    }

    const updated = [...rows, entry]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setRows(updated)
    setRowCount(updated.length)
    toast.success('Route card details saved successfully!')
    setForm({ ...emptyForm, issueDate: now() })
  }

  const handleSearch = () => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setRows(saved)
    setRowCount(saved.length)
    toast.info(`Showing ${saved.length} records.`)
  }

  const handleExcel = () => toast.info(`Exporting ${rows.length} records to Excel...`)
  const handlePdf = () => toast.info('Generating PDF...')

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span><ChevronRight size={12} /> */}
          <span>Technical</span><ChevronRight size={12} />
          <span className="text-[#0097A7]">Update Route Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Update Route Card Details</h2>
            </div>
            <button className="text-slate-400 hover:text-red-600 transition-colors"><X size={20} strokeWidth={2.5} /></button>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Main Form + Image ── */}
            <div className="flex gap-4">
              {/* Left: Form Table */}
              <div className="flex-1">
                <table className="w-full border-collapse text-[12px]">
                  <tbody>
                    {/* Row 1 */}
                    <tr>
                      <FieldLabel>Route Card No</FieldLabel>
                      <FieldCell><TInput value={form.routeCardNo} onChange={u('routeCardNo')} /></FieldCell>
                      <FieldLabel>Entry No</FieldLabel>
                      <FieldCell><TInput value={form.entryNo} onChange={u('entryNo')} /></FieldCell>
                      <FieldLabel>Job ID</FieldLabel>
                      <FieldCell><TInput value={form.jobId} onChange={u('jobId')} readOnly /></FieldCell>
                    </tr>
                    {/* Row 2 */}
                    <tr>
                      <FieldLabel>JOB Number</FieldLabel>
                      <FieldCell><TInput value={form.jobNumber} onChange={u('jobNumber')} /></FieldCell>
                      <FieldLabel>Qty/V</FieldLabel>
                      <FieldCell><TInput value={form.qtyV} onChange={u('qtyV')} /></FieldCell>
                      <FieldLabel>Plan Qty</FieldLabel>
                      <FieldCell><TInput value={form.planQty} onChange={u('planQty')} /></FieldCell>
                    </tr>
                    {/* Row 3 */}
                    <tr>
                      <FieldLabel>Model</FieldLabel>
                      <FieldCell><TInput value={form.model} onChange={u('model')} /></FieldCell>
                      <FieldLabel>Barcode</FieldLabel>
                      <FieldCell><TInput value={form.barcode} onChange={u('barcode')} /></FieldCell>
                      <FieldLabel>Plan Date</FieldLabel>
                      <FieldCell><TInput type="date" value={form.planDate} onChange={u('planDate')} /></FieldCell>
                    </tr>
                    {/* Row 4 */}
                    <tr>
                      <FieldLabel>Part No /Part Name</FieldLabel>
                      <FieldCell colSpan={3}><TInput value={form.partNoPart} onChange={u('partNoPart')} /></FieldCell>
                      <FieldLabel>Required Date</FieldLabel>
                      <FieldCell><TInput type="date" value={form.requiredDate} onChange={u('requiredDate')} /></FieldCell>
                    </tr>
                    {/* Row 5 */}
                    <tr>
                      <FieldLabel>Raw Material Wt</FieldLabel>
                      <FieldCell><TInput value={form.rawMaterialWt} onChange={u('rawMaterialWt')} placeholder="0.00" /></FieldCell>
                      <FieldLabel colSpan={2}>Material WT Before Heat</FieldLabel>
                      <FieldCell colSpan={3}><TInput value={form.materialWtBeforeHeat} onChange={u('materialWtBeforeHeat')} placeholder="0.00" /></FieldCell>
                    </tr>
                    {/* Row 6 */}
                    <tr>
                      <FieldLabel>Mat.Specification</FieldLabel>
                      <FieldCell><TInput value={form.matSpecification} onChange={u('matSpecification')} /></FieldCell>
                      <FieldLabel>Cutting Size</FieldLabel>
                      <FieldCell colSpan={3}><TInput value={form.cuttingSize} onChange={u('cuttingSize')} /></FieldCell>
                    </tr>
                    {/* Row 7 */}
                    <tr>
                      <FieldLabel>No.of Drawing Sheet</FieldLabel>
                      <FieldCell><TInput value={form.noOfDrawingSheet} onChange={u('noOfDrawingSheet')} /></FieldCell>
                      <FieldLabel>GC.No</FieldLabel>
                      <FieldCell colSpan={3}><TInput value={form.gcNo} onChange={u('gcNo')} /></FieldCell>
                    </tr>
                    {/* Row 8 */}
                    <tr>
                      <FieldLabel required>Raw Material</FieldLabel>
                      <FieldCell colSpan={5}>
                        <TSelect options={RAW_MATERIALS} value={form.rawMaterial} onChange={u('rawMaterial')} placeholder="--- Select Raw Material ---" />
                      </FieldCell>
                    </tr>
                    {/* Row 9 */}
                    <tr>
                      <FieldLabel required>Issue Qty</FieldLabel>
                      <FieldCell>
                        <TInput value={form.issueQty} onChange={u('issueQty')} placeholder="0" />
                      </FieldCell>
                      <FieldLabel>Issue Date</FieldLabel>
                      <FieldCell colSpan={3}>
                        <div className="flex items-center gap-1">
                          <TInput value={form.issueDate} onChange={u('issueDate')} readOnly className="flex-1" />
                          <button onClick={handleSave}
                            className="flex items-center gap-1 px-3 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded transition-all active:scale-95 mr-1 whitespace-nowrap">
                            <Save size={12} /> Save
                          </button>
                        </div>
                      </FieldCell>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right: Image panel */}
              <div className="w-[180px] flex-shrink-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Image</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg w-full h-[180px] flex items-center justify-center text-slate-200">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ── Date Filter Row ── */}
            <div className="flex items-center gap-3 pt-1">
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

              {/* Right toolbar */}
              <div className="ml-auto flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500">LS {rowCount}</span>
                <button className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 transition-colors"><Printer size={13} /> Dos</button>
                <button onClick={handleExcel} className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"><FileSpreadsheet size={13} /> Excel</button>
                <button onClick={handlePdf} className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"><FileText size={13} /> Pdf</button>
                <button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors"><Filter size={13} /> Filter</button>
                <button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors"><Settings size={13} /> Setting</button>
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2 border-r border-blue-400 w-24">Route</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-16">Row Id</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-20">JED_Row_Id</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-28">JED_Barcode</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-24 text-center">Raw Material Wt</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-24 text-center">Heat TR Wt</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-36">Material Specification</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-20">GC No</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-32">No.Of Drawing Sheet</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-24">Cutting Size</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-36">Raw Material Entry By</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-36">Raw Material Entry Date</th>
                      <th className="px-3 py-2 w-48">Raw Material</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-16 text-center text-slate-300">
                          <p className="text-[11px] font-bold uppercase tracking-widest">Row : 0</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr key={r.id}
                          onClick={() => setSelectedRow(r.id)}
                          className={`h-9 transition-colors cursor-pointer text-[12px] ${selectedRow === r.id ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'}`}>
                          <td className="px-3 py-1 border-r border-slate-100">{r.route}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center">{r.rowId}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center">{r.jedRowId}</td>
                          <td className="px-3 py-1 border-r border-slate-100 font-mono text-[11px]">{r.jedBarcode}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center">{r.rawMaterialWt}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-center">{r.heatTRWt}</td>
                          <td className="px-3 py-1 border-r border-slate-100">{r.materialSpec}</td>
                          <td className="px-3 py-1 border-r border-slate-100">{r.gcNo}</td>
                          <td className="px-3 py-1 border-r border-slate-100">{r.noOfDrawingSheet}</td>
                          <td className="px-3 py-1 border-r border-slate-100">{r.cuttingSize}</td>
                          <td className="px-3 py-1 border-r border-slate-100">{r.rawMaterialEntryBy}</td>
                          <td className="px-3 py-1 border-r border-slate-100 text-[11px]">{r.rawMaterialEntryDate}</td>
                          <td className="px-3 py-1 text-[11px] truncate max-w-[180px]">{r.rawMaterial}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer row */}
              <div className="flex items-center border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500 gap-8">
                <span>Row : {rows.length}</span>
                <span>0</span>
                <span>0.00</span>
                <span>0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
