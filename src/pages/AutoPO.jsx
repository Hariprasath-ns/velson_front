import { useState } from 'react'
import { ChevronRight, RefreshCw, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react'
import { useToast } from '../components/Toast'

const SUPPLIERS=['ABC Supplies Pvt Ltd','XYZ Components Ltd','PQR Raw Materials Co.','DEF Industrial Supplies']

const LOW_STOCK=[
  {id:1,IM_Part_No:'PRT-003',IM_PartName:'V-Belt 1250mm',CurrentStock:5,ReorderLevel:20,MinStock:25,SupplierId:'',POQuantity:25},
  {id:2,IM_Part_No:'PRT-007',IM_PartName:'Bearing 6205 ZZ',CurrentStock:2,ReorderLevel:10,MinStock:15,SupplierId:'',POQuantity:15},
  {id:3,IM_Part_No:'PRT-012',IM_PartName:'Oil Seal 40x60',CurrentStock:0,ReorderLevel:8,MinStock:12,SupplierId:'',POQuantity:12},
  {id:4,IM_Part_No:'PRT-019',IM_PartName:'M12 Hex Bolt (Pkg 100)',CurrentStock:1,ReorderLevel:5,MinStock:10,SupplierId:'',POQuantity:10},
]

export default function AutoPO(){
  const toast = useToast()
  const [items,setItems]=useState(LOW_STOCK)
  const [approved,setApproved]=useState([])
  const [generated,setGenerated]=useState(false)

  const updateItem=(id,k,v)=>setItems(its=>its.map(x=>x.id===id?{...x,[k]:v}:x))

  const handleGeneratePO=()=>{
    const selected=items.filter(i=>i.SupplierId)
    if(!selected.length){toast.warning('Please select a supplier for at least one item.');return}
    setApproved(selected)
    setGenerated(true)
  }

  return(
    <div className="p-4 space-y-4 w-full min-w-0">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span><ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span><ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Auto PO</span>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-[13px] font-semibold text-amber-800">Auto Purchase Order Scanner</p>
          <p className="text-[12px] text-amber-700 mt-0.5">The table below shows all items where <strong>Current Stock &lt; Reorder Level</strong>. Assign a supplier and confirm the PO quantity, then click <strong>Generate PO</strong>.</p>
        </div>
      </div>

      {/* Low stock items */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-[14px]">Items Below Reorder Level</h2>
          <button onClick={()=>{setItems(LOW_STOCK);setGenerated(false);setApproved([])}} className="flex items-center gap-1 text-white/80 hover:text-white text-[12px]"><RefreshCw className="w-3.5 h-3.5"/>Refresh</button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['S.No','Part No.','Part Name','Current Stock','Reorder Level','Min. Stock','Supplier','PO Quantity'].map(h=>(
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r,idx)=>(
                <tr key={r.id} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''}`}>
                  <td className="px-3 py-2 text-center">{idx+1}</td>
                  <td className="px-3 py-2 text-center font-mono font-semibold text-[#0097A7]">{r.IM_Part_No}</td>
                  <td className="px-3 py-2 text-left font-medium">{r.IM_PartName}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[12px] ${r.CurrentStock===0?'bg-red-100 text-red-700':'bg-orange-100 text-orange-700'}`}>{r.CurrentStock}</span>
                  </td>
                  <td className="px-3 py-2 text-center text-slate-500">{r.ReorderLevel}</td>
                  <td className="px-3 py-2 text-center text-slate-500">{r.MinStock}</td>
                  <td className="px-3 py-2 text-center">
                    <select value={r.SupplierId} onChange={e=>updateItem(r.id,'SupplierId',e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-40">
                      <option value="">--- Select ---</option>
                      {SUPPLIERS.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="number" min="1" value={r.POQuantity} onChange={e=>updateItem(r.id,'POQuantity',Number(e.target.value))} className="border border-slate-300 rounded px-2 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-20 text-center"/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
          <button onClick={handleGeneratePO} className="flex items-center gap-2 px-5 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
            <ShoppingCart className="w-4 h-4"/> Generate PO
          </button>
        </div>
      </div>

      {/* Generated POs */}
      {generated&&approved.length>0&&(
        <div className="bg-white rounded border border-green-200 shadow-sm overflow-hidden">
          <div className="bg-[#27ae60] px-4 py-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-white"/>
            <h2 className="text-white font-semibold text-[14px]">Purchase Orders Generated — Pending Approval</h2>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-[13px]">
              <thead><tr className="bg-green-50 border-b border-green-200">{['Part No.','Part Name','Supplier','PO Quantity','Status'].map(h=><th key={h} className="text-center px-3 py-2.5 font-semibold text-green-800 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {approved.map((r,idx)=>(
                  <tr key={r.id} className={`border-b border-green-100 ${idx%2===1?'bg-green-50/30':''}`}>
                    <td className="px-3 py-2 text-center font-mono font-semibold text-[#0097A7]">{r.IM_Part_No}</td>
                    <td className="px-3 py-2 text-center">{r.IM_PartName}</td>
                    <td className="px-3 py-2 text-center">{r.SupplierId}</td>
                    <td className="px-3 py-2 text-center font-semibold">{r.POQuantity}</td>
                    <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">Pending Approval</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
