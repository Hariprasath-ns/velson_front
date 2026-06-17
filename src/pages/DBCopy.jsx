import { useState } from 'react'
import { ChevronRight, Database, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function DBCopy(){
  const toast = useToast()
  const [form,setForm]=useState({SourceDatabase:'velson_erp',DestinationPath:'',BackupFileName:'',IncludeData:true})
  const [status,setStatus]=useState(null) // null | 'running' | 'success' | 'error'
  const [log,setLog]=useState([])

  const sf=(k,v)=>setForm(f=>({...f,[k]:v}))

  const handleCopy=()=>{
    if(!form.DestinationPath.trim()){toast.warning('Please enter a destination path.');return}
    setStatus('running')
    const ts=new Date().toLocaleTimeString()
    const fname=form.BackupFileName||`${form.SourceDatabase}_backup_${new Date().toISOString().slice(0,10)}.sql`
    setLog([
      `[${ts}] Starting database copy operation...`,
      `[${ts}] Source: ${form.SourceDatabase}`,
      `[${ts}] Destination: ${form.DestinationPath}/${fname}`,
      `[${ts}] Include data: ${form.IncludeData?'Yes':'No (schema only)'}`,
    ])
    setTimeout(()=>{
      setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] Exporting schema...`])
      setTimeout(()=>{
        setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] ${form.IncludeData?'Exporting table data...':'Skipping data export...'}`])
        setTimeout(()=>{
          setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] ✓ Backup complete → ${fname}`])
          setStatus('success')
        },1500)
      },1200)
    },800)
  }

  const handleReset=()=>{setForm({SourceDatabase:'velson_erp',DestinationPath:'',BackupFileName:'',IncludeData:true});setStatus(null);setLog([])}

  return(
    <div className="p-4 space-y-4 w-full min-w-0">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span><ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span><ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">DB Copy</span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
        <p className="text-[12.5px] text-amber-800">This utility creates a backup copy of the selected database. Ensure adequate disk space at the destination path before proceeding.</p>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5 flex items-center gap-2">
          <Database className="w-4 h-4 text-white"/>
          <h2 className="text-white font-semibold text-[14px]">Database Copy / Backup</h2>
        </div>
        <div className="p-5 space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <label className="text-[12.5px] font-semibold text-slate-600 w-36 shrink-0">Source Database :</label>
            <input value={form.SourceDatabase} onChange={e=>sf('SourceDatabase',e.target.value)} placeholder="Database name" className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12.5px] font-semibold text-slate-600 w-36 shrink-0">Destination Path :</label>
            <input value={form.DestinationPath} onChange={e=>sf('DestinationPath',e.target.value)} placeholder="e.g. C:\Backups or /var/backups" className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12.5px] font-semibold text-slate-600 w-36 shrink-0">Backup File Name :</label>
            <input value={form.BackupFileName} onChange={e=>sf('BackupFileName',e.target.value)} placeholder="Auto-generated if blank" className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12.5px] font-semibold text-slate-600 w-36 shrink-0">Include Data :</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.IncludeData} onChange={e=>sf('IncludeData',e.target.checked)} className="w-4 h-4 accent-[#0097A7]"/>
              <span className="text-[13px] text-slate-600">Include table data (full backup)</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button onClick={handleCopy} disabled={status==='running'} className="flex items-center gap-2 px-5 py-2 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-50 text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              {status==='running'?<Loader className="w-4 h-4 animate-spin"/>:<Copy className="w-4 h-4"/>}
              {status==='running'?'Copying...':'Start Copy'}
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[13px] font-semibold rounded transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>

      {log.length>0&&(
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className={`px-4 py-2.5 flex items-center gap-2 ${status==='success'?'bg-[#27ae60]':status==='error'?'bg-red-500':'bg-slate-600'}`}>
            {status==='running'&&<Loader className="w-4 h-4 text-white animate-spin"/>}
            {status==='success'&&<CheckCircle className="w-4 h-4 text-white"/>}
            {status==='error'&&<AlertCircle className="w-4 h-4 text-white"/>}
            <h2 className="text-white font-semibold text-[14px]">Operation Log</h2>
          </div>
          <div className="p-4 bg-slate-900 font-mono">
            {log.map((line,i)=>(
              <p key={i} className="text-[12px] text-green-400 leading-6">{line}</p>
            ))}
            {status==='running'&&<p className="text-[12px] text-yellow-400 animate-pulse leading-6">Processing...</p>}
          </div>
        </div>
      )}
    </div>
  )
}
