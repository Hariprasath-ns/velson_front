import { useState, useEffect, Fragment } from 'react'
import * as XLSX from 'xlsx'
import logoImg from '../assets/logo.png'
import { ChevronRight, ChevronDown, Search, X, FileSpreadsheet, CheckCircle2, Eye, Image as ImageIcon, Save, Lock, PieChart as PieChartIcon, Clock, Check, Activity, Archive } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { PieChart, PieSlice, PieCenter } from '../components/ui/PieChart'


const Input = ({ placeholder, value, onChange, type = 'text', className = "" }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange}
    className={`px-3 py-[6px] text-[12px] border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`} />
)
const Select = ({ options, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select value={value} onChange={onChange}
      className="w-full px-3 py-[6px] pr-7 text-[12px] border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer font-semibold">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
)

const STAGES = ['All', 'In Process', 'Waiting for Process', 'Close', 'Cancel']

const formatPDDate = (dtStr) => {
  if (!dtStr) return '—'
  try {
    const d = new Date(dtStr)
    if (isNaN(d.getTime())) return dtStr
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const day = String(d.getDate()).padStart(2, '0')
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
    return `${day}- ${month} -${year} ${strTime}`
  } catch {
    return dtStr
  }
}

const formatDate = (d) => {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return String(d)
    const day = String(dt.getDate()).padStart(2, '0')
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const year = dt.getFullYear()
    return `${day}-${month}-${year}`
  } catch {
    return String(d)
  }
}

