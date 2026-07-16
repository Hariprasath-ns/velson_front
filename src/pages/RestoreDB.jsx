import { useState } from 'react'
import { ChevronRight, UploadCloud, RotateCcw, CheckCircle, AlertCircle, Loader, ShieldAlert } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function RestoreDB(){
  const toast = useToast()
  const [form,setForm]=useState({BackupFile:null,BackupFileName:'',TargetDatabase:'velson_erp',OverwriteExisting:false})
  const [status,setStatus]=useState(null)
  const [log,setLog]=useState([])
  const [confirmed,setConfirmed]=useState(false)

  const sf=(k,v)=>setForm(f=>({...f,[k]:v}))

  const handleRestore=()=>{
    if(!form.BackupFileName){toast.warning('Please upload a backup file.');return}
    if(!form.OverwriteExisting){toast.warning('Please check "Overwrite Existing" to confirm you understand this is destructive.');return}
    if(!confirmed){toast.warning('Please confirm the restore operation by checking the confirmation box.');return}
    setStatus('running')
    const ts=new Date().toLocaleTimeString()
    setLog([
      `[${ts}] Starting restore operation...`,
      `[${ts}] Backup file: ${form.BackupFileName}`,
      `[${ts}] Target database: ${form.TargetDatabase}`,
      `[${ts}] Overwrite existing: Yes`,
    ])
    setTimeout(()=>{
      setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] Validating backup file...`])
      setTimeout(()=>{
        setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] Dropping existing tables...`])
        setTimeout(()=>{
          setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] Restoring schema...`])
          setTimeout(()=>{
            setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] Restoring data...`])
            setTimeout(()=>{
              setLog(l=>[...l,`[${new Date().toLocaleTimeString()}] ✓ Restore complete. Database is ready.`])
              setStatus('success')
            },1500)
          },1200)
        },900)
      },800)
    },600)
  }

  const handleReset=()=>{setForm({BackupFile:null,BackupFileName:'',TargetDatabase:'velson_erp',OverwriteExisting:false});setStatus(null);setLog([]);setConfirmed(false)}

  return(
    <div className="p-4 space-y-4 w-full min-w-0">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span><ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span><ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Restore DB</span>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-[13px] font-bold text-red-800">⚠ Destructive Operation</p>
          <p className="text-[12px] text-red-700 mt-0.5">Restoring a database will <strong>permanently overwrite</strong> all existing data in the target database. This action cannot be undone. Ensure you have a current backup before proceeding.</p>
        </div>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-red-600 px-4 py-2.5 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-white"/>
          <h2 className="text-white font-semibold text-[14px]">Database Restore</h2>
        </div>
        <div className="p-5 space-y-4 max-w-xl">
          <div className="flex items-start gap-3">
            <label className="text-[12.5px] font-semibold text-slate-600 w-36 shrink-0 pt-1">Backup File :</label>
            <div className="flex-1">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                {form.BackupFileName
                  ?<p className="text-[13px] font-semibold text-[#0097A7]">📄 {form.BackupFileName}</p>
                  :<div className="flex flex-col items-center gap-1 text-slate-400"><UploadCloud className="w-8 h-8 text-slate-300"/><p className="text-[13px]">Upload .sql or .bak backup file</p></div>
                }
                <input type="file" accept=".sql,.bak,.dump" className="mt-2 text-[12px] text-slate-500 w-full"
                  onChange={e=>{const f=e.target.files[0];if(f)sf('BackupFileName',f.name)}}/>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12.5px] font-semibold text-slate-600 w-36 shrink-0">Target Database :</label>
            <input value={form.TargetDatabase} onChange={e=>sf('TargetDatabase',e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-red-400"/>
          </div>
          <div className="space-y-2 border border-red-200 bg-red-50 rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.OverwriteExisting} onChange={e=>sf('OverwriteExisting',e.target.checked)} className="w-4 h-4 accent-red-600"/>
              <span className="text-[13px] text-red-800 font-semibold">I understand this will overwrite existing data</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="w-4 h-4 accent-red-600"/>
              <span className="text-[13px] text-red-800 font-semibold">I confirm I have a current backup and wish to proceed</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button onClick={handleRestore} disabled={status==='running'} className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              {status==='running'?<Loader className="w-4 h-4 animate-spin"/>:<RotateCcw className="w-4 h-4"/>}
              {status==='running'?'Restoring...':'Start Restore'}
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[13px] font-semibold rounded transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>

      {log.length>0&&(
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className={`px-4 py-2.5 flex items-center gap-2 ${status==='success'?'bg-[#27ae60]':status==='error'?'bg-red-600':'bg-slate-600'}`}>
            {status==='running'&&<Loader className="w-4 h-4 text-white animate-spin"/>}
            {status==='success'&&<CheckCircle className="w-4 h-4 text-white"/>}
            {status==='error'&&<AlertCircle className="w-4 h-4 text-white"/>}
            <h2 className="text-white font-semibold text-[14px]">Restore Log</h2>
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
