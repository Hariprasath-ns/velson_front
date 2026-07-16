import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  ChevronRight, X, FileBarChart, FileSpreadsheet, FileText,
  Filter, Settings, Download, Loader2, Pencil, Trash2, Printer, AlertTriangle,
  CheckCircle, XCircle, Eye
} from 'lucide-react'
import { useToast } from '../components/Toast'
import { SpinnerLoader } from '../components/LocalLoader'

const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
  />
)

const StatusBadge = ({ status }) => {
  const map = {
    Draft:    'bg-slate-100 text-slate-600',
    Sent:     'bg-blue-100 text-blue-700',
    Accepted: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status ?? '—'}
    </span>
  )
}

const fmt = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtAmt = (v) => {
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtAmtWhole = (v) => {
  const n = Math.round(parseFloat(v))
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-IN')
}

/* ── helpers for Format 1 PDF ── */
const numToWords = (n) => {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven',
    'Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  if (n === 0) return 'Zero'
  if (n < 20) return ones[n]
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '')
  if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+numToWords(n%100):'')
  if (n < 100000) return numToWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+numToWords(n%1000):'')
  if (n < 10000000) return numToWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+numToWords(n%100000):'')
  return numToWords(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+numToWords(n%10000000):'')
}
const toWords = (amount) => {
  const n = Math.round(parseFloat(amount) || 0)
  return 'INR ' + numToWords(n).toUpperCase() + ' Only'
}
const fmtDMY = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`
}
const inr = (v) => {
  const n = parseFloat(v) || 0
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const openFormat1Window = async (row) => {
  /* ── fetch customer ── */
  let cust = {}
  try {
    const res = await api.get('/api/customer-master', { skipGlobalLoader: true })
    cust = (res.data?.data ?? []).find(c => c.id === row.customerId) ?? {}
  } catch { cust = { customerName: row.customer?.customerName ?? '' } }

  /* ── tax split ── */
  const taxAmt = parseFloat(row.taxAmount) || 0
  const isIGST = !(row.taxType ?? '').toUpperCase().includes('CGST')
  const igst = isIGST ? taxAmt : 0
  const cgst = isIGST ? 0 : taxAmt / 2
  const sgst = isIGST ? 0 : taxAmt / 2

  /* ── address ── */
  const addrLines = [cust.address, cust.address2, cust.address3, cust.address4]
    .filter(Boolean).join(',\n')
  const cityLine  = [cust.city, cust.state, cust.pinCode].filter(Boolean).join(' - ')
  const fullAddr  = [addrLines, cityLine].filter(Boolean).join(',\n')

  /* ── page-split logic ── */
  const FIRST_MAX = 10
  const REST_MAX  = 15
  const allItems  = row.details ?? []
  const pages = []
  if (allItems.length <= FIRST_MAX) {
    pages.push({ items: allItems, isFirst: true, isLast: true, max: FIRST_MAX })
  } else {
    pages.push({ items: allItems.slice(0, FIRST_MAX), isFirst: true, isLast: false, max: FIRST_MAX })
    let i = FIRST_MAX
    while (i < allItems.length) {
      const chunk = allItems.slice(i, i + REST_MAX)
      i += REST_MAX
      pages.push({ items: chunk, isFirst: false, isLast: i >= allItems.length, max: REST_MAX })
    }
  }
  const totalPages = pages.length

  /* ── terms text ── */
  const defaultTerms = [
    '1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.',
    '2. Payment : 100% advance along with PO, before delivery.',
    '3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.',
    '4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.'
  ]
  const termsLines = row.paymentTerms
    ? row.paymentTerms.split('\n').map(l => l.replace(/&/g,'&amp;').replace(/</g,'&lt;'))
    : defaultTerms

  /* ── sub-builders ── */
  const buildItemRows = (items, startIdx, maxCount) => {
    const dataRows = items.map((d, i) => `<tr>
      <td class="c">${startIdx + i + 1}</td>
      <td>${[d.itemName, d.partNo].filter(Boolean).join('  ')}</td>
      <td class="c">${parseFloat(d.taxPercent ?? row.taxPercent ?? 18).toFixed(2)}</td>
      <td class="c">${d.hsnCode ?? ''}</td>
      <td class="c">${parseFloat(d.qty || 0).toFixed(2)}</td>
      <td class="c">${d.uom ?? ''}</td>
      <td class="r">${inr(d.unitPrice)}</td>
      <td class="r">${inr(d.amount)}</td>
    </tr>`).join('')
    const blanks = Array(maxCount - items.length).fill(
      `<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
    ).join('')
    return dataRows + blanks
  }

  const buildTerms = () => `
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${termsLines.map(l => `<div class="t-line">${l}</div>`).join('')}
    </div>`

  const buildFooter = (pageNum) => `
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${pageNum} of ${totalPages}${pageNum < totalPages ? '&nbsp;&nbsp;&nbsp;Continue(-.)' : ''}</span>
      </div>
    </div>`

  /* ── build all pages ── */
  const logoUrl = `${window.location.origin}/velson-logo.png`
  let globalIdx = 0
  const pagesHtml = pages.map((pg, pi) => {
    const startIdx = globalIdx
    globalIdx += pg.items.length

    const headerHtml = pg.isFirst ? `
      <div class="doc-hdr">
        <img src="${logoUrl}" alt="" onerror="this.style.display='none'"/>
        <span class="co-name">VELSON</span>
      </div>
      <div class="doc-title">QUOTATION</div>
      <table class="buyer-tbl"><tbody><tr>
        <td class="buyer-left">
          <div class="b-label">BUYER :</div>
          <div class="b-name">${cust.customerName ?? ''}</div>
          <div class="b-addr">${fullAddr.replace(/\n/g,'<br>')}</div>
          <div class="b-row" style="margin-top:5px">Mail ID : ${cust.email ?? ''}</div>
          <div class="b-row">Contact Person : ${cust.contactPerson ?? ''}</div>
          <div class="b-row">PH : ${cust.mobile ?? cust.phone ?? ''}</div>
        </td>
        <td class="date-col">
          <div class="d-row"><span class="d-lbl">Date :</span><span>${fmtDMY(row.quotationDate)}</span></div>
          <div class="d-row"><span class="d-lbl">Q No :</span><span>${row.quotationNo}</span></div>
          <div class="d-row"><span class="d-lbl">Revision No :</span><span>${row.revisionNo ?? 0}</span></div>
          <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${cust.gstNo ?? ''}</span></div>
        </td>
      </tr></tbody></table>` : ''

    const bankHtml = pg.isLast ? `
      <table class="bank-tbl"><tbody><tr>
        <td class="bank-left">
          <div class="bk-title">BANK DETAILS</div>
          <div class="bk-row"><span class="bk-lbl">BANK NAME</span><span>: CITY UNION BANK LTD</span></div>
          <div class="bk-row"><span class="bk-lbl">BRANCH</span><span>: TIRUCHENGODE</span></div>
          <div class="bk-row"><span class="bk-lbl">ACCOUNT NAME</span><span>: VELSON</span></div>
          <div class="bk-row"><span class="bk-lbl">ACCOUNT NO</span><span>: 512020010031090</span></div>
          <div class="bk-row"><span class="bk-lbl">IFSC CODE</span><span>: CIUB0000143</span></div>
        </td>
        <td class="totals-right">
          <div class="t-row"><span class="t-lbl">VALUE :</span><span class="t-val">${inr(row.subTotal)}</span></div>
          <div class="t-row"><span class="t-lbl">CGST Amount :</span><span class="t-val">${inr(cgst)}</span></div>
          <div class="t-row"><span class="t-lbl">SGST Amount :</span><span class="t-val">${inr(sgst)}</span></div>
          <div class="t-row"><span class="t-lbl">IGST Amount :</span><span class="t-val">${inr(igst)}</span></div>
          <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${inr(row.freightAmount)}</span></div>
          <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${inr(row.packingForwarding)}</span></div>
          <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${inr(row.totalAmount)}</span></div>
        </td>
      </tr></tbody></table>
      <div class="words">
        <div class="w-title">Amount chargeable in words</div>
        <div class="w-val">(${toWords(row.totalAmount)})</div>
      </div>` : ''

    return `<div class="page${pi > 0 ? ' brk' : ''}">
      ${headerHtml}
      <table class="items-tbl">
        <thead><tr>
          <th style="width:28px">S.No.</th>
          <th>DESCRIPTION OF GOODS</th>
          <th style="width:48px">GST %</th>
          <th style="width:68px">HSN Code</th>
          <th style="width:44px">QTY</th>
          <th style="width:38px">UNIT</th>
          <th style="width:76px">RATE IN INR</th>
          <th style="width:76px">VALUE IN INR</th>
        </tr></thead>
        <tbody>${buildItemRows(pg.items, startIdx, pg.max)}</tbody>
      </table>
      ${bankHtml}
      ${buildTerms()}
      ${buildFooter(pi + 1)}
    </div>`
  }).join('\n')

  /* ── write window via Blob URL ── */
  const html = `<!DOCTYPE html><html><head>
<title>Quotation ${row.quotationNo}</title>
<meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#d0d0d0}
@page{size:A4 portrait;margin:10mm}
@media print{body{background:#fff}.noprint{display:none!important}.brk{page-break-before:always}}

/* ── page wrapper ── */
.page{width:190mm;background:#fff;margin:6mm auto;padding:6mm;display:flex;flex-direction:column;gap:0}
.brk{margin-top:0}

/* ── doc header ── */
.doc-hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #000;margin-bottom:4px}
.doc-hdr img{height:52px;object-fit:contain}
.co-name{font-size:26px;font-weight:bold;color:#1a9bc0;letter-spacing:2px}

/* ── QUOTATION title ── */
.doc-title{text-align:center;border:1px solid #000;padding:3px 0;font-size:13px;font-weight:bold;letter-spacing:4px}

/* ── buyer / date table ── */
.buyer-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.buyer-tbl td{vertical-align:top;padding:5px 6px;border:1px solid #000;font-size:10.5px}
.buyer-left{width:56%}
.date-col{width:44%}
.b-label{font-weight:bold;text-decoration:underline;margin-bottom:3px}
.b-name{font-weight:bold;margin-bottom:2px}
.b-addr{margin-bottom:2px;line-height:1.4}
.b-row{line-height:1.5}
.d-row{display:flex;gap:6px;margin-bottom:5px;line-height:1.4}
.d-lbl{font-weight:bold;min-width:82px}

/* ── items table ── */
.items-tbl{width:100%;border-collapse:collapse;border-top:none}
.items-tbl th{border:1px solid #000;padding:4px 2px;font-size:10px;text-align:center;font-weight:bold;background:#fff}
.items-tbl td{border:1px solid #000;padding:3px 3px;font-size:10px;vertical-align:middle;min-height:22px;height:22px}
.items-tbl td.c{text-align:center}
.items-tbl td.r{text-align:right}
.items-tbl tr.blank td{height:22px;padding:0}

/* ── bank + totals ── */
.bank-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.bank-tbl td{vertical-align:top;padding:5px 6px;border:1px solid #000;font-size:10.5px}
.bank-left{width:40%}
.totals-right{width:60%}
.bk-title{font-weight:bold;margin-bottom:5px}
.bk-row{display:flex;margin-bottom:2px}
.bk-lbl{min-width:100px;font-weight:normal}
.t-row{display:flex;justify-content:flex-end;align-items:baseline;margin-bottom:2px}
.t-lbl{text-align:right;padding-right:8px;min-width:190px}
.t-val{min-width:85px;text-align:right;font-weight:bold;border-bottom:1px solid #aaa}
.t-row.grand .t-lbl,.t-row.grand .t-val{font-weight:bold;font-size:11.5px;border-bottom:2px solid #000}

/* ── amount in words ── */
.words{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10.5px}
.w-title{font-weight:bold;margin-bottom:1px}
.w-val{font-style:italic}

/* ── terms ── */
.terms{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10px}
.t-title{font-weight:bold;text-decoration:underline;margin-bottom:2px}
.t-line{margin-bottom:1px;line-height:1.4}

/* ── page footer ── */
.pgfoot{border-top:1px solid #555;padding-top:3px;margin-top:3px;font-size:9px;color:#222}
.pf-line{margin-bottom:1px}
.pf-last{display:flex;justify-content:space-between;margin-top:1px}
</style></head><body>
${pagesHtml}
<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank', 'width=900,height=850')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/* ── Format 3 PDF ── */
const openFormat3Window = async (row) => {
  let cust = {}
  try {
    const res = await api.get('/api/customer-master', { skipGlobalLoader: true })
    cust = (res.data?.data ?? []).find(c => c.id === row.customerId) ?? {}
  } catch { cust = { customerName: row.customer?.customerName ?? '' } }

  const taxAmt    = parseFloat(row.taxAmount)       || 0
  const taxPct    = parseFloat(row.taxPercent)      || 18
  const subT      = parseFloat(row.subTotal)        || 0
  const freight   = parseFloat(row.freightAmount)   || 0
  const pf        = parseFloat(row.packingForwarding) || 0
  const taxableV  = subT + freight + pf
  const isIGST    = !(row.taxType ?? '').toUpperCase().includes('CGST')
  const igst      = isIGST ? taxAmt : 0
  const cgst      = isIGST ? 0 : taxAmt / 2
  const sgst      = isIGST ? 0 : taxAmt / 2
  const cgstPct   = isIGST ? 0 : taxPct / 2
  const sgstPct   = isIGST ? 0 : taxPct / 2
  const igstPct   = isIGST ? taxPct : 0

  const addrLines = [cust.address, cust.address2, cust.address3, cust.address4]
    .filter(Boolean).join(',\n')
  const cityLine  = [cust.city, cust.state, cust.pinCode].filter(Boolean).join(' - ')
  const fullAddr  = [addrLines, cityLine].filter(Boolean).join(',\n')

  const allItems    = row.details ?? []
  const BANK_BLANKS = 15
  const totalPages  = 2

  const defaultTerms = [
    '1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.',
    '2. Payment : 100% advance along with PO, before delivery.',
    '3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.',
    '4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.'
  ]
  const termsLines = row.paymentTerms
    ? row.paymentTerms.split('\n').map(l => l.replace(/&/g,'&amp;').replace(/</g,'&lt;'))
    : defaultTerms

  const buildTerms = () => `
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${termsLines.map(l => `<div class="t-line">${l}</div>`).join('')}
    </div>`

  const buildFooter = (pageNum) => `
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${pageNum} of ${totalPages}${pageNum < totalPages ? '&nbsp;&nbsp;&nbsp;Continue(-.)' : ''}</span>
      </div>
    </div>`

  const logoUrl = `${window.location.origin}/velson-logo.png`

  const itemsTableHead = `<thead><tr>
    <th style="width:28px">S.No.</th>
    <th>DESCRIPTION OF GOODS</th>
    <th style="width:46px">TAX %</th>
    <th style="width:68px">HSN Code</th>
    <th style="width:44px">QTY</th>
    <th style="width:38px">UNIT</th>
    <th style="width:76px">RATE IN INR</th>
    <th style="width:76px">VALUE IN INR</th>
  </tr></thead>`

  const allItemRowsHtml = allItems.map((d, i) => `<tr>
    <td class="c">${i + 1}</td>
    <td>${[d.itemName, d.partNo].filter(Boolean).join('  ')}</td>
    <td class="c">${parseFloat(d.taxPercent ?? row.taxPercent ?? 18).toFixed(2)}</td>
    <td class="c">${d.hsnCode ?? ''}</td>
    <td class="c">${parseFloat(d.qty || 0).toFixed(2)}</td>
    <td class="c">${d.uom ?? ''}</td>
    <td class="r">${inr(d.unitPrice)}</td>
    <td class="r">${inr(d.amount)}</td>
  </tr>`).join('')

  const blankRowsHtml = Array(BANK_BLANKS).fill(
    `<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
  ).join('')

  const html = `<!DOCTYPE html><html><head>
<title>Quotation ${row.quotationNo}</title>
<meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#d0d0d0}
@page{size:A4 portrait;margin:10mm}
@media print{body{background:#fff}.noprint{display:none!important}.brk{page-break-before:always}}

.page{width:190mm;background:#fff;margin:6mm auto;padding:6mm;display:flex;flex-direction:column}
.brk{margin-top:0}

/* header */
.doc-hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #000;margin-bottom:4px}
.doc-hdr img{height:52px;object-fit:contain}
.co-name{font-size:26px;font-weight:bold;color:#1a9bc0;letter-spacing:2px}

/* title */
.doc-title{text-align:center;border:2px solid #000;padding:4px 0;font-size:14px;font-weight:bold;letter-spacing:4px}

/* buyer table */
.buyer-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.buyer-tbl td{vertical-align:top;padding:4px 6px;border:1px solid #000;font-size:10.5px}
.buyer-left{width:56%}
.date-col{width:44%}
.b-label{font-weight:bold;text-decoration:underline;margin-bottom:3px}
.b-name{font-weight:bold;margin-bottom:2px}
.b-addr{margin-bottom:2px;line-height:1.4}
.b-row{line-height:1.4}
.d-row{display:flex;gap:6px;margin-bottom:4px;line-height:1.4}
.d-lbl{font-weight:bold;min-width:82px}

/* items table */
.items-tbl{width:100%;border-collapse:collapse;border-top:none}
.items-tbl th{border:1px solid #000;padding:3px 2px;font-size:10px;text-align:center;font-weight:bold}
.items-tbl td{border:1px solid #000;padding:2px 3px;font-size:10px;vertical-align:middle;height:20px}
.items-tbl td.c{text-align:center}
.items-tbl td.r{text-align:right}
.items-tbl tr.blank td{height:20px;padding:0}

/* bank + totals */
.bank-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.bank-tbl td{vertical-align:top;padding:5px 6px;border:1px solid #000;font-size:10.5px}
.bank-left{width:42%}
.totals-right{width:58%}
.bk-title{font-weight:bold;margin-bottom:5px}
.bk-row{display:flex;margin-bottom:3px}
.bk-lbl{min-width:95px}
.t-row{display:flex;justify-content:flex-end;align-items:baseline;margin-bottom:2px}
.t-lbl{text-align:right;padding-right:6px;min-width:205px}
.t-val{min-width:80px;text-align:right;font-weight:bold;border-bottom:1px solid #bbb}
.t-row.grand .t-lbl,.t-row.grand .t-val{font-weight:bold;font-size:11.5px;border-bottom:2px solid #000}

/* words */
.words{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10.5px}
.w-title{font-weight:bold;margin-bottom:1px}
.w-val{font-weight:bold}

/* terms */
.terms{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10px}
.t-title{font-weight:bold;text-decoration:underline;margin-bottom:2px;color:#0097A7}
.t-line{margin-bottom:1px;line-height:1.4}

/* footer */
.pgfoot{border-top:1px solid #555;padding-top:3px;margin-top:3px;font-size:9px;color:#222}
.pf-line{margin-bottom:1px}
.pf-last{display:flex;justify-content:space-between;margin-top:1px}
</style></head><body>

<!-- PAGE 1: header + all items -->
<div class="page">
  <div class="doc-hdr">
    <img src="${logoUrl}" alt="" onerror="this.style.display='none'"/>
    <span class="co-name">VELSON</span>
  </div>
  <div class="doc-title">QUOTATION</div>
  <table class="buyer-tbl"><tbody><tr>
    <td class="buyer-left">
      <div class="b-label">BUYER :</div>
      <div class="b-name">${cust.customerName ?? ''}</div>
      <div class="b-addr">${fullAddr.replace(/\n/g,'<br>')}</div>
      <div class="b-row">Mail ID : ${cust.email ?? ''}</div>
      <div class="b-row">Contact Person : ${cust.contactPerson ?? ''}</div>
      <div class="b-row">PH : ${cust.mobile ?? cust.phone ?? ''}</div>
      <div class="b-row">GST : 33AKTPM1897L1ZC</div>
    </td>
    <td class="date-col">
      <div class="d-row"><span class="d-lbl">Date :</span><span>${fmtDMY(row.quotationDate)}</span></div>
      <div class="d-row"><span class="d-lbl">Q No :</span><span>${row.quotationNo}</span></div>
      <div class="d-row"><span class="d-lbl">Revision No :</span><span>${row.revisionNo ?? 0}</span></div>
      <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${cust.gstNo ?? ''}</span></div>
    </td>
  </tr></tbody></table>
  <table class="items-tbl">
    ${itemsTableHead}
    <tbody>${allItemRowsHtml}</tbody>
  </table>
  ${buildTerms()}
  ${buildFooter(1)}
</div>

<!-- PAGE 2: blank items + bank + totals -->
<div class="page brk">
  <table class="items-tbl">
    ${itemsTableHead}
    <tbody>${blankRowsHtml}</tbody>
  </table>
  <table class="bank-tbl"><tbody><tr>
    <td class="bank-left">
      <div class="bk-title">BANK DETAILS</div>
      <div class="bk-row"><span class="bk-lbl">BANK NAME</span><span>&nbsp;: CITY UNION BANK LTD</span></div>
      <div class="bk-row"><span class="bk-lbl">BRANCH</span><span>&nbsp;: TIRUCHENGODE</span></div>
      <div class="bk-row"><span class="bk-lbl">ACCOUNT NAME</span><span>&nbsp;: VELSON</span></div>
      <div class="bk-row"><span class="bk-lbl">ACCOUNT NO</span><span>&nbsp;: 512020010031090</span></div>
      <div class="bk-row"><span class="bk-lbl">IFSC CODE</span><span>&nbsp;: CIUB0000143</span></div>
    </td>
    <td class="totals-right">
      <div class="t-row"><span class="t-lbl">Sub Total :</span><span class="t-val">${inr(subT)}</span></div>
      <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${inr(freight)}</span></div>
      <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${inr(pf)}</span></div>
      <div class="t-row"><span class="t-lbl">Taxable Value :</span><span class="t-val">${inr(taxableV)}</span></div>
      <div class="t-row"><span class="t-lbl">CGST (${cgstPct.toFixed(2)}%) :</span><span class="t-val">${inr(cgst)}</span></div>
      <div class="t-row"><span class="t-lbl">SGST (${sgstPct.toFixed(2)}%) :</span><span class="t-val">${inr(sgst)}</span></div>
      <div class="t-row"><span class="t-lbl">IGST(${igstPct.toFixed(2)}%) :</span><span class="t-val">${inr(igst)}</span></div>
      <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${inr(row.totalAmount)}</span></div>
    </td>
  </tr></tbody></table>
  <div class="words">
    <div class="w-title">Amount chargeable in words</div>
    <div class="w-val">(${toWords(row.totalAmount)})</div>
  </div>
  ${buildTerms()}
  ${buildFooter(2)}
</div>

<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank', 'width=900,height=850')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/* ── Format 4 PDF ── */
const openFormat4Window = async (row) => {
  let cust = {}
  try {
    const res = await api.get('/api/customer-master', { skipGlobalLoader: true })
    cust = (res.data?.data ?? []).find(c => c.id === row.customerId) ?? {}
  } catch { cust = { customerName: row.customer?.customerName ?? '' } }

  const taxAmt    = parseFloat(row.taxAmount)         || 0
  const taxPct    = parseFloat(row.taxPercent)        || 18
  const subT      = parseFloat(row.subTotal)          || 0
  const freight   = parseFloat(row.freightAmount)     || 0
  const pf        = parseFloat(row.packingForwarding) || 0
  const taxableV  = subT + freight + pf
  const isIGST    = !(row.taxType ?? '').toUpperCase().includes('CGST')
  const igst      = isIGST ? taxAmt : 0
  const cgst      = isIGST ? 0 : taxAmt / 2
  const sgst      = isIGST ? 0 : taxAmt / 2
  const cgstPct   = isIGST ? 0 : taxPct / 2
  const sgstPct   = isIGST ? 0 : taxPct / 2
  const igstPct   = isIGST ? taxPct : 0

  const addrLines = [cust.address, cust.address2, cust.address3, cust.address4]
    .filter(Boolean).join(',\n')
  const cityLine  = [cust.city, cust.state, cust.pinCode].filter(Boolean).join(' - ')
  const fullAddr  = [addrLines, cityLine].filter(Boolean).join(',\n')

  const allItems    = row.details ?? []
  const FIRST_MAX   = 15
  const REST_MAX    = 17
  const FILL_TARGET = 15

  // Split items into pages
  const pages = []
  if (allItems.length <= FIRST_MAX) {
    pages.push({ items: allItems, isFirst: true, isLast: true, max: FIRST_MAX })
  } else {
    pages.push({ items: allItems.slice(0, FIRST_MAX), isFirst: true, isLast: false, max: FIRST_MAX })
    let i = FIRST_MAX
    while (i < allItems.length) {
      const chunk = allItems.slice(i, i + REST_MAX)
      i += REST_MAX
      pages.push({ items: chunk, isFirst: false, isLast: i >= allItems.length, max: REST_MAX })
    }
  }
  const totalPages = pages.length

  const defaultTerms = [
    '1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.',
    '2. Payment : 100% advance along with PO, before delivery.',
    '3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.',
    '4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.'
  ]
  const termsLines = row.paymentTerms
    ? row.paymentTerms.split('\n').map(l => l.replace(/&/g,'&amp;').replace(/</g,'&lt;'))
    : defaultTerms

  const buildTerms = () => `
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${termsLines.map(l => `<div class="t-line">${l}</div>`).join('')}
    </div>`

  const buildFooter = (pageNum) => `
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${pageNum} of ${totalPages}${pageNum < totalPages ? '&nbsp;&nbsp;&nbsp;Continue(-.)' : ''}</span>
      </div>
    </div>`

  const logoUrl = `${window.location.origin}/velson-logo.png`

  const itemsTableHead = `<thead><tr>
    <th style="width:28px">S.No.</th>
    <th>DESCRIPTION OF GOODS</th>
    <th style="width:46px">TAX %</th>
    <th style="width:68px">HSN Code</th>
    <th style="width:44px">QTY</th>
    <th style="width:38px">UNIT</th>
    <th style="width:76px">RATE IN INR</th>
    <th style="width:76px">VALUE IN INR</th>
  </tr></thead>`

  let globalIdx = 0
  const pagesHtml = pages.map((pg, pi) => {
    const pageNum    = pi + 1
    const isFirst    = pg.isFirst
    const isLast     = pg.isLast
    const itemRowsHtml = pg.items.map(d => {
      globalIdx++
      return `<tr>
        <td class="c">${globalIdx}</td>
        <td>${[d.itemName, d.partNo].filter(Boolean).join('  ')}</td>
        <td class="c">${parseFloat(d.taxPercent ?? row.taxPercent ?? 18).toFixed(2)}</td>
        <td class="c">${d.hsnCode ?? ''}</td>
        <td class="c">${parseFloat(d.qty || 0).toFixed(2)}</td>
        <td class="c">${d.uom ?? ''}</td>
        <td class="r">${inr(d.unitPrice)}</td>
        <td class="r">${inr(d.amount)}</td>
      </tr>`
    }).join('')

    const fillCount   = isLast ? Math.max(0, FILL_TARGET - pg.items.length) : 0
    const fillRowsHtml = Array(fillCount).fill(
      `<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
    ).join('')

    const bankSection = isLast ? `
      <table class="bank-tbl"><tbody><tr>
        <td class="bank-left">
          <div class="bk-title">BANK DETAILS</div>
          <div class="bk-row"><span class="bk-lbl">BANK NAME</span><span>&nbsp;: CITY UNION BANK LTD</span></div>
          <div class="bk-row"><span class="bk-lbl">BRANCH</span><span>&nbsp;: TIRUCHENGODE</span></div>
          <div class="bk-row"><span class="bk-lbl">ACCOUNT NAME</span><span>&nbsp;: VELSON</span></div>
          <div class="bk-row"><span class="bk-lbl">ACCOUNT NO</span><span>&nbsp;: 512020010031090</span></div>
          <div class="bk-row"><span class="bk-lbl">IFSC CODE</span><span>&nbsp;: CIUB0000143</span></div>
        </td>
        <td class="totals-right">
          <div class="t-row"><span class="t-lbl">Sub Total :</span><span class="t-val">${inr(subT)}</span></div>
          <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${inr(freight)}</span></div>
          <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${inr(pf)}</span></div>
          <div class="t-row"><span class="t-lbl">Taxable Value :</span><span class="t-val">${inr(taxableV)}</span></div>
          <div class="t-row"><span class="t-lbl">CGST (${cgstPct.toFixed(2)}%) :</span><span class="t-val">${inr(cgst)}</span></div>
          <div class="t-row"><span class="t-lbl">SGST (${sgstPct.toFixed(2)}%) :</span><span class="t-val">${inr(sgst)}</span></div>
          <div class="t-row"><span class="t-lbl">IGST(${igstPct.toFixed(2)}%) :</span><span class="t-val">${inr(igst)}</span></div>
          <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${inr(row.totalAmount)}</span></div>
        </td>
      </tr></tbody></table>
      <div class="words">
        <div class="w-title">Amount chargeable in words</div>
        <div class="w-val">(${toWords(row.totalAmount)})</div>
      </div>` : ''

    const headerSection = isFirst ? `
      <div class="doc-hdr">
        <img src="${logoUrl}" alt="" onerror="this.style.display='none'"/>
        <span class="co-name">VELSON</span>
      </div>
      <div class="doc-title">QUOTATION</div>
      <table class="buyer-tbl"><tbody><tr>
        <td class="buyer-left">
          <div class="b-label">BUYER :</div>
          <div class="b-name">${cust.customerName ?? ''}</div>
          <div class="b-addr">${fullAddr.replace(/\n/g,'<br>')}</div>
          <div class="b-row">Mail ID : ${cust.email ?? ''}</div>
          <div class="b-row">Contact Person : ${cust.contactPerson ?? ''}</div>
          <div class="b-row">PH : ${cust.mobile ?? cust.phone ?? ''}</div>
          <div class="b-row">GST : 33AKTPM1897L1ZC</div>
        </td>
        <td class="date-col">
          <div class="d-row"><span class="d-lbl">Date :</span><span>${fmtDMY(row.quotationDate)}</span></div>
          <div class="d-row"><span class="d-lbl">Q No :</span><span>${row.quotationNo}</span></div>
          <div class="d-row"><span class="d-lbl">Revision No :</span><span>${row.revisionNo ?? 0}</span></div>
          <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${cust.gstNo ?? ''}</span></div>
        </td>
      </tr></tbody></table>` : ''

    return `
      <div class="page${pi > 0 ? ' brk' : ''}">
        ${headerSection}
        <table class="items-tbl">
          ${itemsTableHead}
          <tbody>${itemRowsHtml}${fillRowsHtml}</tbody>
        </table>
        ${isFirst || isLast ? buildTerms() : ''}
        ${bankSection}
        ${buildFooter(pageNum)}
      </div>`
  }).join('\n')

  const html = `<!DOCTYPE html><html><head>
<title>Quotation ${row.quotationNo}</title>
<meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#d0d0d0}
@page{size:A4 portrait;margin:10mm}
@media print{body{background:#fff}.noprint{display:none!important}.brk{page-break-before:always}}

.page{width:190mm;background:#fff;margin:6mm auto;padding:6mm;display:flex;flex-direction:column}
.brk{margin-top:0}

.doc-hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #000;margin-bottom:4px}
.doc-hdr img{height:52px;object-fit:contain}
.co-name{font-size:26px;font-weight:bold;color:#1a9bc0;letter-spacing:2px}

.doc-title{text-align:center;border:2px solid #000;padding:4px 0;font-size:14px;font-weight:bold;letter-spacing:4px}

.buyer-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.buyer-tbl td{vertical-align:top;padding:4px 6px;border:1px solid #000;font-size:10.5px}
.buyer-left{width:56%}
.date-col{width:44%}
.b-label{font-weight:bold;text-decoration:underline;margin-bottom:3px}
.b-name{font-weight:bold;margin-bottom:2px}
.b-addr{margin-bottom:2px;line-height:1.4}
.b-row{line-height:1.4}
.d-row{display:flex;gap:6px;margin-bottom:4px;line-height:1.4}
.d-lbl{font-weight:bold;min-width:82px}

.items-tbl{width:100%;border-collapse:collapse;border-top:none}
.items-tbl th{border:1px solid #000;padding:3px 2px;font-size:10px;text-align:center;font-weight:bold}
.items-tbl td{border:1px solid #000;padding:2px 3px;font-size:10px;vertical-align:middle;height:20px}
.items-tbl td.c{text-align:center}
.items-tbl td.r{text-align:right}
.items-tbl tr.blank td{height:20px;padding:0}

.bank-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.bank-tbl td{vertical-align:top;padding:5px 6px;border:1px solid #000;font-size:10.5px}
.bank-left{width:42%}
.totals-right{width:58%}
.bk-title{font-weight:bold;margin-bottom:5px}
.bk-row{display:flex;margin-bottom:3px}
.bk-lbl{min-width:95px}
.t-row{display:flex;justify-content:flex-end;align-items:baseline;margin-bottom:2px}
.t-lbl{text-align:right;padding-right:6px;min-width:205px}
.t-val{min-width:80px;text-align:right;font-weight:bold;border-bottom:1px solid #bbb}
.t-row.grand .t-lbl,.t-row.grand .t-val{font-weight:bold;font-size:11.5px;border-bottom:2px solid #000}

.words{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10.5px}
.w-title{font-weight:bold;margin-bottom:1px}
.w-val{font-weight:bold}

.terms{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10px}
.t-title{font-weight:bold;text-decoration:underline;margin-bottom:2px;color:#0097A7}
.t-line{margin-bottom:1px;line-height:1.4;font-weight:bold}

.pgfoot{border-top:1px solid #555;padding-top:3px;margin-top:3px;font-size:9px;color:#222}
.pf-line{margin-bottom:1px}
.pf-last{display:flex;justify-content:space-between;margin-top:1px}
</style></head><body>
${pagesHtml}
<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank', 'width=900,height=850')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/* ── Format 2 PDF ── */
const openFormat2Window = async (row) => {
  let cust = {}
  try {
    const res = await api.get('/api/customer-master', { skipGlobalLoader: true })
    cust = (res.data?.data ?? []).find(c => c.id === row.customerId) ?? {}
  } catch { cust = { customerName: row.customer?.customerName ?? '' } }

  const taxAmt  = parseFloat(row.taxAmount)  || 0
  const taxPct  = parseFloat(row.taxPercent) || 18
  const subT    = parseFloat(row.subTotal)   || 0
  const disAmt  = parseFloat(row.specialDiscount) || 0
  const afterDis = subT - disAmt
  const isIGST  = !(row.taxType ?? '').toUpperCase().includes('CGST')
  const igst    = isIGST ? taxAmt : 0
  const cgst    = isIGST ? 0 : taxAmt / 2
  const sgst    = isIGST ? 0 : taxAmt / 2
  const cgstPct = isIGST ? 0 : taxPct / 2
  const sgstPct = isIGST ? 0 : taxPct / 2
  const igstPct = isIGST ? taxPct : 0

  const addrLines = [cust.address, cust.address2, cust.address3, cust.address4]
    .filter(Boolean).join(',\n')
  const cityLine  = [cust.city, cust.state, cust.pinCode].filter(Boolean).join(' - ')
  const fullAddr  = [addrLines, cityLine].filter(Boolean).join(',\n')

  const FIRST_MAX = 10
  const REST_MAX  = 15
  const allItems  = row.details ?? []
  const pages = []
  if (allItems.length <= FIRST_MAX) {
    pages.push({ items: allItems, isFirst: true, isLast: true, max: FIRST_MAX })
  } else {
    pages.push({ items: allItems.slice(0, FIRST_MAX), isFirst: true, isLast: false, max: FIRST_MAX })
    let i = FIRST_MAX
    while (i < allItems.length) {
      const chunk = allItems.slice(i, i + REST_MAX)
      i += REST_MAX
      pages.push({ items: chunk, isFirst: false, isLast: i >= allItems.length, max: REST_MAX })
    }
  }
  const totalPages = pages.length

  const defaultTerms = [
    '1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.',
    '2. Payment : 100% advance along with PO, before delivery.',
    '3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.',
    '4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.'
  ]
  const termsLines = row.paymentTerms
    ? row.paymentTerms.split('\n').map(l => l.replace(/&/g,'&amp;').replace(/</g,'&lt;'))
    : defaultTerms

  const buildItemRows = (items, startIdx, maxCount) => {
    const dataRows = items.map((d, i) => `<tr>
      <td class="c">${startIdx + i + 1}</td>
      <td>${[d.itemName, d.partNo].filter(Boolean).join('  ')}</td>
      <td class="c">${parseFloat(d.taxPercent ?? row.taxPercent ?? 18).toFixed(2)}</td>
      <td class="c">${d.hsnCode ?? ''}</td>
      <td class="c">${parseFloat(d.qty || 0).toFixed(2)}</td>
      <td class="c">${d.uom ?? ''}</td>
      <td class="r">${inr(d.unitPrice)}</td>
      <td class="r">${inr(d.amount)}</td>
    </tr>`).join('')
    const blanks = Array(maxCount - items.length).fill(
      `<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
    ).join('')
    return dataRows + blanks
  }

  const buildTerms = () => `
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${termsLines.map(l => `<div class="t-line">${l}</div>`).join('')}
    </div>`

  const buildFooter = (pageNum) => `
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${pageNum} of ${totalPages}${pageNum < totalPages ? '&nbsp;&nbsp;&nbsp;Continue(-.)' : ''}</span>
      </div>
    </div>`

  const logoUrl = `${window.location.origin}/velson-logo.png`
  let globalIdx = 0

  const pagesHtml = pages.map((pg, pi) => {
    const startIdx = globalIdx
    globalIdx += pg.items.length

    const headerHtml = pg.isFirst ? `
      <div class="doc-hdr">
        <img src="${logoUrl}" alt="" onerror="this.style.display='none'"/>
        <span class="co-name">VELSON</span>
      </div>
      <div class="doc-title">QUOTATION</div>
      <table class="buyer-tbl"><tbody><tr>
        <td class="buyer-left">
          <div class="b-label">BUYER :</div>
          <div class="b-name">${cust.customerName ?? ''}</div>
          <div class="b-addr">${fullAddr.replace(/\n/g,'<br>')}</div>
          <div class="b-row" style="margin-top:5px">Mail ID : ${cust.email ?? ''}</div>
          <div class="b-row">Contact Person : ${cust.contactPerson ?? ''}</div>
          <div class="b-row">PH : ${cust.mobile ?? cust.phone ?? ''}</div>
        </td>
        <td class="date-col">
          <div class="d-row"><span class="d-lbl">Date :</span><span>${fmtDMY(row.quotationDate)}</span></div>
          <div class="d-row"><span class="d-lbl">Q No :</span><span>${row.quotationNo}</span></div>
          <div class="d-row"><span class="d-lbl">Revision No :</span><span>${row.revisionNo ?? 0}</span></div>
          <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${cust.gstNo ?? ''}</span></div>
        </td>
      </tr></tbody></table>` : ''

    const bankHtml = pg.isLast ? `
      <table class="bank-tbl"><tbody><tr>
        <td class="bank-left">
          <div class="bk-title">BANK DETAILS</div>
          <div class="bk-row"><span class="bk-lbl">BANK NAME</span><span>&nbsp;: CITY UNION BANK LTD</span></div>
          <div class="bk-row"><span class="bk-lbl">BRANCH</span><span>&nbsp;: TIRUCHENGODE</span></div>
          <div class="bk-row"><span class="bk-lbl">ACCOUNT NAME</span><span>&nbsp;: VELSON</span></div>
          <div class="bk-row"><span class="bk-lbl">ACCOUNT NO</span><span>&nbsp;: 512020010031090</span></div>
          <div class="bk-row"><span class="bk-lbl">IFSC CODE</span><span>&nbsp;: CIUB0000143</span></div>
        </td>
        <td class="totals-right">
          <div class="t-row"><span class="t-lbl">VALUE :</span><span class="t-val">${Math.round(subT)}</span></div>
          <div class="t-row"><span class="t-lbl">Dis Amount :</span><span class="t-val">${inr(disAmt)}</span></div>
          <div class="t-row sep"><span class="t-lbl">Sub Total :</span><span class="t-val">${inr(afterDis)}</span></div>
          <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${Math.round(parseFloat(row.freightAmount)||0)}</span></div>
          <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${Math.round(parseFloat(row.packingForwarding)||0)}</span></div>
          <div class="t-row"><span class="t-lbl">CGST (${cgstPct.toFixed(2)}%) :</span><span class="t-val">${inr(cgst)}</span></div>
          <div class="t-row"><span class="t-lbl">SGST (${sgstPct.toFixed(2)}%) :</span><span class="t-val">${inr(sgst)}</span></div>
          <div class="t-row"><span class="t-lbl">IGST(${igstPct.toFixed(2)}%) :</span><span class="t-val">${inr(igst)}</span></div>
          <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${inr(row.totalAmount)}</span></div>
        </td>
      </tr></tbody></table>
      <div class="words">
        <div class="w-title">Amount chargeable in words</div>
        <div class="w-val">(${toWords(row.totalAmount)})</div>
      </div>` : ''

    return `<div class="page${pi > 0 ? ' brk' : ''}">
      ${headerHtml}
      <table class="items-tbl">
        <thead><tr>
          <th style="width:28px">S.No.</th>
          <th>DESCRIPTION OF GOODS</th>
          <th style="width:46px">TAX %</th>
          <th style="width:68px">HSN Code</th>
          <th style="width:44px">QTY</th>
          <th style="width:38px">UNIT</th>
          <th style="width:76px">RATE IN INR</th>
          <th style="width:76px">VALUE IN INR</th>
        </tr></thead>
        <tbody>${buildItemRows(pg.items, startIdx, pg.max)}</tbody>
      </table>
      ${bankHtml}
      ${buildTerms()}
      ${buildFooter(pi + 1)}
    </div>`
  }).join('\n')

  const html = `<!DOCTYPE html><html><head>
<title>Quotation ${row.quotationNo}</title>
<meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#d0d0d0}
@page{size:A4 portrait;margin:10mm}
@media print{body{background:#fff}.noprint{display:none!important}.brk{page-break-before:always}}

.page{width:190mm;background:#fff;margin:6mm auto;padding:6mm;display:flex;flex-direction:column;gap:0}
.brk{margin-top:0}

/* header */
.doc-hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #000;margin-bottom:4px}
.doc-hdr img{height:52px;object-fit:contain}
.co-name{font-size:26px;font-weight:bold;color:#1a9bc0;letter-spacing:2px}

/* title */
.doc-title{text-align:center;border:2px solid #000;padding:4px 0;font-size:14px;font-weight:bold;letter-spacing:4px}

/* buyer table */
.buyer-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.buyer-tbl td{vertical-align:top;padding:5px 6px;border:1px solid #000;font-size:10.5px}
.buyer-left{width:56%}
.date-col{width:44%}
.b-label{font-weight:bold;text-decoration:underline;margin-bottom:3px}
.b-name{font-weight:bold;margin-bottom:2px}
.b-addr{margin-bottom:2px;line-height:1.4}
.b-row{line-height:1.5}
.d-row{display:flex;gap:6px;margin-bottom:5px;line-height:1.4}
.d-lbl{font-weight:bold;min-width:82px}

/* items table */
.items-tbl{width:100%;border-collapse:collapse;border-top:none}
.items-tbl th{border:1px solid #000;padding:4px 2px;font-size:10px;text-align:center;font-weight:bold;background:#fff}
.items-tbl td{border:1px solid #000;padding:3px 3px;font-size:10px;vertical-align:middle;height:22px}
.items-tbl td.c{text-align:center}
.items-tbl td.r{text-align:right}
.items-tbl tr.blank td{height:22px;padding:0}

/* bank + totals */
.bank-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
.bank-tbl td{vertical-align:top;padding:5px 6px;border:1px solid #000;font-size:10.5px}
.bank-left{width:42%}
.totals-right{width:58%}
.bk-title{font-weight:bold;margin-bottom:5px}
.bk-row{display:flex;margin-bottom:3px}
.bk-lbl{min-width:95px;font-weight:normal}
.t-row{display:flex;justify-content:flex-end;align-items:baseline;margin-bottom:2px}
.t-lbl{text-align:right;padding-right:6px;min-width:200px}
.t-val{min-width:80px;text-align:right;font-weight:bold;border-bottom:1px solid #bbb}
.t-row.sep .t-lbl,.t-row.sep .t-val{border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:2px}
.t-row.grand .t-lbl,.t-row.grand .t-val{font-weight:bold;font-size:11.5px;border-bottom:2px solid #000}

/* words */
.words{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10.5px}
.w-title{font-weight:bold;margin-bottom:1px}
.w-val{font-weight:bold}

/* terms */
.terms{border:1px solid #000;border-top:none;padding:4px 6px;font-size:10px}
.t-title{font-weight:bold;text-decoration:underline;margin-bottom:2px;color:#0097A7}
.t-line{margin-bottom:1px;line-height:1.4}

/* footer */
.pgfoot{border-top:1px solid #555;padding-top:3px;margin-top:3px;font-size:9px;color:#222}
.pf-line{margin-bottom:1px}
.pf-last{display:flex;justify-content:space-between;margin-top:1px}
</style></head><body>
${pagesHtml}
<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank', 'width=900,height=850')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/* ── PDF print window for a single quotation ── */
const openPrintWindow = (row) => {
  const items = (row.details ?? []).map((d, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${d.partNo ?? ''}</td>
      <td>${d.itemName ?? ''}</td>
      <td>${d.description ?? ''}</td>
      <td style="text-align:center">${d.qty ?? ''}</td>
      <td style="text-align:right">${d.unitPrice ?? ''}</td>
      <td style="text-align:right">${d.amount ?? ''}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html><head><title>Quotation ${row.quotationNo}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:30px;font-size:12px;color:#222}
    h2{text-align:center;margin-bottom:4px;font-size:16px}
    .sub{text-align:center;color:#555;margin-bottom:16px;font-size:11px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
    .kv{margin:2px 0}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #ccc;padding:5px 8px}
    th{background:#f0f4f8;font-size:11px;text-transform:uppercase}
    .totals{text-align:right;margin-top:10px}
    .totals div{margin:2px 0}
    .grand{font-size:14px;font-weight:bold;color:#0097A7}
    @media print{button{display:none}}
  </style></head><body>
  <h2>QUOTATION</h2>
  <p class="sub">${row.quotationNo} &nbsp;|&nbsp; Rev: ${row.revisionNo ?? 0} &nbsp;|&nbsp; ${fmt(row.quotationDate)}</p>
  <div class="grid">
    <div>
      <div class="kv"><strong>Customer:</strong> ${row.customer?.customerName ?? '—'}</div>
      <div class="kv"><strong>Status:</strong> ${row.status ?? '—'}</div>
      <div class="kv"><strong>Currency:</strong> ${row.currencyCode ?? 'INR'}</div>
    </div>
    <div>
      <div class="kv"><strong>Tax Type:</strong> ${row.taxType ?? '—'}</div>
      <div class="kv"><strong>Valid Until:</strong> ${fmt(row.validUntil)}</div>
      <div class="kv"><strong>Model Ref:</strong> ${row.modelRef ?? '—'}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width:30px">#</th><th>Part No</th><th>Item Name</th>
      <th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th>
    </tr></thead>
    <tbody>${items || '<tr><td colspan="7" style="text-align:center;color:#888">No items</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <div>Sub Total: <strong>${fmtAmt(row.subTotal)}</strong></div>
    <div>Special Discount: <strong>${fmtAmt(row.specialDiscount)}</strong></div>
    <div>Freight: <strong>${fmtAmt(row.freightAmount)}</strong></div>
    <div>Tax (${row.taxPercent ?? 0}%): <strong>${fmtAmt(row.taxAmount)}</strong></div>
    <div class="grand">Grand Total: ${fmtAmtWhole(row.totalAmount)}</div>
  </div>
  ${row.paymentTerms ? `<div style="margin-top:16px;font-size:11px;color:#555"><strong>Payment Terms:</strong><br>${row.paymentTerms.replace(/\n/g,'<br>')}</div>` : ''}
  <br><button onclick="window.print()" style="padding:6px 18px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">Print / Save PDF</button>
  </body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank', 'width=850,height=700')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/* ── CSV export for the visible row list ── */
const exportCSV = (rows) => {
  const headers = ['Quotation No', 'Date', 'Status', 'Customer', 'Currency', 'Sub Total', 'Tax %', 'Tax Amount', 'Total Amount']
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.quotationNo,
      r.quotationDate ? new Date(r.quotationDate).toLocaleDateString('en-IN') : '',
      r.status ?? '',
      r.customer?.customerName ?? '',
      r.currencyCode ?? '',
      r.subTotal ?? '',
      r.taxPercent ?? '',
      r.taxAmount ?? '',
      r.totalAmount ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `quotations_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function QuotationDetails() {
  const toast = useToast()
  const navigate = useNavigate()

  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')
  const [quotationNo, setQuotationNo]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pdfFormat, setPdfFormat]       = useState('Standard')

  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  /* delete confirmation state */
  const [deleteTarget, setDeleteTarget] = useState(null)   // { id, quotationNo }
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* accept / reject state (superadmin only) */
  const [actionTarget, setActionTarget] = useState(null)   // { id, quotationNo, action: 'Accepted'|'Rejected' }
  const [actionLoading, setActionLoading] = useState(false)

  /* view modal */
  const [viewRow, setViewRow] = useState(null)

  /* pdf format dropdown */
  const [pdfMenuRow, setPdfMenuRow] = useState(null)
  const pdfMenuRef = useRef(null)
  useEffect(() => {
    if (!pdfMenuRow) return
    const handler = (e) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target)) setPdfMenuRow(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pdfMenuRow])

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/quotation-master', { skipGlobalLoader: true })
      let data = res.data?.data ?? []
      if (fromDate) data = data.filter(r => r.quotationDate && r.quotationDate.slice(0, 10) >= fromDate)
      if (toDate)   data = data.filter(r => r.quotationDate && r.quotationDate.slice(0, 10) <= toDate)
      if (quotationNo.trim()) data = data.filter(r => r.quotationNo?.toLowerCase().includes(quotationNo.trim().toLowerCase()))
      if (statusFilter)       data = data.filter(r => r.status === statusFilter)
      setRows(data)
    } catch (err) {
      console.error('[QuotationDetails] fetch error:', err)
      setError('Failed to load quotations.')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, quotationNo, statusFilter])

  useEffect(() => { fetchData() }, [])

  /* ── delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.delete(`/api/quotation-master/${deleteTarget.id}`, { loadingMessage: 'Deleting quotation...' })
      setRows(r => r.filter(x => x.id !== deleteTarget.id))
      toast.success(`Quotation ${deleteTarget.quotationNo} deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Delete failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── edit → navigate to entry page with the existing data ── */
  const handleEdit = (row) => {
    // Accepted quotations create a new revision; others are edited in-place
    const mode = row.status === 'Accepted' ? 'revision' : 'edit'
    navigate('/quotation/quotation-entry', { state: { editData: row, mode } })
  }

  /* ── accept / reject (superadmin) ── */
  const confirmAction = async () => {
    if (!actionTarget) return
    setActionLoading(true)
    try {
      const row = rows.find(x => x.id === actionTarget.id) ?? {}
      const payload = {
        customerRef:       row.customerRef      ?? null,
        currencyCode:      row.currencyCode     ?? 'INR',
        exchangeRate:      row.exchangeRate      ?? 1,
        modelRef:          row.modelRef         ?? null,
        taxType:           row.taxType          ?? null,
        quotationDate:     row.quotationDate    ?? null,
        validUntil:        row.validUntil       ?? null,
        revisionNo:        row.revisionNo       ?? 0,
        quotationType:     row.quotationType    ?? null,
        discountType:      row.discountType     ?? 'Dis_Per',
        showTotalsGrid:    row.showTotalsGrid   ?? false,
        specialDiscount:   row.specialDiscount  ?? 0,
        freightAmount:     row.freightAmount    ?? 0,
        taxPercent:        row.taxPercent       ?? 18,
        packingForwarding: row.packingForwarding ?? 0,
        subTotal:          row.subTotal         ?? 0,
        taxAmount:         row.taxAmount        ?? 0,
        totalAmount:       row.totalAmount      ?? 0,
        paymentTerms:      row.paymentTerms     ?? null,
        status:            actionTarget.action,
        items:             row.details          ?? [],
      }
      await api.put(`/api/quotation-master/${actionTarget.id}`, payload, { loadingMessage: 'Updating quotation...' })
      setRows(r => r.map(x => x.id === actionTarget.id ? { ...x, status: actionTarget.action } : x))
      toast.success(`Quotation ${actionTarget.quotationNo} ${actionTarget.action.toLowerCase()}.`)
      setActionTarget(null)
    } catch (err) {
      toast.error('Action failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setActionLoading(false)
    }
  }

  const COLS = [
    { label: 'Quotation Number', w: 'w-40' },
    { label: 'Quotation Date',   w: 'w-36' },
    { label: 'Status',           w: 'w-32' },
    { label: 'Customer Name',    w: 'w-64' },
    { label: 'Total Amount',     w: 'w-36' },
    { label: 'View',             w: 'w-16' },
    { label: 'RPT',              w: 'w-16' },
    { label: 'PDF',              w: 'w-16' },
    { label: 'Edit',             w: 'w-16' },
    { label: 'Delete',           w: 'w-16' },
  ]

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
          {/* <ChevronRight className="w-3 h-3" /> */}
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Quotation Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Quotation Details</h2>
            </div>
            <button
              onClick={() => onNavigate?.('Dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm"
            >
              <div className="w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center">
                <X size={10} className="text-white" strokeWidth={3} />
              </div>
              Close
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Bar */}
            <div className="flex items-end justify-between gap-4 mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="flex items-end gap-4 w-full flex-wrap">
                <div className="flex-1 min-w-[130px]">
                  <Label>From Date</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full" />
                </div>
                <div className="flex-1 min-w-[130px]">
                  <Label>To Date</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full" />
                </div>
                <div className="flex-1 min-w-[130px]">
                  <Label>PDF Format</Label>
                  <select
                    value={pdfFormat}
                    onChange={e => setPdfFormat(e.target.value)}
                    className="px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 w-full focus:outline-none focus:border-[#0097A7]"
                  >
                    <option>Standard</option>
                    <option>Detailed</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label>Quotation Number</Label>
                  <Input placeholder="Enter Quote No" value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="w-full" />
                </div>
                <div className="flex-1 min-w-[130px]">
                  <Label>Quotation Status</Label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 w-full focus:outline-none focus:border-[#0097A7]"
                  >
                    <option value="">-- All --</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-2 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-60 text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 h-[38px] min-w-[120px]"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Search
                </button>
              </div>
            </div>

            {/* Tool Icons Bar */}
            <div className="flex items-center justify-end gap-5 mb-4 px-2 text-slate-500">
              <div className="flex items-center gap-1.5 border-r border-slate-200 pr-5">
                <span className="text-[11px] font-bold">LS</span>
                <span className="text-[12px] font-black text-[#0097A7]">{rows.length}</span>
              </div>
              <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Dos">
                <Download size={16} />
                <span className="text-[11px] font-bold group-hover:text-[#0097A7]">Dos</span>
              </button>
              <button
                onClick={() => exportCSV(rows)}
                disabled={rows.length === 0}
                className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors group disabled:opacity-40"
                title="Export Excel/CSV"
              >
                <FileSpreadsheet size={16} />
                <span className="text-[11px] font-bold group-hover:text-emerald-600">Excel</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-rose-600 transition-colors group" title="Pdf">
                <FileText size={16} />
                <span className="text-[11px] font-bold group-hover:text-rose-600">Pdf</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Filter">
                <Filter size={16} />
                <span className="text-[11px] font-bold group-hover:text-[#0097A7]">Filter</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Setting">
                <Settings size={16} />
                <span className="text-[11px] font-bold group-hover:text-[#0097A7]">Setting</span>
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-full bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    {COLS.map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {loading ? (
                    <tr>
                      <td colSpan={COLS.length} className="py-8">
                        <SpinnerLoader message="Loading quotations…" />
                      </td>
                    </tr>
                  ) : error ? (
                    <tr><td colSpan={COLS.length} className="text-center py-16 text-red-400 text-[13px]">{error}</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={COLS.length} className="text-center py-16 text-slate-400 text-[13px]">No records found.</td></tr>
                  ) : (
                    rows.map((row, i) => (
                      <tr key={row.id} className={`h-10 hover:bg-[#f0f9fa]/60 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                        <td className="px-3 py-2 border-r border-slate-100 font-medium text-[#0097A7] whitespace-nowrap">{row.quotationNo}</td>
                        <td className="px-3 py-2 border-r border-slate-100 whitespace-nowrap">{fmt(row.quotationDate)}</td>
                        <td className="px-3 py-2 border-r border-slate-100"><StatusBadge status={row.status} /></td>
                        <td className="px-3 py-2 border-r border-slate-100">{row.customer?.customerName ?? '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right font-medium tabular-nums">{fmtAmt(row.totalAmount)}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <button
                            onClick={() => setViewRow(row)}
                            className="p-1.5 rounded hover:bg-cyan-50 text-slate-500 hover:text-[#0097A7] transition-colors"
                            title="View quotation"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <button
                            onClick={() => openPrintWindow(row)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-[#0097A7] transition-colors"
                            title="Print report"
                          >
                            <Printer size={14} />
                          </button>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <div
                            ref={pdfMenuRow === row.id ? pdfMenuRef : null}
                            className="relative inline-block"
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); setPdfMenuRow(pdfMenuRow === row.id ? null : row.id) }}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                              title="PDF"
                            >
                              <FileText size={14} />
                            </button>
                            {pdfMenuRow === row.id && (
                              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-xl w-32 py-1 text-left">
                                {[
                                  { label: 'Format 1', fn: () => openFormat1Window(row) },
                                  { label: 'Format 2', fn: () => openFormat2Window(row) },
                                  { label: 'Format 3', fn: () => openFormat3Window(row) },
                                  { label: 'Format 4', fn: () => openFormat4Window(row) },
                                ].map(({ label, fn }) => (
                                  <button
                                    key={label}
                                    onClick={() => { fn(); setPdfMenuRow(null) }}
                                    className="w-full px-3 py-1.5 text-[12px] text-slate-600 hover:bg-[#f0f9fa] hover:text-[#0097A7] transition-colors"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-1.5 rounded hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Revise & edit"
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <button
                            onClick={() => setDeleteTarget({ id: row.id, quotationNo: row.quotationNo })}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Quotation Audit & Estimation Analysis Console</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Records: <span className="text-[#0097A7]">{rows.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── View Quotation modal ── */}
      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
              <div>
                <p className="text-[14px] font-black text-slate-800 uppercase tracking-tight">
                  {viewRow.quotationNo}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Rev: {viewRow.revisionNo ?? 0} &nbsp;|&nbsp; {fmt(viewRow.quotationDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={viewRow.status} />
                <button onClick={() => setViewRow(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Customer / meta grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[12px]">
                <div className="space-y-1.5">
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Customer</span><span className="font-semibold text-slate-700">{viewRow.customer?.customerName ?? '—'}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Currency</span><span className="font-semibold text-slate-700">{viewRow.currencyCode ?? 'INR'}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Model Ref</span><span className="font-semibold text-slate-700">{viewRow.modelRef ?? '—'}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Customer Ref</span><span className="font-semibold text-slate-700">{viewRow.customerRef ?? '—'}</span></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Tax Type</span><span className="font-semibold text-slate-700">{viewRow.taxType ?? '—'}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Valid Until</span><span className="font-semibold text-slate-700">{fmt(viewRow.validUntil)}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Quotation Type</span><span className="font-semibold text-slate-700">{viewRow.quotationType ?? '—'}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Exchange Rate</span><span className="font-semibold text-slate-700">{viewRow.exchangeRate ?? '—'}</span></div>
                </div>
              </div>

              {/* Items table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11.5px]">
                  <thead className="bg-slate-100 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-200 w-8">#</th>
                      <th className="px-3 py-2 border-r border-slate-200">Part No</th>
                      <th className="px-3 py-2 border-r border-slate-200">Item Name</th>
                      <th className="px-3 py-2 border-r border-slate-200">Description</th>
                      <th className="px-3 py-2 border-r border-slate-200 text-center w-14">Qty</th>
                      <th className="px-3 py-2 border-r border-slate-200 text-right w-24">Unit Price</th>
                      <th className="px-3 py-2 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewRow.details ?? []).length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-6 text-slate-400">No items</td></tr>
                    ) : (viewRow.details ?? []).map((d, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                        <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-400">{i + 1}</td>
                        <td className="px-3 py-1.5 border-r border-slate-100 font-medium text-[#0097A7]">{d.partNo ?? '—'}</td>
                        <td className="px-3 py-1.5 border-r border-slate-100">{d.itemName ?? '—'}</td>
                        <td className="px-3 py-1.5 border-r border-slate-100 text-slate-500">{d.description ?? '—'}</td>
                        <td className="px-3 py-1.5 border-r border-slate-100 text-center">{d.qty ?? '—'}</td>
                        <td className="px-3 py-1.5 border-r border-slate-100 text-right tabular-nums">{fmtAmt(d.unitPrice)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmtAmt(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-[12px]">
                  <div className="flex justify-between text-slate-500"><span>Sub Total</span><span className="tabular-nums">{fmtAmt(viewRow.subTotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Special Discount</span><span className="tabular-nums">{fmtAmt(viewRow.specialDiscount)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Freight</span><span className="tabular-nums">{fmtAmt(viewRow.freightAmount)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Tax ({viewRow.taxPercent ?? 0}%)</span><span className="tabular-nums">{fmtAmt(viewRow.taxAmount)}</span></div>
                  <div className="flex justify-between font-black text-[13px] text-[#0097A7] border-t border-slate-200 pt-1.5 mt-1">
                    <span>Grand Total</span>
                    <span className="tabular-nums">{fmtAmtWhole(viewRow.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment terms */}
              {viewRow.paymentTerms && (
                <div className="bg-slate-50 rounded-lg p-3 text-[11.5px] text-slate-600 border border-slate-100">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Payment Terms</p>
                  <p className="whitespace-pre-wrap">{viewRow.paymentTerms}</p>
                </div>
              )}
            </div>

            {/* Modal footer — Accept / Reject */}
            <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/60">
              <button
                onClick={() => setViewRow(null)}
                className="px-4 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  disabled={viewRow.status === 'Accepted' || viewRow.status === 'Rejected'}
                  onClick={() => { setViewRow(null); setActionTarget({ id: viewRow.id, quotationNo: viewRow.quotationNo, action: 'Accepted' }) }}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={13} /> Accept
                </button>
                <button
                  disabled={viewRow.status === 'Accepted' || viewRow.status === 'Rejected'}
                  onClick={() => { setViewRow(null); setActionTarget({ id: viewRow.id, quotationNo: viewRow.quotationNo, action: 'Rejected' }) }}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Accept / Reject confirmation modal (superadmin) ── */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-[380px]">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${actionTarget.action === 'Accepted' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {actionTarget.action === 'Accepted'
                  ? <CheckCircle size={18} className="text-emerald-500" />
                  : <XCircle size={18} className="text-red-500" />}
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">
                  {actionTarget.action === 'Accepted' ? 'Accept' : 'Reject'} Quotation
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {actionTarget.action === 'Accepted' ? 'Accept' : 'Reject'}{' '}
                  <span className="font-semibold text-slate-700">{actionTarget.quotationNo}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setActionTarget(null)}
                disabled={actionLoading}
                className="px-4 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-lg text-white disabled:opacity-60 transition-colors ${actionTarget.action === 'Accepted' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                {actionTarget.action === 'Accepted' ? 'Accept' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-[360px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Delete Quotation</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Delete <span className="font-semibold text-slate-700">{deleteTarget.quotationNo}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 transition-colors"
              >
                {deleteLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}