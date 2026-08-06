import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";import{n as t,t as n}from"./jsx-runtime-BpzPEenQ.js";import{t as r}from"./pen-BghUX_6X.js";import{t as i}from"./printer-BSA-TX74.js";import{t as a}from"./trash-2-CqgJufr2.js";import{t as o}from"./api-CLiRfOMY.js";import{A as s,O as c,a as l,f as u,j as d,y as f}from"./index-gZsX2s7s.js";import{i as p,n as m}from"./xlsx-Bw96lTQ6.js";var h=e(t(),1),g=n(),_=({children:e})=>(0,g.jsx)(`label`,{className:`block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap`,children:e}),v=({options:e,value:t,onChange:n,className:r=``})=>(0,g.jsxs)(`div`,{className:`relative ${r}`,children:[(0,g.jsx)(`select`,{value:t,onChange:n,className:`w-full px-2 py-0.5 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all cursor-pointer font-bold`,children:e.map(e=>(0,g.jsx)(`option`,{value:e,children:e},e))}),(0,g.jsx)(`div`,{className:`pointer-events-none absolute inset-y-0 right-1 flex items-center`,children:(0,g.jsx)(`svg`,{className:`w-3 h-3 text-slate-400`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,children:(0,g.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:3,d:`M19 9l-7 7-7-7`})})})]}),y=({children:e,onClick:t,className:n=``,color:r=`slate`})=>(0,g.jsx)(`button`,{onClick:t,className:`flex items-center gap-1 px-3 py-1 border border-slate-200 bg-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 ${{slate:`text-slate-600 hover:bg-slate-50`,emerald:`text-emerald-600 hover:bg-emerald-50`,rose:`text-rose-600 hover:bg-rose-50`,teal:`text-[#0097A7] hover:bg-[#f0f9fa]`}[r]} ${n}`,children:e}),b=({children:e,onClick:t,className:n=``,icon:r=null})=>(0,g.jsxs)(`button`,{onClick:t,className:`flex items-center gap-1.5 px-3 py-1 bg-[#f8fafc] border border-slate-300 hover:border-[#0097A7] text-slate-700 text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap ${n}`,children:[r===`dot`&&(0,g.jsx)(`div`,{className:`w-2.5 h-2.5 bg-red-600 rounded-full`}),r===`printer`&&(0,g.jsx)(i,{size:14,className:`text-slate-400`}),e]}),x=e=>{if(!e)return`—`;let t=new Date(e);return isNaN(t.getTime())?`—`:`${String(t.getDate()).padStart(2,`0`)}-${[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`][t.getMonth()]}-${t.getFullYear()}`},S=e=>{if(!e)return null;let t=e.split(`-`);if(t.length!==3)return null;let n=parseInt(t[0],10),r=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`].indexOf(t[1]),i=parseInt(t[2],10);return r===-1||isNaN(n)||isNaN(i)?null:new Date(i,r,n)};function C(){let[e,t]=(0,h.useState)([]),[n,C]=(0,h.useState)([]),[w,T]=(0,h.useState)(``),[E,D]=(0,h.useState)(``),[O,k]=(0,h.useState)([]),[A,j]=(0,h.useState)(!0),[M,N]=(0,h.useState)(null),P=l(),F=()=>e.find(e=>String(e.id||e.dcNo)===String(M)),I=()=>{let e=F();if(!e){P.warning(`Select a DC row first to edit.`);return}P.info(`Editing is not available in this view yet for DC #${e.dcNo}.`)},L=()=>{let e=F();if(!e){P.warning(`Select a DC row first to delete.`);return}P.info(`Delete is not available in this view yet for DC #${e.dcNo}.`)},R=()=>{window.print()},z=()=>{let e=F();if(!e){P.warning(`Select a DC row first to view details.`);return}J(e)},B=e=>{let t=F();if(!t){P.warning(`Select a DC row first to open PDF ${e}.`);return}P.info(`Preparing PDF ${e} for DC #${t.dcNo}.`),J(t)},V=()=>{if(O.length===0){P.warning(`No records to export.`);return}let e=O.map((e,t)=>({"S.No":t+1,"DC No":e.dcNo||``,"DC Date":x(e.date),"DC Type":e.dcType||``,"Customer Name":e.partyName||``,"Contact Person":e.contPerson||``,"Contact No":e.contactNo||``,"Total Qty":e.totalQty||0,"Total Amount":e.totalAmount||0,"Vehicle No":e.vehicleNo||``,"Driver Name":e.driverName||``,"Despatch Through":e.desThrough||``})),t=m.json_to_sheet(e),n=m.book_new();m.book_append_sheet(n,t,`DC Details`);let r=p(n,{bookType:`xlsx`,type:`array`}),i=new Blob([r],{type:`application/octet-stream`}),a=URL.createObjectURL(i),o=`dc_details_${new Date().toISOString().split(`T`)[0]}.xlsx`,s=window.open(``,`_blank`,`width=1100,height=750`);if(!s){P.error(`Unable to open preview tab. Please allow popups for this site.`),URL.revokeObjectURL(a);return}let c=e.map(e=>`
      <tr>
        ${Object.values(e).map(e=>`<td>${String(e)}</td>`).join(``)}
      </tr>
    `).join(``),l=Object.keys(e[0]).map(e=>`<th class="px-3 py-2 border bg-slate-100 text-left text-xs text-slate-600">${e}</th>`).join(``);s.document.write(`
      <html>
        <head>
          <title>DC Details Excel Preview</title>
          <style>
            body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #f8fafc; }
            .preview-shell { max-width: 1440px; margin: 0 auto; }
            .preview-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
            .preview-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
            .preview-note { color: #475569; font-size: 0.92rem; }
            .download-button { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.2rem; background: #059669; color: white; border-radius: 0.75rem; text-decoration: none; font-weight: 700; box-shadow: 0 6px 16px rgba(5, 150, 105, 0.12); }
            .download-button:hover { background: #047857; }
            .preview-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
            .preview-table th, .preview-table td { border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 0.92rem; }
            .preview-table th { background: #f8fafc; color: #475569; text-transform: uppercase; letter-spacing: 0.02em; }
            .preview-table tr:nth-child(even) { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="preview-shell">
            <div class="preview-header">
              <div>
                <div class="preview-title">Delivery Challan Excel Preview</div>
                <div class="preview-note">Preview the data first, then click Download Excel to save the file.</div>
              </div>
              <a class="download-button" href="${a}" download="${o}">Download Excel</a>
            </div>
            <table class="preview-table">
              <thead>
                <tr>${l}</tr>
              </thead>
              <tbody>
                ${c}
              </tbody>
            </table>
          </div>
          <script>
            window.addEventListener('unload', function() {
              try { URL.revokeObjectURL('${a}') } catch (e) { }
            })
          <\/script>
        </body>
      </html>
    `),s.document.close(),P.success(`Excel preview opened in a new tab.`)},H=()=>{if(O.length===0){P.warning(`No records to print.`);return}window.print()},U=()=>{P.info(`DOS export is not available in this version.`)},W=()=>{P.info(`Use the From Date and To Date dropdowns above to filter results.`)},G=()=>{P.info(`No additional settings are available in this view.`)},K=e=>{let t=String(e.id||e.dcNo||``);N(e=>e===t?null:t)};(0,h.useEffect)(()=>{(async()=>{try{let e=await o.get(`/api/delivery-challan`);if(e.data?.success){let n=e.data.data||[];t(n);let r={};n.forEach(e=>{let t=x(e.date);t&&t!==`—`&&(r[t]=new Date(e.date).getTime())});let i=Object.keys(r).sort((e,t)=>r[e]-r[t]);C(i),i.length>0&&(T(i[0]),D(i[i.length-1]))}}catch(e){console.error(`Error fetching DC details:`,e)}finally{j(!1)}})()},[]);let q=()=>{let t=S(w),n=S(E),r=e.filter(e=>{let r=new Date(e.date);return r.setHours(0,0,0,0),!(t&&r<t||n&&r>n)});k(r)};(0,h.useEffect)(()=>{e.length>0?q():k([])},[e,w,E]);let J=e=>{if(!e)return;let t=window.open(``,`_blank`,`width=900,height=800`);if(!t)return;let n=(e.details||[]).map((e,t)=>`
      <tr>
        <td style="text-align: center;">${t+1}</td>
        <td><b>${e.partNo||`—`}</b></td>
        <td>${e.partName||`—`}</td>
        <td>${e.spec||e.details||`—`}</td>
        <td style="text-align: right; font-weight: bold;">${e.qty||0}</td>
        <td style="text-align: center;">${e.uom||e.unit||`—`}</td>
        <td style="text-align: right;">₹${Number(e.rate||0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold;">₹${Number(e.amount||0).toFixed(2)}</td>
      </tr>
    `).join(``),r=(e.details||[]).reduce((e,t)=>e+Number(t.qty||0),0),i=(e.details||[]).reduce((e,t)=>e+Number(t.amount||0),0);t.document.write(`
      <html>
        <head>
          <title>Delivery Challan - ${e.dcNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            .header-title { text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 25px; }
            h1 { margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 900; letter-spacing: 1.5px; color: #0f172a; }
            .grid-details { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; font-size: 13px; line-height: 1.6; }
            .grid-col p { margin: 4px 0; }
            .bold-label { font-weight: bold; display: inline-block; width: 140px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: bold; padding: 10px 8px; border: 1px solid #cbd5e1; }
            td { padding: 10px 8px; border: 1px solid #e2e8f0; font-size: 12px; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 100px; font-size: 13px; font-weight: bold; }
            .footer-sign div { border-top: 2px solid #94a3b8; padding-top: 8px; width: 200px; text-align: center; }
            .sys-footer { text-align: center; margin-top: 60px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header-title">
            <h1>DELIVERY CHALLAN</h1>
          </div>
          <div class="grid-details">
            <div class="grid-col">
              <p><span class="bold-label">DC No:</span> <b>#${e.dcNo}</b></p>
              <p><span class="bold-label">DC Date:</span> ${x(e.date)}</p>
              <p><span class="bold-label">Vehicle No:</span> ${e.vehicleNo||`—`}</p>
              <p><span class="bold-label">Driver Name:</span> ${e.driverName||`—`}</p>
            </div>
            <div class="grid-col">
              <p><span class="bold-label">Customer Name:</span> <b>${e.partyName}</b></p>
              <p><span class="bold-label">Address:</span> ${e.address||`—`}</p>
              <p><span class="bold-label">Despatch Through:</span> ${e.desThrough||`—`}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">S.No</th>
                <th>Part No</th>
                <th>Part Name</th>
                <th>Description</th>
                <th style="width: 80px;">Qty</th>
                <th style="width: 70px;">Unit</th>
                <th style="width: 100px;">Rate</th>
                <th style="width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${n}
              <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="4" style="text-align: right;">TOTAL</td>
                <td style="text-align: right;">${r}</td>
                <td colspan="2"></td>
                <td style="text-align: right;">₹${i.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer-sign">
            <div>Receiver's Signature</div>
            <div>Authorized Signatory</div>
          </div>
          <div class="sys-footer">
            VELSON ERP - System Generated Delivery Challan - Confidentially Printed
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          <\/script>
        </body>
      </html>
    `),t.document.close()};return(0,g.jsx)(`div`,{className:`bg-[#f1f5f9] min-h-screen`,children:(0,g.jsx)(`div`,{className:`p-4`,children:(0,g.jsxs)(`div`,{className:`bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col min-h-[90vh]`,children:[(0,g.jsxs)(`div`,{className:`flex items-center justify-between border-b border-slate-300 bg-[#f8fafc] px-3 py-1.5`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(`div`,{className:`w-3 h-3 bg-red-700 rounded-sm`}),(0,g.jsx)(`h2`,{className:`text-[12px] font-bold text-slate-800 uppercase tracking-tight`,children:`DC Details`})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,g.jsxs)(y,{onClick:I,color:`emerald`,children:[(0,g.jsx)(r,{size:14,className:`text-emerald-600`}),` Edit`]}),(0,g.jsxs)(y,{onClick:L,color:`rose`,children:[(0,g.jsx)(a,{size:14,className:`text-rose-600`}),` Delete`]}),(0,g.jsx)(`div`,{className:`w-[1px] h-4 bg-slate-300 mx-1`}),(0,g.jsxs)(y,{onClick:R,children:[(0,g.jsx)(i,{size:14}),` Print Image`]}),(0,g.jsxs)(y,{onClick:()=>window.history.back(),color:`rose`,children:[(0,g.jsx)(u,{size:16,strokeWidth:3}),` Close`]})]})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-4 bg-white border-b border-slate-200 px-4 py-2 flex-wrap`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(_,{children:`From Date :`}),(0,g.jsx)(v,{options:n,value:w,onChange:e=>T(e.target.value),className:`w-32`})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,g.jsx)(_,{children:`To Date :`}),(0,g.jsx)(v,{options:n,value:E,onChange:e=>D(e.target.value),className:`w-32`})]}),(0,g.jsx)(`div`,{className:`w-[1px] h-6 bg-slate-200 mx-1`}),(0,g.jsx)(b,{onClick:q,icon:`dot`,children:`Search`}),(0,g.jsx)(b,{onClick:z,icon:`dot`,children:`DC Details`}),(0,g.jsx)(`div`,{className:`w-[1px] h-6 bg-slate-200 mx-1`}),(0,g.jsx)(b,{onClick:()=>B(`M1`),icon:`printer`,children:`PDF M1`}),(0,g.jsx)(b,{onClick:()=>B(`M2`),icon:`printer`,children:`PDF M2`}),(0,g.jsx)(b,{onClick:()=>B(`M3`),icon:`printer`,children:`PDF M3`}),(0,g.jsxs)(`div`,{className:`ml-auto flex items-center gap-4 text-slate-500`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-1 text-[11px] font-bold`,children:[(0,g.jsx)(`span`,{children:`LS`}),(0,g.jsx)(`input`,{type:`text`,value:`1`,readOnly:!0,className:`w-8 px-1 py-0.5 border border-slate-300 rounded text-center text-[#0097A7] font-black`})]}),(0,g.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,g.jsxs)(`button`,{onClick:U,className:`hover:text-slate-800 flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,g.jsx)(i,{size:14,className:`text-slate-400`}),` Dos`]}),(0,g.jsxs)(`button`,{onClick:V,className:`hover:text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,g.jsx)(d,{size:14,className:`text-emerald-500`}),` Excel`]}),(0,g.jsxs)(`button`,{onClick:H,className:`hover:text-rose-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,g.jsx)(s,{size:14,className:`text-rose-500`}),` Pdf`]}),(0,g.jsxs)(`button`,{onClick:W,className:`hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,g.jsx)(c,{size:14}),` Filter`]}),(0,g.jsxs)(`button`,{onClick:G,className:`hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,g.jsx)(f,{size:14}),` Setting`]})]})]})]}),(0,g.jsx)(`div`,{className:`border border-slate-200 rounded-2xl overflow-hidden shadow-sm m-4`,children:(0,g.jsxs)(`table`,{className:`w-full text-left border-collapse min-w-[1500px]`,children:[(0,g.jsx)(`thead`,{className:`bg-[#fcfdfe] text-[9px] uppercase text-slate-400 font-black border-b border-slate-200`,children:(0,g.jsxs)(`tr`,{className:`divide-x divide-slate-100`,children:[(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100 w-16 text-center`,children:`S.No`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`DC No`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`DC Date`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`DC Type`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Customer Name`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Contact Person`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Contact No`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100 text-right`,children:`Total Qty`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100 text-right`,children:`Total Amount`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Vehicle No`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Driver Name`}),(0,g.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Despatch Through`}),(0,g.jsx)(`th`,{className:`px-5 py-4 text-center w-24`,children:`Action`})]})}),(0,g.jsx)(`tbody`,{className:`divide-y divide-slate-50 text-[12px]`,children:A?(0,g.jsx)(`tr`,{children:(0,g.jsx)(`td`,{colSpan:13,className:`text-center py-8 text-slate-400 italic`,children:`Loading Delivery Challans...`})}):O.length===0?(0,g.jsx)(`tr`,{children:(0,g.jsx)(`td`,{colSpan:13,className:`text-center py-8 text-slate-400 italic`,children:`No Delivery Challan records found for the selected date range.`})}):O.map((e,t)=>{let n=String(e.id||e.dcNo||t);return(0,g.jsxs)(`tr`,{onClick:()=>K(e),className:`h-14 transition-colors divide-x divide-slate-100 group cursor-pointer ${M===n?`bg-[#0097A7]/10`:`hover:bg-[#0097A7]/5`}`,children:[(0,g.jsx)(`td`,{className:`px-2 py-1 text-center text-slate-300 font-bold`,children:t+1}),(0,g.jsxs)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-black text-[#0097A7]`,children:[`#`,e.dcNo]}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-bold text-slate-400`,children:x(e.date)}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-semibold text-slate-600`,children:e.dcType}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-bold text-slate-700`,children:e.partyName}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-slate-500 font-medium`,children:e.contPerson||`—`}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-slate-500 font-medium`,children:e.contactNo||`—`}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-right font-bold text-[#0097A7]`,children:e.totalQty||0}),(0,g.jsxs)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-right font-bold text-slate-800`,children:[`₹`,Number(e.totalAmount||0).toFixed(2)]}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50`,children:e.vehicleNo||`—`}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50`,children:e.driverName||`—`}),(0,g.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50`,children:e.desThrough||`—`}),(0,g.jsx)(`td`,{className:`px-5 py-2 text-center`,children:(0,g.jsx)(`button`,{onClick:t=>{t.stopPropagation(),J(e)},className:`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-colors shadow-sm border border-[#0097A7]/20`,title:`Print DC Record`,children:(0,g.jsx)(i,{size:15})})})]},n)})})]})})]})})})}export{C as default};