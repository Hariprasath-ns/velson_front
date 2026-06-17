import { useState } from 'react'
import {
  ChevronRight, X, Printer, FileSpreadsheet, Play, FileBarChart
} from 'lucide-react'

const MOCK_DATA = [
  { jobNo: '4479', partId: '13682', sNo: '4135', barcode: '5050/2023', partName: 'VGH-10060315', material: 'DEVICE COVER 3', dimension: '', qty: '3', wt: '0.00', unit: "No's", notes: '-', completed: '100.00' },
  { jobNo: '4506', partId: '7438', sNo: '4136', barcode: '5081/2023', partName: 'VCV-900113', material: 'V9 RC LH RH NUT', dimension: '', qty: '2', wt: '0.00', unit: "No's", notes: '-', completed: '100.00' },
  { jobNo: '4516', partId: '13718', sNo: '4137', barcode: '5092/2023', partName: 'VCD-500613', material: 'EX CD 140 SCREW ROD LOCK PIN', dimension: '', qty: '2', wt: '0.00', unit: "No's", notes: '-', completed: '100.00' },
  { jobNo: '4536', partId: '9801', sNo: '4141', barcode: '5121/2023', partName: 'VGH-1000420', material: 'V10-9.5MTR MASTER-MASTER LOCK PLATE 1', dimension: '', qty: '10', wt: '0.00', unit: 'Set', notes: '-', completed: '100.00' },
  { jobNo: '4550', partId: '13754', sNo: '4152', barcode: '5138/2023', partName: 'VRC-601829', material: 'GRC TOP WINCH STOPPER BAR 1', dimension: '', qty: '2', wt: '0.00', unit: "No's", notes: '-', completed: '100.00' },
]

export default function CompletedJobList() {
  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Report</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Completed Job List</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Completed Job List</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold rounded-md transition-all">
                <Printer size={14} /> PrintData
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-md transition-all">
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm">
                <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" strokeWidth={3} />
                </div>
                Close
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[2000px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    <th className="px-2 py-3 border-r border-slate-300 w-10 text-center"></th>
                    {[
                      { label: 'Job No', w: 'w-24' },
                      { label: 'Part ID', w: 'w-24' },
                      { label: 'S.No', w: 'w-24' },
                      { label: 'Barcode', w: 'w-36' },
                      { label: 'Part Name', w: 'w-48' },
                      { label: 'Material', w: 'w-80' },
                      { label: 'Dimension(mm)', w: 'w-40' },
                      { label: 'QTY', w: 'w-24' },
                      { label: 'WT(Kg)', w: 'w-28' },
                      { label: 'Unit', w: 'w-28' },
                      { label: 'Notes', w: 'w-32' },
                      { label: 'Completed', w: 'w-32' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {MOCK_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f0f9fa]/40 transition-colors group">
                      <td className="px-2 py-2.5 border-r border-slate-200 bg-blue-600/10 flex items-center justify-center">
                        <Play size={10} className="text-blue-600 fill-blue-600" />
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-700">{row.jobNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-blue-600 font-medium">{row.partId}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-500">{row.sNo}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-700">{row.barcode}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-black text-[#0097A7] uppercase">{row.partName}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-semibold text-slate-600 uppercase">{row.material}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center text-slate-500">{row.dimension}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-blue-700">{row.qty}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-bold text-slate-800">{row.wt}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-medium text-slate-600">{row.unit}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center text-slate-400">{row.notes}</td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-right font-black text-emerald-600">{row.completed}</td>
                    </tr>
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <tr key={i} className="h-10">
                      <td className="border-r border-slate-100 bg-slate-50/20"></td>
                      {[...Array(12)].map((_, j) => <td key={j} className="border-r border-slate-100 last:border-r-0"></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Production Fulfillment Registry Console</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Completed Jobs: <span className="text-[#0097A7]">{MOCK_DATA.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
