import{i as e}from"./chunk-62oNxeRG.js";import{t}from"./download-ywaHf5eC.js";import{t as n}from"./file-chart-column-increasing-CBlqeYS9.js";import{t as r}from"./printer-McHtyvpK.js";import{t as i}from"./trash-2-BFIKtEXP.js";import{E as a,F as o,K as s,N as c,O as l,P as u,R as d,S as f,V as p,a as m,f as h,ft as g,h as _,j as v,n as y,ut as b,v as x,z as S}from"./index-BRlreXhN.js";var C=e(g(),1),w=s(),T=({children:e})=>(0,w.jsx)(`label`,{className:`block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider`,children:e}),E=({type:e=`text`,value:t,onChange:n,placeholder:r,className:i=``})=>(0,w.jsx)(`input`,{type:e,value:t,onChange:n,placeholder:r,className:`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${i}`}),D=({status:e})=>(0,w.jsx)(`span`,{className:`px-2 py-0.5 rounded-full text-[11px] font-semibold ${{Draft:`bg-slate-100 text-slate-600`,Sent:`bg-blue-100 text-blue-700`,Accepted:`bg-emerald-100 text-emerald-700`,Rejected:`bg-red-100 text-red-600`}[e]??`bg-slate-100 text-slate-500`}`,children:e??`—`}),O=e=>e?new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,k=e=>{let t=parseFloat(e);return isNaN(t)?`—`:t.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})},A=e=>{let t=Math.round(parseFloat(e));return isNaN(t)?`—`:t.toLocaleString(`en-IN`)},j=e=>{let t=[``,`One`,`Two`,`Three`,`Four`,`Five`,`Six`,`Seven`,`Eight`,`Nine`,`Ten`,`Eleven`,`Twelve`,`Thirteen`,`Fourteen`,`Fifteen`,`Sixteen`,`Seventeen`,`Eighteen`,`Nineteen`];return e===0?`Zero`:e<20?t[e]:e<100?[``,``,`Twenty`,`Thirty`,`Forty`,`Fifty`,`Sixty`,`Seventy`,`Eighty`,`Ninety`][Math.floor(e/10)]+(e%10?` `+t[e%10]:``):e<1e3?t[Math.floor(e/100)]+` Hundred`+(e%100?` `+j(e%100):``):e<1e5?j(Math.floor(e/1e3))+` Thousand`+(e%1e3?` `+j(e%1e3):``):e<1e7?j(Math.floor(e/1e5))+` Lakh`+(e%1e5?` `+j(e%1e5):``):j(Math.floor(e/1e7))+` Crore`+(e%1e7?` `+j(e%1e7):``)},M=e=>`INR `+j(Math.round(parseFloat(e)||0)).toUpperCase()+` Only`,N=e=>{if(!e)return``;let t=new Date(e);return`${String(t.getDate()).padStart(2,`0`)}-${String(t.getMonth()+1).padStart(2,`0`)}-${t.getFullYear()}`},P=e=>(parseFloat(e)||0).toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2}),ee=async e=>{let t={};try{t=((await h.get(`/api/customer-master`,{skipGlobalLoader:!0})).data?.data??[]).find(t=>t.id===e.customerId)??{}}catch{t={customerName:e.customer?.customerName??``}}let n=parseFloat(e.taxAmount)||0,r=!(e.taxType??``).toUpperCase().includes(`CGST`),i=r?n:0,a=r?0:n/2,o=r?0:n/2,s=[[t.address,t.address2,t.address3,t.address4].filter(Boolean).join(`,
`),[t.city,t.state,t.pinCode].filter(Boolean).join(` - `)].filter(Boolean).join(`,
`),c=e.details??[],l=[];if(c.length<=10)l.push({items:c,isFirst:!0,isLast:!0,max:10});else{l.push({items:c.slice(0,10),isFirst:!0,isLast:!1,max:10});let e=10;for(;e<c.length;){let t=c.slice(e,e+15);e+=15,l.push({items:t,isFirst:!1,isLast:e>=c.length,max:15})}}let u=l.length,d=e.paymentTerms?e.paymentTerms.split(`
`).map(e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`)):[`1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.`,`2. Payment : 100% advance along with PO, before delivery.`,`3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.`,`4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.`],f=(t,n,r)=>t.map((t,r)=>`<tr>
      <td class="c">${n+r+1}</td>
      <td>${[t.itemName,t.partNo].filter(Boolean).join(`  `)}</td>
      <td class="c">${parseFloat(t.taxPercent??e.taxPercent??18).toFixed(2)}</td>
      <td class="c">${t.hsnCode??``}</td>
      <td class="c">${parseFloat(t.qty||0).toFixed(2)}</td>
      <td class="c">${t.uom??``}</td>
      <td class="r">${P(t.unitPrice)}</td>
      <td class="r">${P(t.amount)}</td>
    </tr>`).join(``)+Array(r-t.length).fill(`<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join(``),p=()=>`
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${d.map(e=>`<div class="t-line">${e}</div>`).join(``)}
    </div>`,m=e=>`
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${e} of ${u}${e<u?`&nbsp;&nbsp;&nbsp;Continue(-.)`:``}</span>
      </div>
    </div>`,g=`${window.location.origin}/velson-logo.png`,_=0,v=l.map((n,r)=>{let c=_;_+=n.items.length;let l=n.isFirst?`
      <div class="doc-hdr">
        <img src="${g}" alt="" onerror="this.style.display='none'"/>
        <span class="co-name">VELSON</span>
      </div>
      <div class="doc-title">QUOTATION</div>
      <table class="buyer-tbl"><tbody><tr>
        <td class="buyer-left">
          <div class="b-label">BUYER :</div>
          <div class="b-name">${t.customerName??``}</div>
          <div class="b-addr">${s.replace(/\n/g,`<br>`)}</div>
          <div class="b-row" style="margin-top:5px">Mail ID : ${t.email??``}</div>
          <div class="b-row">Contact Person : ${t.contactPerson??``}</div>
          <div class="b-row">PH : ${t.mobile??t.phone??``}</div>
        </td>
        <td class="date-col">
          <div class="d-row"><span class="d-lbl">Date :</span><span>${N(e.quotationDate)}</span></div>
          <div class="d-row"><span class="d-lbl">Q No :</span><span>${e.quotationNo}</span></div>
          <div class="d-row"><span class="d-lbl">Revision No :</span><span>${e.revisionNo??0}</span></div>
          <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${t.gstNo??``}</span></div>
        </td>
      </tr></tbody></table>`:``,u=n.isLast?`
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
          <div class="t-row"><span class="t-lbl">VALUE :</span><span class="t-val">${P(e.subTotal)}</span></div>
          <div class="t-row"><span class="t-lbl">CGST Amount :</span><span class="t-val">${P(a)}</span></div>
          <div class="t-row"><span class="t-lbl">SGST Amount :</span><span class="t-val">${P(o)}</span></div>
          <div class="t-row"><span class="t-lbl">IGST Amount :</span><span class="t-val">${P(i)}</span></div>
          <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${P(e.freightAmount)}</span></div>
          <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${P(e.packingForwarding)}</span></div>
          <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${P(e.totalAmount)}</span></div>
        </td>
      </tr></tbody></table>
      <div class="words">
        <div class="w-title">Amount chargeable in words</div>
        <div class="w-val">(${M(e.totalAmount)})</div>
      </div>`:``;return`<div class="page${r>0?` brk`:``}">
      ${l}
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
        <tbody>${f(n.items,c,n.max)}</tbody>
      </table>
      ${u}
      ${p()}
      ${m(r+1)}
    </div>`}).join(`
`),y=`<!DOCTYPE html><html><head>
<title>Quotation ${e.quotationNo}</title>
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
${v}
<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`,b=new Blob([y],{type:`text/html;charset=utf-8`}),x=URL.createObjectURL(b);window.open(x,`_blank`,`width=900,height=850`),setTimeout(()=>URL.revokeObjectURL(x),6e4)},te=async e=>{let t={};try{t=((await h.get(`/api/customer-master`,{skipGlobalLoader:!0})).data?.data??[]).find(t=>t.id===e.customerId)??{}}catch{t={customerName:e.customer?.customerName??``}}let n=parseFloat(e.taxAmount)||0,r=parseFloat(e.taxPercent)||18,i=parseFloat(e.subTotal)||0,a=parseFloat(e.freightAmount)||0,o=parseFloat(e.packingForwarding)||0,s=i+a+o,c=!(e.taxType??``).toUpperCase().includes(`CGST`),l=c?n:0,u=c?0:n/2,d=c?0:n/2,f=c?0:r/2,p=c?0:r/2,m=c?r:0,g=[[t.address,t.address2,t.address3,t.address4].filter(Boolean).join(`,
`),[t.city,t.state,t.pinCode].filter(Boolean).join(` - `)].filter(Boolean).join(`,
`),_=e.details??[],v=e.paymentTerms?e.paymentTerms.split(`
`).map(e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`)):[`1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.`,`2. Payment : 100% advance along with PO, before delivery.`,`3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.`,`4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.`],y=()=>`
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${v.map(e=>`<div class="t-line">${e}</div>`).join(``)}
    </div>`,b=e=>`
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${e} of 2${e<2?`&nbsp;&nbsp;&nbsp;Continue(-.)`:``}</span>
      </div>
    </div>`,x=`${window.location.origin}/velson-logo.png`,S=`<thead><tr>
    <th style="width:28px">S.No.</th>
    <th>DESCRIPTION OF GOODS</th>
    <th style="width:46px">TAX %</th>
    <th style="width:68px">HSN Code</th>
    <th style="width:44px">QTY</th>
    <th style="width:38px">UNIT</th>
    <th style="width:76px">RATE IN INR</th>
    <th style="width:76px">VALUE IN INR</th>
  </tr></thead>`,C=_.map((t,n)=>`<tr>
    <td class="c">${n+1}</td>
    <td>${[t.itemName,t.partNo].filter(Boolean).join(`  `)}</td>
    <td class="c">${parseFloat(t.taxPercent??e.taxPercent??18).toFixed(2)}</td>
    <td class="c">${t.hsnCode??``}</td>
    <td class="c">${parseFloat(t.qty||0).toFixed(2)}</td>
    <td class="c">${t.uom??``}</td>
    <td class="r">${P(t.unitPrice)}</td>
    <td class="r">${P(t.amount)}</td>
  </tr>`).join(``),w=Array(15).fill(`<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join(``),T=`<!DOCTYPE html><html><head>
<title>Quotation ${e.quotationNo}</title>
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
    <img src="${x}" alt="" onerror="this.style.display='none'"/>
    <span class="co-name">VELSON</span>
  </div>
  <div class="doc-title">QUOTATION</div>
  <table class="buyer-tbl"><tbody><tr>
    <td class="buyer-left">
      <div class="b-label">BUYER :</div>
      <div class="b-name">${t.customerName??``}</div>
      <div class="b-addr">${g.replace(/\n/g,`<br>`)}</div>
      <div class="b-row">Mail ID : ${t.email??``}</div>
      <div class="b-row">Contact Person : ${t.contactPerson??``}</div>
      <div class="b-row">PH : ${t.mobile??t.phone??``}</div>
      <div class="b-row">GST : 33AKTPM1897L1ZC</div>
    </td>
    <td class="date-col">
      <div class="d-row"><span class="d-lbl">Date :</span><span>${N(e.quotationDate)}</span></div>
      <div class="d-row"><span class="d-lbl">Q No :</span><span>${e.quotationNo}</span></div>
      <div class="d-row"><span class="d-lbl">Revision No :</span><span>${e.revisionNo??0}</span></div>
      <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${t.gstNo??``}</span></div>
    </td>
  </tr></tbody></table>
  <table class="items-tbl">
    ${S}
    <tbody>${C}</tbody>
  </table>
  ${y()}
  ${b(1)}
</div>

<!-- PAGE 2: blank items + bank + totals -->
<div class="page brk">
  <table class="items-tbl">
    ${S}
    <tbody>${w}</tbody>
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
      <div class="t-row"><span class="t-lbl">Sub Total :</span><span class="t-val">${P(i)}</span></div>
      <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${P(a)}</span></div>
      <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${P(o)}</span></div>
      <div class="t-row"><span class="t-lbl">Taxable Value :</span><span class="t-val">${P(s)}</span></div>
      <div class="t-row"><span class="t-lbl">CGST (${f.toFixed(2)}%) :</span><span class="t-val">${P(u)}</span></div>
      <div class="t-row"><span class="t-lbl">SGST (${p.toFixed(2)}%) :</span><span class="t-val">${P(d)}</span></div>
      <div class="t-row"><span class="t-lbl">IGST(${m.toFixed(2)}%) :</span><span class="t-val">${P(l)}</span></div>
      <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${P(e.totalAmount)}</span></div>
    </td>
  </tr></tbody></table>
  <div class="words">
    <div class="w-title">Amount chargeable in words</div>
    <div class="w-val">(${M(e.totalAmount)})</div>
  </div>
  ${y()}
  ${b(2)}
</div>

<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`,E=new Blob([T],{type:`text/html;charset=utf-8`}),D=URL.createObjectURL(E);window.open(D,`_blank`,`width=900,height=850`),setTimeout(()=>URL.revokeObjectURL(D),6e4)},ne=async e=>{let t={};try{t=((await h.get(`/api/customer-master`,{skipGlobalLoader:!0})).data?.data??[]).find(t=>t.id===e.customerId)??{}}catch{t={customerName:e.customer?.customerName??``}}let n=parseFloat(e.taxAmount)||0,r=parseFloat(e.taxPercent)||18,i=parseFloat(e.subTotal)||0,a=parseFloat(e.freightAmount)||0,o=parseFloat(e.packingForwarding)||0,s=i+a+o,c=!(e.taxType??``).toUpperCase().includes(`CGST`),l=c?n:0,u=c?0:n/2,d=c?0:n/2,f=c?0:r/2,p=c?0:r/2,m=c?r:0,g=[[t.address,t.address2,t.address3,t.address4].filter(Boolean).join(`,
`),[t.city,t.state,t.pinCode].filter(Boolean).join(` - `)].filter(Boolean).join(`,
`),_=e.details??[],v=[];if(_.length<=15)v.push({items:_,isFirst:!0,isLast:!0,max:15});else{v.push({items:_.slice(0,15),isFirst:!0,isLast:!1,max:15});let e=15;for(;e<_.length;){let t=_.slice(e,e+17);e+=17,v.push({items:t,isFirst:!1,isLast:e>=_.length,max:17})}}let y=v.length,b=e.paymentTerms?e.paymentTerms.split(`
`).map(e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`)):[`1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.`,`2. Payment : 100% advance along with PO, before delivery.`,`3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.`,`4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.`],x=()=>`
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${b.map(e=>`<div class="t-line">${e}</div>`).join(``)}
    </div>`,S=e=>`
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${e} of ${y}${e<y?`&nbsp;&nbsp;&nbsp;Continue(-.)`:``}</span>
      </div>
    </div>`,C=`${window.location.origin}/velson-logo.png`,w=0,T=v.map((n,r)=>{let c=r+1,h=n.isFirst,_=n.isLast,v=n.items.map(t=>(w++,`<tr>
        <td class="c">${w}</td>
        <td>${[t.itemName,t.partNo].filter(Boolean).join(`  `)}</td>
        <td class="c">${parseFloat(t.taxPercent??e.taxPercent??18).toFixed(2)}</td>
        <td class="c">${t.hsnCode??``}</td>
        <td class="c">${parseFloat(t.qty||0).toFixed(2)}</td>
        <td class="c">${t.uom??``}</td>
        <td class="r">${P(t.unitPrice)}</td>
        <td class="r">${P(t.amount)}</td>
      </tr>`)).join(``),y=_?Math.max(0,15-n.items.length):0,b=Array(y).fill(`<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join(``),T=_?`
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
          <div class="t-row"><span class="t-lbl">Sub Total :</span><span class="t-val">${P(i)}</span></div>
          <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${P(a)}</span></div>
          <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${P(o)}</span></div>
          <div class="t-row"><span class="t-lbl">Taxable Value :</span><span class="t-val">${P(s)}</span></div>
          <div class="t-row"><span class="t-lbl">CGST (${f.toFixed(2)}%) :</span><span class="t-val">${P(u)}</span></div>
          <div class="t-row"><span class="t-lbl">SGST (${p.toFixed(2)}%) :</span><span class="t-val">${P(d)}</span></div>
          <div class="t-row"><span class="t-lbl">IGST(${m.toFixed(2)}%) :</span><span class="t-val">${P(l)}</span></div>
          <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${P(e.totalAmount)}</span></div>
        </td>
      </tr></tbody></table>
      <div class="words">
        <div class="w-title">Amount chargeable in words</div>
        <div class="w-val">(${M(e.totalAmount)})</div>
      </div>`:``,E=h?`
      <div class="doc-hdr">
        <img src="${C}" alt="" onerror="this.style.display='none'"/>
        <span class="co-name">VELSON</span>
      </div>
      <div class="doc-title">QUOTATION</div>
      <table class="buyer-tbl"><tbody><tr>
        <td class="buyer-left">
          <div class="b-label">BUYER :</div>
          <div class="b-name">${t.customerName??``}</div>
          <div class="b-addr">${g.replace(/\n/g,`<br>`)}</div>
          <div class="b-row">Mail ID : ${t.email??``}</div>
          <div class="b-row">Contact Person : ${t.contactPerson??``}</div>
          <div class="b-row">PH : ${t.mobile??t.phone??``}</div>
          <div class="b-row">GST : 33AKTPM1897L1ZC</div>
        </td>
        <td class="date-col">
          <div class="d-row"><span class="d-lbl">Date :</span><span>${N(e.quotationDate)}</span></div>
          <div class="d-row"><span class="d-lbl">Q No :</span><span>${e.quotationNo}</span></div>
          <div class="d-row"><span class="d-lbl">Revision No :</span><span>${e.revisionNo??0}</span></div>
          <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${t.gstNo??``}</span></div>
        </td>
      </tr></tbody></table>`:``;return`
      <div class="page${r>0?` brk`:``}">
        ${E}
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
          <tbody>${v}${b}</tbody>
        </table>
        ${h||_?x():``}
        ${T}
        ${S(c)}
      </div>`}).join(`
`),E=`<!DOCTYPE html><html><head>
<title>Quotation ${e.quotationNo}</title>
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
${T}
<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`,D=new Blob([E],{type:`text/html;charset=utf-8`}),O=URL.createObjectURL(D);window.open(O,`_blank`,`width=900,height=850`),setTimeout(()=>URL.revokeObjectURL(O),6e4)},re=async e=>{let t={};try{t=((await h.get(`/api/customer-master`,{skipGlobalLoader:!0})).data?.data??[]).find(t=>t.id===e.customerId)??{}}catch{t={customerName:e.customer?.customerName??``}}let n=parseFloat(e.taxAmount)||0,r=parseFloat(e.taxPercent)||18,i=parseFloat(e.subTotal)||0,a=parseFloat(e.specialDiscount)||0,o=i-a,s=!(e.taxType??``).toUpperCase().includes(`CGST`),c=s?n:0,l=s?0:n/2,u=s?0:n/2,d=s?0:r/2,f=s?0:r/2,p=s?r:0,m=[[t.address,t.address2,t.address3,t.address4].filter(Boolean).join(`,
`),[t.city,t.state,t.pinCode].filter(Boolean).join(` - `)].filter(Boolean).join(`,
`),g=e.details??[],_=[];if(g.length<=10)_.push({items:g,isFirst:!0,isLast:!0,max:10});else{_.push({items:g.slice(0,10),isFirst:!0,isLast:!1,max:10});let e=10;for(;e<g.length;){let t=g.slice(e,e+15);e+=15,_.push({items:t,isFirst:!1,isLast:e>=g.length,max:15})}}let v=_.length,y=e.paymentTerms?e.paymentTerms.split(`
`).map(e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`)):[`1. GST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: As applicable at the time of delivery.`,`2. Payment : 100% advance along with PO, before delivery.`,`3. Validity &nbsp;&nbsp;: The offer is valid for 30 days from the date of offer.`,`4. Transportation / Insurance : At customer scope, necessary guidance can give by VELSON team.`],b=(t,n,r)=>t.map((t,r)=>`<tr>
      <td class="c">${n+r+1}</td>
      <td>${[t.itemName,t.partNo].filter(Boolean).join(`  `)}</td>
      <td class="c">${parseFloat(t.taxPercent??e.taxPercent??18).toFixed(2)}</td>
      <td class="c">${t.hsnCode??``}</td>
      <td class="c">${parseFloat(t.qty||0).toFixed(2)}</td>
      <td class="c">${t.uom??``}</td>
      <td class="r">${P(t.unitPrice)}</td>
      <td class="r">${P(t.amount)}</td>
    </tr>`).join(``)+Array(r-t.length).fill(`<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join(``),x=()=>`
    <div class="terms">
      <div class="t-title">Terms &amp; Conditions :</div>
      ${y.map(e=>`<div class="t-line">${e}</div>`).join(``)}
    </div>`,S=e=>`
    <div class="pgfoot">
      <div class="pf-line"><strong>Factory :</strong> SF.No 98/3A, Velson Valley, Sankari RS, Nagichettypatti(P.O), Sankari (TK), Salem-637302. Tamilnadu.</div>
      <div class="pf-line"><strong>Website :</strong> www.velson.in &nbsp;&nbsp;<strong>Email - Id :</strong> sales.velson@gmail.com / marketing@velson.in</div>
      <div class="pf-last">
        <span><strong>Contact Details :</strong> 8489339933,7402939955,7402939999</span>
        <span>Page ${e} of ${v}${e<v?`&nbsp;&nbsp;&nbsp;Continue(-.)`:``}</span>
      </div>
    </div>`,C=`${window.location.origin}/velson-logo.png`,w=0,T=_.map((n,r)=>{let s=w;w+=n.items.length;let h=n.isFirst?`
      <div class="doc-hdr">
        <img src="${C}" alt="" onerror="this.style.display='none'"/>
        <span class="co-name">VELSON</span>
      </div>
      <div class="doc-title">QUOTATION</div>
      <table class="buyer-tbl"><tbody><tr>
        <td class="buyer-left">
          <div class="b-label">BUYER :</div>
          <div class="b-name">${t.customerName??``}</div>
          <div class="b-addr">${m.replace(/\n/g,`<br>`)}</div>
          <div class="b-row" style="margin-top:5px">Mail ID : ${t.email??``}</div>
          <div class="b-row">Contact Person : ${t.contactPerson??``}</div>
          <div class="b-row">PH : ${t.mobile??t.phone??``}</div>
        </td>
        <td class="date-col">
          <div class="d-row"><span class="d-lbl">Date :</span><span>${N(e.quotationDate)}</span></div>
          <div class="d-row"><span class="d-lbl">Q No :</span><span>${e.quotationNo}</span></div>
          <div class="d-row"><span class="d-lbl">Revision No :</span><span>${e.revisionNo??0}</span></div>
          <div class="d-row"><span class="d-lbl">GSTIN No :</span><span>${t.gstNo??``}</span></div>
        </td>
      </tr></tbody></table>`:``,g=n.isLast?`
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
          <div class="t-row"><span class="t-lbl">VALUE :</span><span class="t-val">${Math.round(i)}</span></div>
          <div class="t-row"><span class="t-lbl">Dis Amount :</span><span class="t-val">${P(a)}</span></div>
          <div class="t-row sep"><span class="t-lbl">Sub Total :</span><span class="t-val">${P(o)}</span></div>
          <div class="t-row"><span class="t-lbl">Frieght Charge :</span><span class="t-val">${Math.round(parseFloat(e.freightAmount)||0)}</span></div>
          <div class="t-row"><span class="t-lbl">Packing &amp; Forwarding Charge :</span><span class="t-val">${Math.round(parseFloat(e.packingForwarding)||0)}</span></div>
          <div class="t-row"><span class="t-lbl">CGST (${d.toFixed(2)}%) :</span><span class="t-val">${P(l)}</span></div>
          <div class="t-row"><span class="t-lbl">SGST (${f.toFixed(2)}%) :</span><span class="t-val">${P(u)}</span></div>
          <div class="t-row"><span class="t-lbl">IGST(${p.toFixed(2)}%) :</span><span class="t-val">${P(c)}</span></div>
          <div class="t-row grand"><span class="t-lbl">TOAL VALUE :</span><span class="t-val">${P(e.totalAmount)}</span></div>
        </td>
      </tr></tbody></table>
      <div class="words">
        <div class="w-title">Amount chargeable in words</div>
        <div class="w-val">(${M(e.totalAmount)})</div>
      </div>`:``;return`<div class="page${r>0?` brk`:``}">
      ${h}
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
        <tbody>${b(n.items,s,n.max)}</tbody>
      </table>
      ${g}
      ${x()}
      ${S(r+1)}
    </div>`}).join(`
`),E=`<!DOCTYPE html><html><head>
<title>Quotation ${e.quotationNo}</title>
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
${T}
<div style="text-align:center;margin:10px 0">
  <button class="noprint" onclick="window.print()"
    style="padding:7px 22px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold">
    Print / Save PDF
  </button>
</div>
</body></html>`,D=new Blob([E],{type:`text/html;charset=utf-8`}),O=URL.createObjectURL(D);window.open(O,`_blank`,`width=900,height=850`),setTimeout(()=>URL.revokeObjectURL(O),6e4)},ie=e=>{let t=(e.details??[]).map((e,t)=>`
    <tr>
      <td style="text-align:center">${t+1}</td>
      <td>${e.partNo??``}</td>
      <td>${e.itemName??``}</td>
      <td>${e.description??``}</td>
      <td style="text-align:center">${e.qty??``}</td>
      <td style="text-align:right">${e.unitPrice??``}</td>
      <td style="text-align:right">${e.amount??``}</td>
    </tr>`).join(``),n=`<!DOCTYPE html><html><head><title>Quotation ${e.quotationNo}</title>
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
  <p class="sub">${e.quotationNo} &nbsp;|&nbsp; Rev: ${e.revisionNo??0} &nbsp;|&nbsp; ${O(e.quotationDate)}</p>
  <div class="grid">
    <div>
      <div class="kv"><strong>Customer:</strong> ${e.customer?.customerName??`—`}</div>
      <div class="kv"><strong>Status:</strong> ${e.status??`—`}</div>
      <div class="kv"><strong>Currency:</strong> ${e.currencyCode??`INR`}</div>
    </div>
    <div>
      <div class="kv"><strong>Tax Type:</strong> ${e.taxType??`—`}</div>
      <div class="kv"><strong>Valid Until:</strong> ${O(e.validUntil)}</div>
      <div class="kv"><strong>Model Ref:</strong> ${e.modelRef??`—`}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width:30px">#</th><th>Part No</th><th>Item Name</th>
      <th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th>
    </tr></thead>
    <tbody>${t||`<tr><td colspan="7" style="text-align:center;color:#888">No items</td></tr>`}</tbody>
  </table>
  <div class="totals">
    <div>Sub Total: <strong>${k(e.subTotal)}</strong></div>
    <div>Special Discount: <strong>${k(e.specialDiscount)}</strong></div>
    <div>Freight: <strong>${k(e.freightAmount)}</strong></div>
    <div>Tax (${e.taxPercent??0}%): <strong>${k(e.taxAmount)}</strong></div>
    <div class="grand">Grand Total: ${A(e.totalAmount)}</div>
  </div>
  ${e.paymentTerms?`<div style="margin-top:16px;font-size:11px;color:#555"><strong>Payment Terms:</strong><br>${e.paymentTerms.replace(/\n/g,`<br>`)}</div>`:``}
  <br><button onclick="window.print()" style="padding:6px 18px;background:#0097A7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">Print / Save PDF</button>
  </body></html>`,r=new Blob([n],{type:`text/html;charset=utf-8`}),i=URL.createObjectURL(r);window.open(i,`_blank`,`width=850,height=700`),setTimeout(()=>URL.revokeObjectURL(i),6e4)},ae=e=>{let t=[[`Quotation No`,`Date`,`Status`,`Customer`,`Currency`,`Sub Total`,`Tax %`,`Tax Amount`,`Total Amount`].join(`,`),...e.map(e=>[e.quotationNo,e.quotationDate?new Date(e.quotationDate).toLocaleDateString(`en-IN`):``,e.status??``,e.customer?.customerName??``,e.currencyCode??``,e.subTotal??``,e.taxPercent??``,e.taxAmount??``,e.totalAmount??``].map(e=>`"${String(e).replace(/"/g,`""`)}"`).join(`,`))],n=new Blob([t.join(`
`)],{type:`text/csv;charset=utf-8;`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`quotations_${new Date().toISOString().slice(0,10)}.csv`,i.click(),URL.revokeObjectURL(r)};function oe(){let e=m(),s=b(),[g,j]=(0,C.useState)(``),[M,N]=(0,C.useState)(``),[P,oe]=(0,C.useState)(``),[F,se]=(0,C.useState)(``),[ce,le]=(0,C.useState)(`Standard`),[I,L]=(0,C.useState)([]),[R,z]=(0,C.useState)(!1),[B,V]=(0,C.useState)(null),[H,U]=(0,C.useState)(null),[W,ue]=(0,C.useState)(!1),[G,K]=(0,C.useState)(null),[q,de]=(0,C.useState)(!1),[J,Y]=(0,C.useState)(null),[X,Z]=(0,C.useState)(null),Q=(0,C.useRef)(null);(0,C.useEffect)(()=>{if(!X)return;let e=e=>{Q.current&&!Q.current.contains(e.target)&&Z(null)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[X]);let fe=(0,C.useCallback)(async()=>{z(!0),V(null);try{let e=(await h.get(`/api/quotation-master`,{skipGlobalLoader:!0})).data?.data??[];g&&(e=e.filter(e=>e.quotationDate&&e.quotationDate.slice(0,10)>=g)),M&&(e=e.filter(e=>e.quotationDate&&e.quotationDate.slice(0,10)<=M)),P.trim()&&(e=e.filter(e=>e.quotationNo?.toLowerCase().includes(P.trim().toLowerCase()))),F&&(e=e.filter(e=>e.status===F)),L(e)}catch(e){console.error(`[QuotationDetails] fetch error:`,e),V(`Failed to load quotations.`)}finally{z(!1)}},[g,M,P,F]);(0,C.useEffect)(()=>{fe()},[]);let pe=async()=>{if(H){ue(!0);try{await h.delete(`/api/quotation-master/${H.id}`,{loadingMessage:`Deleting quotation...`}),L(e=>e.filter(e=>e.id!==H.id)),e.success(`Quotation ${H.quotationNo} deleted.`),U(null)}catch(t){e.error(`Delete failed: `+(t.response?.data?.message||t.message))}finally{ue(!1)}}},me=e=>{s(`/quotation/quotation-entry`,{state:{editData:e,mode:e.status===`Accepted`?`revision`:`edit`}})},he=async()=>{if(G){de(!0);try{let t=I.find(e=>e.id===G.id)??{},n={customerRef:t.customerRef??null,currencyCode:t.currencyCode??`INR`,exchangeRate:t.exchangeRate??1,modelRef:t.modelRef??null,taxType:t.taxType??null,quotationDate:t.quotationDate??null,validUntil:t.validUntil??null,revisionNo:t.revisionNo??0,quotationType:t.quotationType??null,discountType:t.discountType??`Dis_Per`,showTotalsGrid:t.showTotalsGrid??!1,specialDiscount:t.specialDiscount??0,freightAmount:t.freightAmount??0,taxPercent:t.taxPercent??18,packingForwarding:t.packingForwarding??0,subTotal:t.subTotal??0,taxAmount:t.taxAmount??0,totalAmount:t.totalAmount??0,paymentTerms:t.paymentTerms??null,status:G.action,items:t.details??[]};await h.put(`/api/quotation-master/${G.id}`,n,{loadingMessage:`Updating quotation...`}),L(e=>e.map(e=>e.id===G.id?{...e,status:G.action}:e)),e.success(`Quotation ${G.quotationNo} ${G.action.toLowerCase()}.`),K(null)}catch(t){e.error(`Action failed: `+(t.response?.data?.message||t.message))}finally{de(!1)}}},$=[{label:`Quotation Number`,w:`w-40`},{label:`Quotation Date`,w:`w-36`},{label:`Status`,w:`w-32`},{label:`Customer Name`,w:`w-64`},{label:`Total Amount`,w:`w-36`},{label:`View`,w:`w-16`},{label:`RPT`,w:`w-16`},{label:`PDF`,w:`w-16`},{label:`Edit`,w:`w-16`},{label:`Delete`,w:`w-16`}];return(0,w.jsxs)(`div`,{className:`bg-[#f4f6f8] min-h-full`,children:[(0,w.jsxs)(`div`,{className:`px-6 py-6`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-2 text-[12px] text-slate-400 mb-5`,children:[(0,w.jsx)(`span`,{className:`hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest`,children:`Sales`}),(0,w.jsx)(p,{className:`w-3 h-3`}),(0,w.jsx)(`span`,{className:`text-[#0097A7] font-semibold uppercase tracking-widest`,children:`Quotation Details`})]}),(0,w.jsxs)(`div`,{className:`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]`,children:[(0,w.jsxs)(`div`,{className:`flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,w.jsx)(`div`,{className:`w-3.5 h-3.5 bg-red-700 rounded-sm`}),(0,w.jsx)(`h2`,{className:`text-[14px] font-black text-slate-800 uppercase tracking-tight`,children:`Quotation Details`})]}),(0,w.jsxs)(`button`,{onClick:()=>onNavigate?.(`Dashboard`),className:`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md transition-all shadow-sm`,children:[(0,w.jsx)(`div`,{className:`w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center`,children:(0,w.jsx)(_,{size:10,className:`text-white`,strokeWidth:3})}),`Close`]})]}),(0,w.jsxs)(`div`,{className:`p-5 flex-1 flex flex-col`,children:[(0,w.jsx)(`div`,{className:`flex items-end justify-between gap-4 mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100`,children:(0,w.jsxs)(`div`,{className:`flex items-end gap-4 w-full flex-wrap`,children:[(0,w.jsxs)(`div`,{className:`flex-1 min-w-[130px]`,children:[(0,w.jsx)(T,{children:`From Date`}),(0,w.jsx)(E,{type:`date`,value:g,onChange:e=>j(e.target.value),className:`w-full`})]}),(0,w.jsxs)(`div`,{className:`flex-1 min-w-[130px]`,children:[(0,w.jsx)(T,{children:`To Date`}),(0,w.jsx)(E,{type:`date`,value:M,onChange:e=>N(e.target.value),className:`w-full`})]}),(0,w.jsxs)(`div`,{className:`flex-1 min-w-[130px]`,children:[(0,w.jsx)(T,{children:`PDF Format`}),(0,w.jsxs)(`select`,{value:ce,onChange:e=>le(e.target.value),className:`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 w-full focus:outline-none focus:border-[#0097A7]`,children:[(0,w.jsx)(`option`,{children:`Standard`}),(0,w.jsx)(`option`,{children:`Detailed`})]})]}),(0,w.jsxs)(`div`,{className:`flex-1 min-w-[150px]`,children:[(0,w.jsx)(T,{children:`Quotation Number`}),(0,w.jsx)(E,{placeholder:`Enter Quote No`,value:P,onChange:e=>oe(e.target.value),className:`w-full`})]}),(0,w.jsxs)(`div`,{className:`flex-1 min-w-[130px]`,children:[(0,w.jsx)(T,{children:`Quotation Status`}),(0,w.jsxs)(`select`,{value:F,onChange:e=>se(e.target.value),className:`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 w-full focus:outline-none focus:border-[#0097A7]`,children:[(0,w.jsx)(`option`,{value:``,children:`-- All --`}),(0,w.jsx)(`option`,{value:`Draft`,children:`Draft`}),(0,w.jsx)(`option`,{value:`Sent`,children:`Sent`}),(0,w.jsx)(`option`,{value:`Accepted`,children:`Accepted`}),(0,w.jsx)(`option`,{value:`Rejected`,children:`Rejected`})]})]}),(0,w.jsxs)(`button`,{onClick:fe,disabled:R,className:`flex items-center justify-center gap-2 px-8 py-2 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-60 text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 h-[38px] min-w-[120px]`,children:[R?(0,w.jsx)(l,{size:14,className:`animate-spin`}):null,`Search`]})]})}),(0,w.jsxs)(`div`,{className:`flex items-center justify-end gap-5 mb-4 px-2 text-slate-500`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-1.5 border-r border-slate-200 pr-5`,children:[(0,w.jsx)(`span`,{className:`text-[11px] font-bold`,children:`LS`}),(0,w.jsx)(`span`,{className:`text-[12px] font-black text-[#0097A7]`,children:I.length})]}),(0,w.jsxs)(`button`,{className:`flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group`,title:`Dos`,children:[(0,w.jsx)(t,{size:16}),(0,w.jsx)(`span`,{className:`text-[11px] font-bold group-hover:text-[#0097A7]`,children:`Dos`})]}),(0,w.jsxs)(`button`,{onClick:()=>ae(I),disabled:I.length===0,className:`flex items-center gap-1.5 hover:text-emerald-600 transition-colors group disabled:opacity-40`,title:`Export Excel/CSV`,children:[(0,w.jsx)(u,{size:16}),(0,w.jsx)(`span`,{className:`text-[11px] font-bold group-hover:text-emerald-600`,children:`Excel`})]}),(0,w.jsxs)(`button`,{className:`flex items-center gap-1.5 hover:text-rose-600 transition-colors group`,title:`Pdf`,children:[(0,w.jsx)(c,{size:16}),(0,w.jsx)(`span`,{className:`text-[11px] font-bold group-hover:text-rose-600`,children:`Pdf`})]}),(0,w.jsxs)(`button`,{className:`flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group`,title:`Filter`,children:[(0,w.jsx)(v,{size:16}),(0,w.jsx)(`span`,{className:`text-[11px] font-bold group-hover:text-[#0097A7]`,children:`Filter`})]}),(0,w.jsxs)(`button`,{className:`flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group`,title:`Setting`,children:[(0,w.jsx)(f,{size:16}),(0,w.jsx)(`span`,{className:`text-[11px] font-bold group-hover:text-[#0097A7]`,children:`Setting`})]})]}),(0,w.jsx)(`div`,{className:`flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm`,children:(0,w.jsxs)(`table`,{className:`w-full text-left border-collapse min-w-full bg-white`,children:[(0,w.jsx)(`thead`,{className:`bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300`,children:(0,w.jsx)(`tr`,{children:$.map((e,t)=>(0,w.jsx)(`th`,{className:`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${e.w}`,children:e.label},t))})}),(0,w.jsx)(`tbody`,{className:`divide-y divide-slate-100 text-[12px]`,children:R?(0,w.jsx)(`tr`,{children:(0,w.jsx)(`td`,{colSpan:$.length,className:`py-8`,children:(0,w.jsx)(y,{message:`Loading quotations…`})})}):B?(0,w.jsx)(`tr`,{children:(0,w.jsx)(`td`,{colSpan:$.length,className:`text-center py-16 text-red-400 text-[13px]`,children:B})}):I.length===0?(0,w.jsx)(`tr`,{children:(0,w.jsx)(`td`,{colSpan:$.length,className:`text-center py-16 text-slate-400 text-[13px]`,children:`No records found.`})}):I.map((e,t)=>(0,w.jsxs)(`tr`,{className:`h-10 hover:bg-[#f0f9fa]/60 transition-colors ${t%2==1?`bg-slate-50/40`:``}`,children:[(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 font-medium text-[#0097A7] whitespace-nowrap`,children:e.quotationNo}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 whitespace-nowrap`,children:O(e.quotationDate)}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100`,children:(0,w.jsx)(D,{status:e.status})}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100`,children:e.customer?.customerName??`—`}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 text-right font-medium tabular-nums`,children:k(e.totalAmount)}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 text-center`,children:(0,w.jsx)(`button`,{onClick:()=>Y(e),className:`p-1.5 rounded hover:bg-cyan-50 text-slate-500 hover:text-[#0097A7] transition-colors`,title:`View quotation`,children:(0,w.jsx)(o,{size:14})})}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 text-center`,children:(0,w.jsx)(`button`,{onClick:()=>ie(e),className:`p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-[#0097A7] transition-colors`,title:`Print report`,children:(0,w.jsx)(r,{size:14})})}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 text-center`,children:(0,w.jsxs)(`div`,{ref:X===e.id?Q:null,className:`relative inline-block`,children:[(0,w.jsx)(`button`,{onClick:t=>{t.stopPropagation(),Z(X===e.id?null:e.id)},className:`p-1.5 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors`,title:`PDF`,children:(0,w.jsx)(c,{size:14})}),X===e.id&&(0,w.jsx)(`div`,{className:`absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-xl w-32 py-1 text-left`,children:[{label:`Format 1`,fn:()=>ee(e)},{label:`Format 2`,fn:()=>re(e)},{label:`Format 3`,fn:()=>te(e)},{label:`Format 4`,fn:()=>ne(e)}].map(({label:e,fn:t})=>(0,w.jsx)(`button`,{onClick:()=>{t(),Z(null)},className:`w-full px-3 py-1.5 text-[12px] text-slate-600 hover:bg-[#f0f9fa] hover:text-[#0097A7] transition-colors`,children:e},e))})]})}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 text-center`,children:(0,w.jsx)(`button`,{onClick:()=>me(e),className:`p-1.5 rounded hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors`,title:`Revise & edit`,children:(0,w.jsx)(a,{size:14})})}),(0,w.jsx)(`td`,{className:`px-3 py-2 border-r border-slate-100 text-center`,children:(0,w.jsx)(`button`,{onClick:()=>U({id:e.id,quotationNo:e.quotationNo}),className:`p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors`,title:`Delete`,children:(0,w.jsx)(i,{size:14})})})]},e.id))})]})}),(0,w.jsxs)(`div`,{className:`mt-4 flex items-center justify-between px-2`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity cursor-default`,children:[(0,w.jsx)(n,{size:14,className:`text-[#0097A7]`}),(0,w.jsx)(`span`,{className:`text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic`,children:`Quotation Audit & Estimation Analysis Console`})]}),(0,w.jsxs)(`div`,{className:`text-[10px] font-bold text-slate-400 uppercase tracking-widest`,children:[`Records: `,(0,w.jsx)(`span`,{className:`text-[#0097A7]`,children:I.length})]})]})]})]})]}),J&&(0,w.jsx)(`div`,{className:`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4`,children:(0,w.jsxs)(`div`,{className:`bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col`,children:[(0,w.jsxs)(`div`,{className:`flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0`,children:[(0,w.jsxs)(`div`,{children:[(0,w.jsx)(`p`,{className:`text-[14px] font-black text-slate-800 uppercase tracking-tight`,children:J.quotationNo}),(0,w.jsxs)(`p`,{className:`text-[11px] text-slate-400 mt-0.5`,children:[`Rev: `,J.revisionNo??0,` \xA0|\xA0 `,O(J.quotationDate)]})]}),(0,w.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,w.jsx)(D,{status:J.status}),(0,w.jsx)(`button`,{onClick:()=>Y(null),className:`p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors`,children:(0,w.jsx)(_,{size:16})})]})]}),(0,w.jsxs)(`div`,{className:`overflow-y-auto flex-1 px-5 py-4 space-y-4`,children:[(0,w.jsxs)(`div`,{className:`grid grid-cols-2 gap-x-8 gap-y-2 text-[12px]`,children:[(0,w.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Customer`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:J.customer?.customerName??`—`})]}),(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Currency`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:J.currencyCode??`INR`})]}),(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Model Ref`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:J.modelRef??`—`})]}),(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Customer Ref`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:J.customerRef??`—`})]})]}),(0,w.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Tax Type`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:J.taxType??`—`})]}),(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Valid Until`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:O(J.validUntil)})]}),(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Quotation Type`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:J.quotationType??`—`})]}),(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsx)(`span`,{className:`text-slate-400 w-28 shrink-0`,children:`Exchange Rate`}),(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:J.exchangeRate??`—`})]})]})]}),(0,w.jsx)(`div`,{className:`border border-slate-200 rounded-lg overflow-hidden`,children:(0,w.jsxs)(`table`,{className:`w-full text-left border-collapse text-[11.5px]`,children:[(0,w.jsx)(`thead`,{className:`bg-slate-100 text-slate-500 uppercase font-bold`,children:(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`th`,{className:`px-3 py-2 border-r border-slate-200 w-8`,children:`#`}),(0,w.jsx)(`th`,{className:`px-3 py-2 border-r border-slate-200`,children:`Part No`}),(0,w.jsx)(`th`,{className:`px-3 py-2 border-r border-slate-200`,children:`Item Name`}),(0,w.jsx)(`th`,{className:`px-3 py-2 border-r border-slate-200`,children:`Description`}),(0,w.jsx)(`th`,{className:`px-3 py-2 border-r border-slate-200 text-center w-14`,children:`Qty`}),(0,w.jsx)(`th`,{className:`px-3 py-2 border-r border-slate-200 text-right w-24`,children:`Unit Price`}),(0,w.jsx)(`th`,{className:`px-3 py-2 text-right w-24`,children:`Amount`})]})}),(0,w.jsx)(`tbody`,{className:`divide-y divide-slate-100`,children:(J.details??[]).length===0?(0,w.jsx)(`tr`,{children:(0,w.jsx)(`td`,{colSpan:7,className:`text-center py-6 text-slate-400`,children:`No items`})}):(J.details??[]).map((e,t)=>(0,w.jsxs)(`tr`,{className:t%2==1?`bg-slate-50/50`:``,children:[(0,w.jsx)(`td`,{className:`px-3 py-1.5 border-r border-slate-100 text-center text-slate-400`,children:t+1}),(0,w.jsx)(`td`,{className:`px-3 py-1.5 border-r border-slate-100 font-medium text-[#0097A7]`,children:e.partNo??`—`}),(0,w.jsx)(`td`,{className:`px-3 py-1.5 border-r border-slate-100`,children:e.itemName??`—`}),(0,w.jsx)(`td`,{className:`px-3 py-1.5 border-r border-slate-100 text-slate-500`,children:e.description??`—`}),(0,w.jsx)(`td`,{className:`px-3 py-1.5 border-r border-slate-100 text-center`,children:e.qty??`—`}),(0,w.jsx)(`td`,{className:`px-3 py-1.5 border-r border-slate-100 text-right tabular-nums`,children:k(e.unitPrice)}),(0,w.jsx)(`td`,{className:`px-3 py-1.5 text-right tabular-nums font-medium`,children:k(e.amount)})]},t))})]})}),(0,w.jsx)(`div`,{className:`flex justify-end`,children:(0,w.jsxs)(`div`,{className:`w-64 space-y-1 text-[12px]`,children:[(0,w.jsxs)(`div`,{className:`flex justify-between text-slate-500`,children:[(0,w.jsx)(`span`,{children:`Sub Total`}),(0,w.jsx)(`span`,{className:`tabular-nums`,children:k(J.subTotal)})]}),(0,w.jsxs)(`div`,{className:`flex justify-between text-slate-500`,children:[(0,w.jsx)(`span`,{children:`Special Discount`}),(0,w.jsx)(`span`,{className:`tabular-nums`,children:k(J.specialDiscount)})]}),(0,w.jsxs)(`div`,{className:`flex justify-between text-slate-500`,children:[(0,w.jsx)(`span`,{children:`Freight`}),(0,w.jsx)(`span`,{className:`tabular-nums`,children:k(J.freightAmount)})]}),(0,w.jsxs)(`div`,{className:`flex justify-between text-slate-500`,children:[(0,w.jsxs)(`span`,{children:[`Tax (`,J.taxPercent??0,`%)`]}),(0,w.jsx)(`span`,{className:`tabular-nums`,children:k(J.taxAmount)})]}),(0,w.jsxs)(`div`,{className:`flex justify-between font-black text-[13px] text-[#0097A7] border-t border-slate-200 pt-1.5 mt-1`,children:[(0,w.jsx)(`span`,{children:`Grand Total`}),(0,w.jsx)(`span`,{className:`tabular-nums`,children:A(J.totalAmount)})]})]})}),J.paymentTerms&&(0,w.jsxs)(`div`,{className:`bg-slate-50 rounded-lg p-3 text-[11.5px] text-slate-600 border border-slate-100`,children:[(0,w.jsx)(`p`,{className:`font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1`,children:`Payment Terms`}),(0,w.jsx)(`p`,{className:`whitespace-pre-wrap`,children:J.paymentTerms})]})]}),(0,w.jsxs)(`div`,{className:`px-5 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/60`,children:[(0,w.jsx)(`button`,{onClick:()=>Y(null),className:`px-4 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors`,children:`Close`}),(0,w.jsxs)(`div`,{className:`flex gap-2`,children:[(0,w.jsxs)(`button`,{disabled:J.status===`Accepted`||J.status===`Rejected`,onClick:()=>{Y(null),K({id:J.id,quotationNo:J.quotationNo,action:`Accepted`})},className:`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed`,children:[(0,w.jsx)(S,{size:13}),` Accept`]}),(0,w.jsxs)(`button`,{disabled:J.status===`Accepted`||J.status===`Rejected`,onClick:()=>{Y(null),K({id:J.id,quotationNo:J.quotationNo,action:`Rejected`})},className:`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed`,children:[(0,w.jsx)(d,{size:13}),` Reject`]})]})]})]})}),G&&(0,w.jsx)(`div`,{className:`fixed inset-0 z-50 flex items-center justify-center bg-black/40`,children:(0,w.jsxs)(`div`,{className:`bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-[380px]`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-3 mb-4`,children:[(0,w.jsx)(`div`,{className:`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${G.action===`Accepted`?`bg-emerald-50`:`bg-red-50`}`,children:G.action===`Accepted`?(0,w.jsx)(S,{size:18,className:`text-emerald-500`}):(0,w.jsx)(d,{size:18,className:`text-red-500`})}),(0,w.jsxs)(`div`,{children:[(0,w.jsxs)(`p`,{className:`text-[13px] font-bold text-slate-800`,children:[G.action===`Accepted`?`Accept`:`Reject`,` Quotation`]}),(0,w.jsxs)(`p`,{className:`text-[12px] text-slate-500 mt-0.5`,children:[G.action===`Accepted`?`Accept`:`Reject`,` `,(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:G.quotationNo}),`? This cannot be undone.`]})]})]}),(0,w.jsxs)(`div`,{className:`flex gap-2 justify-end`,children:[(0,w.jsx)(`button`,{onClick:()=>K(null),disabled:q,className:`px-4 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors`,children:`Cancel`}),(0,w.jsxs)(`button`,{onClick:he,disabled:q,className:`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-lg text-white disabled:opacity-60 transition-colors ${G.action===`Accepted`?`bg-emerald-500 hover:bg-emerald-600`:`bg-red-500 hover:bg-red-600`}`,children:[q?(0,w.jsx)(l,{size:13,className:`animate-spin`}):null,G.action===`Accepted`?`Accept`:`Reject`]})]})]})}),H&&(0,w.jsx)(`div`,{className:`fixed inset-0 z-50 flex items-center justify-center bg-black/40`,children:(0,w.jsxs)(`div`,{className:`bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-[360px]`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-3 mb-4`,children:[(0,w.jsx)(`div`,{className:`w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0`,children:(0,w.jsx)(x,{size:18,className:`text-red-500`})}),(0,w.jsxs)(`div`,{children:[(0,w.jsx)(`p`,{className:`text-[13px] font-bold text-slate-800`,children:`Delete Quotation`}),(0,w.jsxs)(`p`,{className:`text-[12px] text-slate-500 mt-0.5`,children:[`Delete `,(0,w.jsx)(`span`,{className:`font-semibold text-slate-700`,children:H.quotationNo}),`? This cannot be undone.`]})]})]}),(0,w.jsxs)(`div`,{className:`flex gap-2 justify-end`,children:[(0,w.jsx)(`button`,{onClick:()=>U(null),disabled:W,className:`px-4 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors`,children:`Cancel`}),(0,w.jsxs)(`button`,{onClick:pe,disabled:W,className:`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 transition-colors`,children:[W?(0,w.jsx)(l,{size:13,className:`animate-spin`}):null,`Delete`]})]})]})})]})}export{oe as default};