const printJobProcessDetails = (job, processMasters = []) => {
  if (!job) return;

  const win = window.open('', '_blank', 'width=900,height=750')
  if (!win) {
    alert('Please allow popups to print/export PDF.')
    return
  }

  // Format dates
  const planDate = formatDate(job.currentDate || job.planDate)
  const issueDate = formatDate(job.currentDate || job.planDate)
  const deliveryDate = formatDate(job.requiredDate)
  const startDate = formatDate(job.currentDate || job.planDate)
  const closedDate = job.stage === 'Completed' ? formatDate(job.technicalApprovalDate || new Date()) : '-'

  // Map line items or fallback to single row
  const parts = job.partsList && job.partsList.length > 0
    ? job.partsList
    : [{
      partNo: job.partNo || '-',
      productName: job.productName || '-',
      qty: job.qty || 0,
      completedPct: job.completedPct || 0,
      lineItems: job.lineItems || []
    }]

  const itemsHtml = parts.map((part, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="text-center font-mono">${part.partNo || '-'}</td>
      <td>${part.partNo || '-'}</td>
      <td>${part.productName || '-'}</td>
      <td class="text-center font-bold">${parseFloat(part.qty || 0).toFixed(2)}</td>
      <td class="text-center">0.00</td>
      <td class="text-center">Nos</td>
      <td class="text-center font-bold">${parseFloat(part.completedPct || 0).toFixed(2)}%</td>
    </tr>
  `).join('')

  console.log('printJobProcessDetails: parts', parts)
  console.log('printJobProcessDetails: processMasters', processMasters)

  // Build the HTML for the workflow/sub-process tables
  const workflowHtml = parts.map((partDetail) => {
    const partProcesses = partDetail.processMenus && partDetail.processMenus.length > 0
      ? partDetail.processMenus
      : processMasters
          .filter(pm => {
            if (!pm.PM_Part_Name || !partDetail.productName) return false
            return pm.PM_Part_Name.trim().toLowerCase() === partDetail.productName.trim().toLowerCase()
          })
          .sort((a, b) => (Number(a.PM_Process_Order) || 0) - (Number(b.PM_Process_Order) || 0))

    if (partProcesses.length === 0) {
      return `
        <div style="margin-top: 15px; margin-bottom: 25px;">
          <h3 style="font-size: 11px; font-weight: bold; color: #0097A7; margin-bottom: 5px; text-transform: uppercase; border-bottom: 1px solid #0097A7; padding-bottom: 4px;">
            Workflow for: ${partDetail.productName} (${partDetail.partNo || '-'})
          </h3>
          <p style="font-style: italic; color: #666; font-size: 10px; margin: 10px 0;">No processes defined in Process Master for this part.</p>
        </div>
      `
    }

    const rowsHtml = partProcesses.map((pm, pIdx) => {
      const savedLi = partDetail.lineItems ? partDetail.lineItems.find(li => li.processName === pm.PM_Process_Name) : null

      let stateText
      let stateStyle = 'color: #666; font-weight: bold;'
      if (savedLi?.notApplicable) {
        stateText = 'N/A'
        stateStyle = 'color: #e53e3e; font-weight: bold; background: #fff5f5; border: 1px solid #fed7d7; padding: 1px 4px; border-radius: 3px;'
      } else {
        const state = savedLi ? savedLi.state : (pIdx === 0 ? 'IN' : '-');
        stateText = state;
        if (state === 'IN') {
          stateStyle = 'color: #3182ce; font-weight: bold; background: #ebf8ff; border: 1px solid #bee3f8; padding: 1px 4px; border-radius: 3px;'
        } else if (state === 'OUT') {
          stateStyle = 'color: #4a5568; font-weight: bold; background: #edf2f7; border: 1px solid #e2e8f0; padding: 1px 4px; border-radius: 3px;'
        } else if (state === 'QC') {
          stateStyle = 'color: #dd6b20; font-weight: bold; background: #fffaf0; border: 1px solid #feebc8; padding: 1px 4px; border-radius: 3px;'
        } else if (state && state !== '-') {
          stateStyle = 'color: #e53e3e; font-weight: bold; background: #fff5f5; border: 1px solid #fed7d7; padding: 1px 4px; border-radius: 3px;'
        }
      }

      const empName = savedLi?.empName || '—'
      const machineName = savedLi?.machineName || pm.Machine_Name || '—'
      const processDate = savedLi?.processDate ? formatPDDate(savedLi.processDate) : '—'
      const remarks = savedLi?.remarks || '—'

      return `
        <tr>
          <td class="text-center">${pIdx + 1}</td>
          <td class="font-bold" style="color: #333;">${pm.PM_Process_Name}</td>
          <td class="text-center"><span style="${stateStyle}">${stateText}</span></td>
          <td>${empName}</td>
          <td>${machineName}</td>
          <td class="text-center font-mono">${processDate}</td>
          <td>${remarks}</td>
        </tr>
      `
    }).join('')

    return `
      <div style="margin-top: 25px; margin-bottom: 25px; page-break-inside: avoid;">
        <h3 style="font-size: 11px; font-weight: bold; color: #0097A7; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1.5px solid #0097A7; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>Workflow for: ${partDetail.productName} (${partDetail.partNo || '-'})</span>
          <span style="font-size: 10px; color: #444; font-weight: normal; text-transform: none;">Qty: ${partDetail.qty || 0}</span>
        </h3>
        <table class="details-table">
          <thead>
            <tr>
              <th style="width: 5%;">S.No</th>
              <th style="width: 20%;">Process Name</th>
              <th style="width: 10%;">State</th>
              <th style="width: 20%;">Employee Name</th>
              <th style="width: 20%;">Machine Name</th>
              <th style="width: 15%;">Process Date</th>
              <th style="width: 10%;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `
  }).join('')

  const logoUrl = logoImg.startsWith('data:')
    ? logoImg
    : `${window.location.origin}${logoImg.startsWith('/') ? '' : '/'}${logoImg}`

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Job Process Details - ${job.jobNo}</title>
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 10px;
          color: #222;
          background: #fff;
          font-size: 11px;
        }
        .outer-border {
          border: 4px double #000;
          padding: 24px;
          min-height: 98vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .header-container {
          display: flex;
          align-items: center;
          border-bottom: 2px solid #0097A7;
          padding-bottom: 12px;
          margin-bottom: 15px;
        }
        .logo-box {
          margin-right: 20px;
        }
        .logo-box img {
          height: 48px;
          width: auto;
          display: block;
        }
        .text-logo {
          font-size: 22px;
          font-weight: 900;
          color: #0097A7;
          letter-spacing: 3px;
        }
        .company-info {
          flex: 1;
          text-align: center;
          margin-right: 120px; /* balance logo space */
        }
        .company-info p {
          margin: 2px 0;
          font-size: 10px;
          color: #444;
          font-weight: 500;
        }
        .report-title {
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 15px 0 20px;
          text-transform: uppercase;
          text-decoration: underline;
          color: #111;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 40px;
          margin-bottom: 25px;
          padding: 10px 5px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          font-size: 11px;
        }
        .meta-label {
          font-weight: bold;
          color: #333;
          width: 95px;
          flex-shrink: 0;
        }
        .meta-value {
          color: #111;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .details-table th {
          border: 1px solid #222;
          background: #f7fafc;
          padding: 8px 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          text-align: center;
        }
        .details-table td {
          border: 1px solid #222;
          padding: 7px 8px;
          font-size: 10px;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .font-bold {
          font-weight: bold;
        }
        .footer {
          border-top: 1px solid #ddd;
          padding-top: 10px;
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #666;
          font-weight: 500;
        }
        @media print {
          @page {
            margin: 0;
          }
          body {
            padding: 0;
            margin: 20px;
          }
          .outer-border {
            min-height: calc(100vh - 40px);
            border: 4px double #000;
          }
        }
      </style>
    </head>
    <body>
      <div class="outer-border">
        <div>
          <div class="header-container">
            <div class="logo-box">
              <img src="${logoUrl}" alt="VELSON" onerror="this.style.display='none'; document.getElementById('fallback-logo').style.display='block';" />
              <div id="fallback-logo" class="text-logo" style="display: none;">VELSON</div>
            </div>
            <div class="company-info">
              <p style="font-size: 11px; font-weight: bold; margin: 0 0 4px;">SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O),</p>
              <p>Sankari (TK), Salem-637302. Tamilnadu.</p>
              <p>Contact Details: 8489339933</p>
            </div>
          </div>

          <div class="report-title">Job Process Details</div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Job No :</span>
              <span class="meta-value font-bold" style="color: #0097A7; font-size: 13px;">${job.jobNo}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Delivery Date :</span>
              <span class="meta-value font-bold">${deliveryDate}</span>
            </div>
           
            <div class="meta-item">
              <span class="meta-label">Plan Date :</span>
              <span class="meta-value">${planDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Issue Date :</span>
              <span class="meta-value">${issueDate}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Start Date :</span>
              <span class="meta-value">${startDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Closed Date :</span>
              <span class="meta-value">${closedDate}</span>
            </div>
          </div>

          <table class="details-table">
            <thead>
              <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 20%;">Part Number</th>
                <th style="width: 20%;">Part Name</th>
                <th style="width: 30%;">Material</th>
                <th style="width: 8%;">Qty</th>
                <th style="width: 8%;">WT(kg)</th>
                <th style="width: 9%;">Unit</th>
                <th style="width: 10%;">Completed(%)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${workflowHtml}
        </div>

        <div class="footer">
          <span>VELSON ERP - System Generated Report</span>
          <span>Generated Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `)
  win.document.close()
}

const getCompletedPct = (productName, lineItems, procMasters) => {
  const processes = procMasters.filter(pm => pm.PM_Part_Name === productName)
  if (processes.length === 0) return 0
  let completedCount = 0
  processes.forEach(pm => {
    const savedLi = lineItems.find(li => li.processName === pm.PM_Process_Name)
    if (savedLi && (savedLi.state === 'OUT' || savedLi.state === 'QC' || savedLi.notApplicable)) {
      completedCount++
    }
  })
  return (completedCount / processes.length) * 100
}

const getPartStage = (productName, lineItems, procMasters) => {
  const processes = procMasters.filter(pm => pm.PM_Part_Name === productName)
  if (processes.length === 0) return 'Waiting'

  let started = false
  let allDone = true

  processes.forEach(pm => {
    const savedLi = lineItems.find(li => li.processName === pm.PM_Process_Name)
    if (savedLi) {
      if (savedLi.state || savedLi.notApplicable) {
        started = true
      }
      if (!(savedLi.state === 'OUT' || savedLi.state === 'QC' || savedLi.notApplicable)) {
        allDone = false
      }
    } else {
      allDone = false
    }
  })

  if (allDone) return 'Completed'
  if (started) return 'In Process'
  return 'Waiting'
}

const PartProcessDonut = ({ partDetail, processMasters }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const partProcesses = partDetail.processMenus && partDetail.processMenus.length > 0
    ? partDetail.processMenus
    : processMasters
        .filter(pm => pm.PM_Part_Name === partDetail.productName)
        .sort((a, b) => (Number(a.PM_Process_Order) || 0) - (Number(b.PM_Process_Order) || 0))

  let completedCount = 0
  let qcCount = 0
  let inProcessCount = 0
  let pendingCount = 0

  partProcesses.forEach(pm => {
    const savedLi = partDetail.lineItems.find(li => li.processName === pm.PM_Process_Name)
    if (savedLi) {
      if (savedLi.notApplicable || savedLi.state === 'OUT') {
        completedCount++
      } else if (savedLi.state === 'QC') {
        qcCount++
      } else if (savedLi.state === 'IN') {
        inProcessCount++
      } else {
        pendingCount++
      }
    } else {
      pendingCount++
    }
  })

  const donutData = [
    { label: 'Completed', value: completedCount, color: '#10B981' },
    { label: 'QC Check', value: qcCount, color: '#F59E0B' },
    { label: 'In Work', value: inProcessCount, color: '#0EA5E9' },
    { label: 'Pending', value: pendingCount, color: '#94A3B8' }
  ]

  const totalProcs = partProcesses.length

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/65 flex flex-col items-center justify-center w-[250px] shadow-sm select-none">
      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Process Summary</h5>

      {/* Donut Chart Wrapper to handle visual overflow of innerRadius={93} size={110} */}
      <div className="h-[186px] w-[186px] flex items-center justify-center relative">
        <PieChart
          data={donutData}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
          innerRadius={93}
          size={110}
        >
          {donutData.map((slice, idx) => (
            <PieSlice key={slice.label} index={idx} />
          ))}
          <PieCenter defaultLabel="Steps" />
        </PieChart>
      </div>

      {/* Interactive Legend */}
      <div className="w-full mt-4 space-y-1">
        {donutData.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const isAnyHovered = hoveredIndex !== null;
          return (
            <div
              key={idx}
              className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg transition-all duration-250 cursor-pointer border ${isHovered
                  ? 'bg-white border-slate-200 shadow-sm scale-[1.02]'
                  : 'border-transparent hover:bg-white/60'
                }`}
              style={{
                opacity: isAnyHovered && !isHovered ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: item.color,
                    transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider truncate">{item.label}</span>
              </div>
              <span className="text-[10px] font-black text-slate-750 font-mono">
                {item.value} <span className="text-[8px] font-semibold text-slate-400">({totalProcs > 0 ? ((item.value / totalProcs) * 105).toFixed(0) : 0}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  )
}

const ProcessTimeline = ({ processes, lineItems }) => {
  if (processes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-450 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <Activity size={32} className="opacity-35 mb-2 text-slate-400" />
        <p className="text-[11px] font-black uppercase tracking-wider">No Process Flow Defined</p>
        <p className="text-[10px] text-slate-500 mt-1">Please define processes for this part in Process Master.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
      {processes.map((pm, idx) => {
        const savedLi = lineItems.find(li => li.processName === pm.PM_Process_Name)

        let status = 'pending' // pending, in-progress, qc, completed
        if (savedLi?.notApplicable) {
          status = 'completed'
        } else if (savedLi?.state === 'OUT') {
          status = 'completed'
        } else if (savedLi?.state === 'QC') {
          status = 'qc'
        } else if (savedLi?.state === 'IN') {
          status = 'in-progress'
        }

        const statusColors = {
          completed: {
            bg: 'bg-emerald-50/55',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            accent: 'bg-emerald-500',
            bulletBg: 'bg-emerald-500 text-white',
            bulletBorder: 'border-emerald-100',
            label: 'Completed'
          },
          qc: {
            bg: 'bg-amber-50/55',
            border: 'border-amber-200',
            text: 'text-amber-700',
            accent: 'bg-amber-500',
            bulletBg: 'bg-amber-500 text-white',
            bulletBorder: 'border-amber-100',
            label: 'QC Inspection'
          },
          'in-progress': {
            bg: 'bg-sky-50/55',
            border: 'border-sky-200',
            text: 'text-sky-700',
            accent: 'bg-sky-500',
            bulletBg: 'bg-sky-500 text-white animate-pulse',
            bulletBorder: 'border-sky-100',
            label: 'In Process (IN)'
          },
          pending: {
            bg: 'bg-slate-50/50',
            border: 'border-slate-100',
            text: 'text-slate-400',
            accent: 'bg-slate-200',
            bulletBg: 'bg-slate-200 text-slate-500',
            bulletBorder: 'border-slate-50',
            label: 'Pending'
          }
        }[status]

        return (
          <div key={pm.id} className="relative flex gap-4 items-start group">
            {/* Timeline connector line */}
            {idx < processes.length - 1 && (
              <div
                className={`absolute left-[15px] top-8 bottom-0 w-[2px] -mb-4 z-0 ${status === 'completed'
                    ? 'bg-emerald-250'
                    : status === 'qc'
                      ? 'bg-amber-250'
                      : status === 'in-progress'
                        ? 'bg-sky-250'
                        : 'bg-slate-200'
                  }`}
              />
            )}

            {/* Bullet indicator */}
            <div className={`relative z-10 w-8 h-8 rounded-full border-4 ${statusColors.bulletBorder} ${statusColors.bulletBg} flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110`}>
              {status === 'completed' ? (
                <Check size={12} strokeWidth={3.5} />
              ) : status === 'qc' ? (
                <span className="text-[8px] font-black uppercase">QC</span>
              ) : status === 'in-progress' ? (
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              ) : (
                <span>{idx + 1}</span>
              )}
            </div>

            {/* Process Card Details */}
            <div className={`flex-1 rounded-xl border p-4 shadow-sm transition-all duration-300 ${statusColors.bg} ${statusColors.border} hover:shadow-md hover:border-slate-350`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Step {String(idx + 1).padStart(2, '0')}</span>
                  <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight mt-0.5">{pm.PM_Process_Name}</h4>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' :
                    status === 'qc' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                      status === 'in-progress' ? 'bg-sky-100 text-sky-800 border border-sky-200/50' :
                        'bg-slate-100 text-slate-500 border border-slate-200/30'
                  }`}>
                  {statusColors.label}
                </span>
              </div>

              {status !== 'pending' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-slate-200/40 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[8px]">Operator</span>
                    <span className="text-slate-700 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-[8px] flex items-center justify-center font-bold text-slate-600 uppercase shrink-0">
                        {(savedLi?.empName || 'A').charAt(0)}
                      </span>
                      <span className="truncate max-w-[90px]">{savedLi?.empName || 'admin'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[8px]">Machine / WC</span>
                    <span className="text-slate-700 font-semibold block mt-0.5 truncate" title={savedLi?.machineName || pm.Machine_Name}>
                      {savedLi?.machineName || pm.Machine_Name || '—'}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[8px]">Process Date</span>
                    <span className="text-slate-550 font-semibold block mt-0.5">
                      {savedLi?.processDate ? formatPDDate(savedLi.processDate) : '—'}
                    </span>
                  </div>
                  {savedLi?.remarks && (
                    <div className="col-span-2 md:col-span-3 mt-1 bg-white/40 p-2 rounded-lg border border-slate-200/10">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block text-[8px]">Remarks</span>
                      <span className="text-slate-650 italic block mt-0.5">{savedLi.remarks}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-slate-400 italic flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Waiting to start. Machine default: {pm.Machine_Name || '—'}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ViewJobStatus() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [processStage, setProcessStage] = useState('All')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const offsetMs = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - offsetMs).toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => {
    const d = new Date()
    const offsetMs = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - offsetMs).toISOString().split('T')[0]
  })
  const [jobs, setJobs] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processMasters, setProcessMasters] = useState([])
  const [expandedRow, setExpandedRow] = useState(null)
  const [itemMasterList, setItemMasterList] = useState([])
  const [zoomImage, setZoomImage] = useState(null)
  const [isUnlockedModal, setIsUnlockedModal] = useState(true)
  const [flowModalJob, setFlowModalJob] = useState(null)
  const [selectedPartIndex, setSelectedPartIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('active')

  const handleCloseRouteCardClick = async () => {
    if (!selectedJob) {
      toast.warning('Please select a Job Card first.')
      return
    }

    const confirmClose = window.confirm(`Are you sure you want to close the Route Card for Job #${selectedJob.jobNo}? This will automatically complete all pending processes.`);
    if (!confirmClose) return;

    try {
      const res = await api.put(`/api/job-card/${selectedJob.jobCardId}/close-route-card`, {}, {
        loadingMessage: 'Closing Route Card...'
      });

      if (res.data?.success) {
        toast.success(`Route Card for Job #${selectedJob.jobNo} has been closed successfully!`);
        setSelectedRow(null);
        await fetchJobs();
      } else {
        toast.error(res.data?.message || 'Failed to close route card.');
      }
    } catch (err) {
      console.error('Error closing route card:', err);
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };





  const fetchJobs = async (procList = processMasters) => {
    try {
      const res = await api.get('/api/job-card')
      const dbJobs = res.data?.data || []

      const groupedJobs = []
      dbJobs.forEach(jc => {
        const partsList = []
        const partMap = {}
        if (jc.lineItems && jc.lineItems.length > 0) {
          jc.lineItems.forEach(li => {
            const key = li.partName || '';
            if (!partMap[key]) {
              partMap[key] = []
            }
            partMap[key].push(li)
          })

          Object.entries(partMap).forEach(([partName, items]) => {
            const firstItem = items[0]
            const activeJobProcesses = jc.processMenus && jc.processMenus.length > 0
              ? jc.processMenus
                  .filter(pm => pm.isActive && pm.partName?.toLowerCase() === partName.toLowerCase())
                  .map(pm => ({
                    id: pm.id,
                    PM_Part_Name: pm.partName,
                    PM_Process_Name: pm.processName,
                    PM_Process_Name1: pm.processName1 || '',
                    PM_Process_Order: pm.processOrder,
                    TeamId: pm.teamId || '',
                    Machine_Code: pm.machineCode || '',
                    Machine_Name: pm.machineName || '',
                    PM_Days: pm.days || '',
                    PM_Hours: pm.hours || '',
                    Minutes: pm.minutes || '',
                    Setting_Time: pm.settingTime || '',
                    Cycle_Time: pm.cycleTime || '',
                    Handling_Time: pm.handlingTime || '',
                    Idle_Time: pm.idleTime || '',
                    CreatedBy: pm.createdBy || 'Admin'
                  }))
              : procList.filter(pm => pm.PM_Part_Name && pm.PM_Part_Name.toLowerCase() === partName.toLowerCase());

            const completedPct = getCompletedPct(partName, items, activeJobProcesses)
            const stage = getPartStage(partName, items, activeJobProcesses)

            partsList.push({
              partNo: firstItem.partNo || '',
              productName: partName,
              completedPct,
              qty: firstItem.planQty || 0,
              stage,
              lineItems: items,
              processMenus: activeJobProcesses
            })
          })
        }

        let totalCompletedPct = 0
        let jobStage = 'Waiting'
        let totalQty = 0
        let partsCSV = ''
        let productNamesCSV = ''

        if (partsList.length > 0) {
          const totalPctSum = partsList.reduce((sum, p) => sum + p.completedPct, 0)
          totalCompletedPct = totalPctSum / partsList.length
          totalQty = partsList.reduce((sum, p) => sum + p.qty, 0)
          partsCSV = partsList.map(p => p.partNo).filter(Boolean).join(', ')
          productNamesCSV = partsList.map(p => p.productName).filter(Boolean).join(', ')

          const stages = partsList.map(p => p.stage)
          if (stages.every(s => s === 'Completed')) {
            jobStage = 'Completed'
          } else if (stages.some(s => s === 'In Process' || s === 'Completed')) {
            jobStage = 'In Process'
          } else if (stages.some(s => s === 'Cancelled')) {
            jobStage = 'Cancelled'
          } else {
            jobStage = 'Waiting'
          }
        }

        groupedJobs.push({
          id: jc.id,
          jobCardId: jc.id,
          jobNo: jc.jobNo || '',
          vehicleType: jc.model || '',
          partNo: partsCSV,
          productName: productNamesCSV,
          completedPct: totalCompletedPct,
          qty: totalQty,
          planDate: jc.currentDate || '',
          requiredDate: jc.requiredDate || '',
          workingStartDate: jc.workingStartDate || '',
          workingEndDate: jc.workingEndDate || '',
          priority: jc.priority || '',
          technicalApprovalDate: jc.approvedDate ? formatPDDate(jc.approvedDate) : '—',
          approvalPerson: jc.approvedBy || '—',
          stage: jobStage,
          status: jc.status || 'Pending',
          partImage: jc.partImage || null,
          partsList
        })
      })
      setJobs(groupedJobs)
    } catch (err) {
      console.error('Error fetching job cards:', err)
      toast.error('Failed to fetch jobs from server.')
    }
  }

  const [employees, setEmployees] = useState([])
  const [machines, setMachines] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [empRes, machRes, procRes, itemsRes] = await Promise.all([
          api.get('/api/employee-master').catch(() => ({ data: { data: [] } })),
          api.get('/api/machine-master').catch(() => ({ data: { data: [] } })),
          api.get('/api/process-master').catch(() => ({ data: { data: [] } })),
          api.get('/api/item-master?limit=10000').catch(() => ({ data: { data: [] } }))
        ])
        setEmployees(empRes.data?.data || [])
        setMachines(machRes.data?.data || [])
        const procList = procRes.data?.data || []
        setProcessMasters(procList)
        setItemMasterList(itemsRes.data?.data || [])
        await fetchJobs(procList)
      } catch (err) {
        console.error('Error loading master data in ViewJobStatus:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = jobs.filter(j => {
    if (activeTab === 'active' && j.status === 'Closed') return false;
    if (activeTab === 'closed' && j.status !== 'Closed') return false;

    const productNameLower = (j.productName || '').toLowerCase()
    const partNoLower = (j.partNo || '').toLowerCase()
    const matchSearch = !search || productNameLower.includes(search.toLowerCase()) || partNoLower.includes(search.toLowerCase()) || String(j.jobNo).includes(search)
    const matchStage = activeTab === 'closed' || processStage === 'All' || (processStage === 'In Process' && j.stage === 'In Process') || (processStage === 'Waiting for Process' && j.stage === 'Waiting') || (processStage === 'Close' && j.stage === 'Completed') || (processStage === 'Cancel' && j.stage === 'Cancelled')
    const matchCompleted = activeTab === 'closed' || !showCompleted || j.completedPct >= 100
    const matchDate = (!fromDate || j.planDate >= fromDate) && (!toDate || j.planDate <= toDate)
    return matchSearch && matchStage && matchCompleted && matchDate
  })

  const selectedJob = jobs.find(j => j.id === selectedRow)

  const getPartImage = () => {
    if (!selectedJob) return null
    const firstPart = selectedJob.partsList && selectedJob.partsList[0]
    const pNo = firstPart ? firstPart.partNo : selectedJob.partNo
    const pName = firstPart ? firstPart.productName : selectedJob.productName
    const item = itemMasterList.find(it => it.partNo === pNo || it.partName === pName)
    if (item) {
      const hasImg = item.hasImage || !!item.imageMimeType
      if (hasImg) {
        return `/api/item-master/${item.id}/download-image`
      } else if (item.imagePath) {
        return item.imagePath.startsWith('http') || item.imagePath.startsWith('/') ? item.imagePath : `/uploads/${item.imagePath}`
      }
    }
    return selectedJob.partImage || null
  }

  const partImage = getPartImage()

  const [showPopup, setShowPopup] = useState(false)
  const [popupForm, setPopupForm] = useState({
    lineItemId: null,
    jobCardId: null,
    partNo: '',
    partName: '',
    processName: '',
    processDate: '',
    state: 'IN',
    empName: 'admin',
    machineName: '',
    workCenterNo: '',
    remarks: '',
    notApplicable: false
  })

  const handleOpenPDProcessModal = (jobRow, processMaster, partDetail) => {
    const partName = partDetail ? partDetail.productName : jobRow.productName
    const partNo = partDetail ? partDetail.partNo : jobRow.partNo
    const lineItems = partDetail ? partDetail.lineItems : jobRow.lineItems || []

    const partProcesses = partDetail && partDetail.processMenus && partDetail.processMenus.length > 0
      ? partDetail.processMenus
      : processMasters
          .filter(pm => pm.PM_Part_Name === partName)
          .sort((a, b) => (Number(a.PM_Process_Order) || 0) - (Number(b.PM_Process_Order) || 0))

    const pIdx = partProcesses.findIndex(pm => pm.id === processMaster.id)

    let isUnlocked = true
    for (let k = 0; k < pIdx; k++) {
      const precedingPm = partProcesses[k]
      const precedingSavedLi = lineItems.find(li => li.processName === precedingPm.PM_Process_Name)
      if (!precedingSavedLi || !(precedingSavedLi.state === 'OUT' || precedingSavedLi.state === 'QC' || precedingSavedLi.notApplicable)) {
        isUnlocked = false
        break
      }
    }

    setIsUnlockedModal(isUnlocked)

    const savedLi = lineItems.find(li => li.processName === processMaster.PM_Process_Name)
    setSelectedRow(jobRow.id)
    setPopupForm({
      lineItemId: savedLi ? savedLi.id : null,
      jobCardId: jobRow.jobCardId,
      partNo: partNo,
      partName: partName,
      processName: processMaster.PM_Process_Name,
      processDate: savedLi?.processDate || (() => {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
      })(),
      state: savedLi?.state === 'IN' ? 'OUT' : (savedLi?.state || 'IN'),
      empName: savedLi?.empName || 'admin',
      machineName: savedLi?.machineName || processMaster.Machine_Name || '',
      workCenterNo: savedLi?.workCenterNo || processMaster.Machine_Code || '',
      remarks: savedLi?.remarks || '',
      notApplicable: savedLi?.notApplicable || false
    })
    setShowPopup(true)
  }

  const handleSavePopup = async () => {
    try {
      const res = await api.put(`/api/job-card/line-item/process`, {
        jobCardId: popupForm.jobCardId,
        partNo: popupForm.partNo,
        partName: popupForm.partName,
        processName: popupForm.processName,
        processDate: popupForm.processDate,
        state: popupForm.state,
        empName: popupForm.empName,
        machineName: popupForm.machineName,
        workCenterNo: popupForm.workCenterNo,
        remarks: popupForm.remarks,
        notApplicable: popupForm.notApplicable
      })

      if (res.data?.success) {
        toast.success('Production Details Saved Successfully!')
        setShowPopup(false)
        await fetchJobs()
      } else {
        toast.error(res.data?.message || 'Failed to save production details.')
      }
    } catch (err) {
      console.error('Error saving production details in popup:', err)
      toast.error('Error saving production details: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleSearch = () => toast.info(`Showing ${filtered.length} results.`)
  const handleExcel = () => {
    if (filtered.length === 0) {
      toast.warning('No records available to export.')
      return
    }

    const data = filtered.map((j) => ({
      'Job No': j.jobNo,
      'Vehicle Type': j.vehicleType,
      'Part No': j.partNo,
      'Product Name': j.productName,
      'Completed %': `${j.completedPct.toFixed(2)}%`,
      'Stage': j.stage,
      'Priority': j.priority || '-',
      'Qty': j.qty,
      'Plan Date': j.planDate,
      'Required Date': j.requiredDate,
      'Tech. Approval Date': j.technicalApprovalDate || '-',
      'Approval ID': j.approvalPerson || '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'JobStatus')

    XLSX.writeFile(workbook, `job_status_records_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Successfully downloaded Job Status Excel spreadsheet!')
  }

  const stageColor = (s) => {
    if (s === 'Completed') return 'bg-emerald-100 text-emerald-700'
    if (s === 'In Process') return 'bg-sky-100 text-sky-700'
    if (s === 'Waiting') return 'bg-amber-100 text-amber-700'
    if (s === 'Cancelled') return 'bg-red-100 text-red-600'
    return 'bg-slate-100 text-slate-500'
  }

  const priColor = (p) => {
    if (p === 'P0') return 'text-red-600 font-black'
    if (p === 'P1') return 'text-orange-600 font-bold'
    if (p === 'P2') return 'text-amber-600 font-bold'
    return 'text-slate-500'
  }

  const pctColor = (v) => {
    if (v >= 100) return 'text-emerald-600 font-black'
    if (v >= 50) return 'text-sky-600 font-bold'
    if (v > 0) return 'text-amber-600 font-bold'
    return 'text-slate-400'
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        {/* <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>Technical</span><ChevronRight size={12} /><span className="text-[#0097A7]">View Job Status</span>
        </div>

        {/* Premium Tab System */}
        {/* <div className="flex items-center gap-1.5 mb-5 bg-slate-200/50 p-1 rounded-xl w-fit border border-slate-200/40">
          <button
            onClick={() => {
              setActiveTab('active');
              setSelectedRow(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'active'
                ? 'bg-white text-[#0097A7] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={13} className={activeTab === 'active' ? 'text-[#0097A7]' : 'text-slate-450'} />
            Active Jobs
          </button>
          <button
            onClick={() => {
              setActiveTab('closed');
              setSelectedRow(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'closed'
                ? 'bg-white text-red-650 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive size={13} className={activeTab === 'closed' ? 'text-red-650' : 'text-slate-450'} />
            Closed Route Cards
          </button>
        </div>  */}
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-slate-400 uppercase font-bold tracking-tight">
            <span>Technical</span>
            <ChevronRight size={12} />
            <span className="text-[#0097A7]">View Job Status</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/50 p-1 rounded-xl border border-slate-200/40">
            <button
              onClick={() => {
                setActiveTab('active')
                setSelectedRow(null)
              }}
              className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'active'
                  ? 'bg-white text-[#0097A7] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Activity size={13} />
              Active Jobs
            </button>

            <button
              onClick={() => {
                setActiveTab('closed')
                setSelectedRow(null)
              }}
              className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'closed'
                  ? 'bg-white text-red-650 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Archive size={13} />
              Closed Route Cards
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Job List</h2>
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200 ml-1">{filtered.length} records</span>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'active' && (
                <button
                  onClick={handleCloseRouteCardClick}
                  disabled={!selectedJob || selectedJob.stage === 'Cancelled' || selectedJob.stage === 'Completed'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 text-white text-[11px] font-bold rounded-lg border border-red-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Archive size={13} /> Closed Route Card
                </button>
              )}
              <button
                onClick={() => {
                  if (!selectedJob) {
                    toast.warning('Please select a Job Card first.')
                    return
                  }
                  printJobProcessDetails(selectedJob, processMasters)
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#0097A7]/5 text-[#0097A7] text-[11px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm"
              >
                <Eye size={13} /> Job Process Details
              </button>
              <button onClick={handleExcel} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button className="text-slate-400 hover:text-red-600 transition-colors ml-1"><X size={20} strokeWidth={2.5} /></button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* ── Toolbar Layout: Inputs stacked on left, large image preview on right ── */}
            <div className="flex justify-between items-start gap-6 flex-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {/* Left Column: Search & Filter Stack */}
              <div className="space-y-4 flex-1 min-w-[300px]">
                {/* Row 1: Search & Process Stage */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Search :</span>
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Job No / Part No / Product Name..." className="w-56" />
                  </div>
                  {activeTab === 'active' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Process Stage :</span>
                      <Select options={STAGES} value={processStage} onChange={e => setProcessStage(e.target.value)} className="w-44" />
                    </div>
                  )}
                </div>

                {/* Row 2: Date Range & Buttons */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">From Date :</span>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">To Date :</span>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleSearch} className="flex items-center gap-1.5 px-4 py-[6px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                      <Search size={13} /> Search
                    </button>
                    {activeTab === 'active' && (
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={`flex items-center gap-1.5 px-4 py-[6px] text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95 border ${showCompleted ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <CheckCircle2 size={13} /> Completed Job
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Part Image Preview */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-80 h-56 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shadow-md">
                  {partImage ? (
                    <img
                      src={partImage}
                      alt="Part"
                      onClick={() => setZoomImage(partImage)}
                      className="w-full h-full object-contain p-1 cursor-zoom-in hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-300">
                      <ImageIcon size={44} strokeWidth={1.2} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No Image</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Part Image</span>
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                  <thead className="bg-[#d32f2f] text-[10px] uppercase text-white font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2.5 border-r border-red-400 w-8 text-center bg-[#d32f2f]"></th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-16">Job No</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-28">Vehicle Type</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-28">Part No</th>
                      <th className="px-3 py-2.5 border-r border-red-400">Product Name</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-24 text-center">Completed %</th>
                      <th className="px-3 py-2.5 w-24 text-center">Stage</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-16 text-center font-bold">Flow</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-16 text-center">Priority</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-12 text-center">Qty</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-24 text-center">Plan Date</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-24 text-center">Required Date</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-28 text-center">Working Start Date</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-28 text-center">Working End Date</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-28 text-center">Tech. Approval Date</th>
                      <th className="px-3 py-2.5 border-r border-red-400 w-24">Approved By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={16} className="py-20 text-center text-slate-400">
                          <p className="text-[12px] font-bold uppercase tracking-widest animate-pulse">Loading jobs...</p>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="py-20 text-center text-slate-300">
                          <Search size={40} strokeWidth={1} className="mx-auto mb-2 opacity-30" />
                          <p className="text-[12px] font-bold uppercase tracking-widest">No jobs found</p>
                          <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search or filters</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((j, i) => {
                        const isExpanded = expandedRow === j.id
                        return (
                          <Fragment key={j.id}>
                            <tr
                              onClick={() => setSelectedRow(j.id)}
                              className={`h-8 transition-colors cursor-pointer text-[12px] ${selectedRow === j.id ? 'bg-[#1565C0] text-white' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'}`}
                            >
                              <td
                                className="px-2 py-1 border-r border-slate-100 text-center"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedRow(isExpanded ? null : j.id)
                                }}
                              >
                                <button className="p-0.5 rounded hover:bg-slate-200/20 text-slate-400 hover:text-white transition-all flex items-center justify-center mx-auto">
                                  {isExpanded ? (
                                    <ChevronDown size={14} className={selectedRow === j.id ? "text-white" : "text-[#0097A7]"} />
                                  ) : (
                                    <ChevronRight size={14} className={selectedRow === j.id ? "text-white" : "text-slate-400"} />
                                  )}
                                </button>
                              </td>
                              <td className={`px-3 py-1 border-r border-slate-100 font-bold ${selectedRow === j.id ? '' : 'text-slate-700'}`}>{j.jobNo}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 font-semibold ${selectedRow === j.id ? '' : 'text-slate-600'}`}>{j.vehicleType}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 font-mono text-[11px] ${selectedRow === j.id ? '' : 'text-[#0097A7]'}`}>{j.partNo}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 font-bold truncate max-w-[250px] ${selectedRow === j.id ? '' : 'text-slate-700'}`}>
                                {j.productName || '—'}
                              </td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center ${selectedRow === j.id ? '' : pctColor(j.completedPct)}`}>{j.completedPct.toFixed(2)}</td>
                              <td className="px-3 py-1 text-center font-bold">
                                {j.status === 'Closed' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap bg-rose-100 text-rose-800 border border-rose-200">Closed Route Card</span>
                                ) : selectedRow === j.id ? (
                                  <span className="text-[10px] font-bold uppercase whitespace-nowrap">{j.stage}</span>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${stageColor(j.stage)}`}>{j.stage}</span>
                                )}
                              </td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedPartIndex(0)
                                    setFlowModalJob(j)
                                  }}
                                  className={`p-1 rounded-md transition-all inline-flex items-center justify-center hover:scale-110 active:scale-95 ${selectedRow === j.id
                                      ? 'text-white bg-white/20 hover:bg-white/30'
                                      : 'text-[#0097A7] bg-slate-100 hover:bg-[#0097A7]/10'
                                    }`}
                                  title="View Detailed Process Flow Chart & Analytics"
                                >
                                  <PieChartIcon size={14} />
                                </button>
                              </td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center ${selectedRow === j.id ? 'font-bold' : priColor(j.priority)}`}>{j.priority || '-'}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${selectedRow === j.id ? '' : 'text-slate-600'}`}>{j.qty}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center ${selectedRow === j.id ? '' : 'text-slate-505'}`}>{j.planDate}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center ${selectedRow === j.id ? '' : 'text-slate-505'}`}>{j.requiredDate}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center ${selectedRow === j.id ? '' : 'text-slate-600 font-semibold'}`}>{j.workingStartDate || '—'}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center ${selectedRow === j.id ? '' : 'text-slate-600 font-semibold'}`}>{j.workingEndDate || '—'}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 text-center ${selectedRow === j.id ? '' : 'text-slate-400 text-[11px]'}`}>{j.technicalApprovalDate}</td>
                              <td className={`px-3 py-1 border-r border-slate-100 ${selectedRow === j.id ? '' : 'text-slate-600 font-semibold'}`}>{j.approvalPerson}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={16} className="px-6 py-4">
                                  <div className="space-y-6">
                                    {(j.partsList || []).map((partDetail, pdIdx) => (
                                      <div key={pdIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-hidden max-w-full animate-in fade-in slide-in-from-top-2 duration-200">
                                        <h4 className="text-[11px] font-black text-[#0097A7] uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                                          <span>Processes for: {partDetail.productName} ({partDetail.partNo})</span>
                                          <span className="bg-[#0097A7]/10 text-[#0097A7] px-2 py-0.5 rounded text-[10px] font-bold">Qty: {partDetail.qty}</span>
                                        </h4>
                                        <div className="overflow-x-auto scrollbar-thin">
                                          <table className="min-w-full text-[12px] border-collapse text-left">
                                            <thead>
                                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                                                <th className="px-3 py-2 border-r border-slate-200 text-center w-12 bg-slate-50">S.No</th>
                                                <th className="px-3 py-2 border-r border-slate-200 bg-slate-50">Process Name</th>
                                                <th className="px-3 py-2 border-r border-slate-200 text-center w-20 bg-slate-50">State</th>
                                                <th className="px-3 py-2 border-r border-slate-200 bg-slate-50">Employee Name</th>
                                                <th className="px-3 py-2 border-r border-slate-200 bg-slate-50">Machine Name</th>
                                                <th className="px-3 py-2 border-r border-slate-200 text-center bg-slate-50">Process Date</th>
                                                <th className="px-3 py-2 bg-slate-50">Remarks</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                                              {(() => {
                                                const partProcesses = partDetail.processMenus && partDetail.processMenus.length > 0
                                                  ? partDetail.processMenus
                                                  : processMasters
                                                      .filter(pm => pm.PM_Part_Name === partDetail.productName)
                                                      .sort((a, b) => (Number(a.PM_Process_Order) || 0) - (Number(b.PM_Process_Order) || 0))

                                                return partProcesses.map((pm, pIdx) => {
                                                  const savedLi = partDetail.lineItems.find(li => li.processName === pm.PM_Process_Name)
                                                  return (
                                                    <tr key={pm.id} className="hover:bg-[#0097A7]/5 transition-colors">
                                                      <td className="px-3 py-2 text-center border-r border-slate-100 text-slate-400 font-medium">
                                                        {pIdx + 1}
                                                      </td>
                                                      <td className="px-3 py-2 border-r border-slate-100 font-bold">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenPDProcessModal(j, pm, partDetail)
                                                          }}
                                                          className="text-[#0097A7] hover:text-[#007a87] hover:underline font-bold text-left flex items-center gap-1.5"
                                                        >
                                                          {pm.PM_Process_Name}
                                                        </button>
                                                      </td>
                                                      <td className="px-3 py-2 text-center border-r border-slate-100 text-[11px]">
                                                        {savedLi?.notApplicable ? (
                                                          <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">N/A</span>
                                                        ) : savedLi?.state ? (
                                                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${savedLi.state === 'IN' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                            savedLi.state === 'OUT' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                                              savedLi.state === 'QC' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                                'bg-rose-50 text-rose-600 border border-rose-200'
                                                            }`}>{savedLi.state}</span>
                                                        ) : (
                                                          <span className="text-slate-300">—</span>
                                                        )}
                                                      </td>
                                                      <td className="px-3 py-2 border-r border-slate-100 text-slate-600 font-semibold">
                                                        {savedLi?.empName || '—'}
                                                      </td>
                                                      <td className="px-3 py-2 border-r border-slate-100 text-slate-600">
                                                        {savedLi?.machineName || pm.Machine_Name || '—'}
                                                      </td>
                                                      <td className="px-3 py-2 border-r border-slate-100 text-center text-slate-500 font-medium">
                                                        {savedLi?.processDate ? formatPDDate(savedLi.processDate) : '—'}
                                                      </td>
                                                      <td className="px-3 py-2 text-slate-500 truncate max-w-[200px]" title={savedLi?.remarks || ''}>
                                                        {savedLi?.remarks || '—'}
                                                      </td>
                                                    </tr>
                                                  )
                                                })
                                              })()}
                                              {processMasters.filter(pm => pm.PM_Part_Name === partDetail.productName).length === 0 && (
                                                <tr>
                                                  <td colSpan={7} className="text-center py-6 text-slate-400 italic">
                                                    No processes defined in Process Master for this part.
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                    {(!j.partsList || j.partsList.length === 0) && (
                                      <div className="text-center py-6 text-slate-400 italic">
                                        No line items/parts in this job card.
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {filtered.length} records {activeTab === 'active' ? `· Stage: ${processStage}` : '· Closed Route Cards'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0097A7] rounded-sm" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Production Details - {popupForm.processName} ({popupForm.partName})
                </h3>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="flex items-center gap-1.5 px-3 py-1 hover:text-red-500 text-[11px] font-bold rounded-lg transition-all shadow-sm"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4">
              {/* Feature 2 lock warning message */}
              {!isUnlockedModal && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-lg text-[12px] font-bold flex items-center gap-2 animate-pulse">
                  <Lock size={15} className="text-rose-500 shrink-0" />
                  <span>The previous process is not completed yet.</span>
                </div>
              )}

              {/* Process Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Process Date :</label>
                <input
                  type="datetime-local"
                  value={popupForm.processDate}
                  onChange={e => setPopupForm(prev => ({ ...prev, processDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all"
                />
              </div>

              {/* State Radios */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">State :</label>
                <div className="flex items-center gap-4">
                  {['IN', 'OUT', 'QC'].map(st => (
                    <label key={st} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="state"
                        value={st}
                        checked={popupForm.state === st}
                        onChange={e => setPopupForm(prev => ({ ...prev, state: e.target.value }))}
                        disabled={!isUnlockedModal}
                        className="w-4 h-4 text-[#0097A7] focus:ring-[#0097A7] disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <span className={`text-sm font-bold uppercase ${popupForm.state === st ? 'text-[#0097A7]' : 'text-slate-500 group-hover:text-slate-700'} ${!isUnlockedModal ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        {st}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Employee Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Employee Name :</label>
                <input
                  type="text"
                  value={popupForm.empName}
                  onChange={e => setPopupForm(prev => ({ ...prev, empName: e.target.value }))}
                  placeholder="Enter employee name..."
                  list="popup-employees-list"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all"
                />
                <datalist id="popup-employees-list">
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.empName}>{emp.empName} ({emp.empCode})</option>
                  ))}
                </datalist>
              </div>

              {/* Machine Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Machine Name :</label>
                <div className="relative">
                  <select
                    value={popupForm.machineName}
                    onChange={e => {
                      const val = e.target.value
                      const m = machines.find(mac => mac.machineName === val)
                      setPopupForm(prev => ({
                        ...prev,
                        machineName: val,
                        workCenterNo: m ? m.machineCode : prev.workCenterNo
                      }))
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all cursor-pointer font-medium"
                  >
                    <option value="">-- Select Machine --</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.machineName}>
                        {m.machineName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Work Center No */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Work Center.No :</label>
                <input
                  type="text"
                  value={popupForm.workCenterNo}
                  onChange={e => setPopupForm(prev => ({ ...prev, workCenterNo: e.target.value }))}
                  placeholder="Enter work center number..."
                  list="popup-workcenters-list"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all"
                />
                <datalist id="popup-workcenters-list">
                  {machines.map(m => (
                    <option key={m.id} value={m.machineCode}>{m.machineCode} - {m.machineName}</option>
                  ))}
                </datalist>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Remarks :</label>
                <textarea
                  rows={3}
                  value={popupForm.remarks}
                  onChange={e => setPopupForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter remarks..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all resize-none"
                />
              </div>

              {/* Not Applicable */}
              {/* <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popupForm.notApplicable}
                    onChange={e => setPopupForm(prev => ({ ...prev, notApplicable: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#0097A7] focus:ring-[#0097A7] border-slate-300"
                  />
                  <span className="text-xs font-semibold uppercase text-slate-600 tracking-wider">Not Applicable</span>
                </label>
              </div> */}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleSavePopup}
                className="px-5 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Save size={14} /> Save
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={zoomImage}
              alt="Zoomed"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Detailed Process Flow Modal */}
      {flowModalJob && (() => {
        const partsList = flowModalJob.partsList || []
        const partDetail = partsList[selectedPartIndex]

        // Calculate process status breakdown counts for this part
        const partProcesses = partDetail
          ? (partDetail.processMenus && partDetail.processMenus.length > 0
            ? partDetail.processMenus
            : processMasters
                .filter(pm => pm.PM_Part_Name === partDetail.productName)
                .sort((a, b) => (Number(a.PM_Process_Order) || 0) - (Number(b.PM_Process_Order) || 0))
            )
          : []


        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-250">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0097A7]/10 text-[#0097A7] flex items-center justify-center">
                    <PieChartIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                      Process Flow & Analytics
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                      Job Card No: {flowModalJob.jobNo} · Vehicle Type: {flowModalJob.vehicleType || '—'} · Priority: {flowModalJob.priority || '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFlowModalJob(null)}
                  className="p-1.5 hover:bg-slate-200/50 text-slate-400 hover:text-slate-650 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {/* Parts Tabs if multiple */}
                {partsList.length > 1 && (
                  <div className="flex border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap scrollbar-thin pb-1">
                    {partsList.map((part, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => setSelectedPartIndex(pIdx)}
                        className={`px-4 py-2.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${selectedPartIndex === pIdx
                            ? 'border-[#0097A7] text-[#0097A7] bg-[#0097A7]/5'
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {part.productName} ({part.partNo})
                      </button>
                    ))}
                  </div>
                )}

                {partDetail ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start h-full">
                    {/* Left Column: Donut & Statistics */}
                    <div className="md:col-span-1 bg-slate-50/50 rounded-2xl p-6 border border-slate-200/50 flex flex-col items-center justify-center">
                      <h4 className="text-[11px] font-black text-[#0097A7] uppercase tracking-widest mb-4">Process Distribution</h4>

                      <div className="w-full flex justify-center items-center">
                        <PartProcessDonut partDetail={partDetail} processMasters={processMasters} />
                      </div>

                      {/* Overall Progress Stat */}
                      <div className="w-full mt-6 pt-5 border-t border-slate-200/55 flex justify-between items-center text-[12px] font-bold">
                        <span className="text-slate-450 uppercase tracking-wider">Overall Progress</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-white font-mono bg-[#0097A7]`}>
                          {partDetail.completedPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Right Columns: Process Timeline Flow */}
                    <div className="md:col-span-2 space-y-4 h-full">
                      <h4 className="text-[11px] font-black text-slate-550 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-[#0097A7]" /> Sequential Process Flow Timeline
                      </h4>
                      <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm overflow-hidden h-full">
                        <ProcessTimeline processes={partProcesses} lineItems={partDetail.lineItems} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Search size={40} className="opacity-30 mb-2" />
                    <p className="text-[12px] font-bold uppercase tracking-widest">No Parts in Job Card</p>
                    <p className="text-[11px] text-slate-500 mt-1">This job card does not contain any part details.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setFlowModalJob(null)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
