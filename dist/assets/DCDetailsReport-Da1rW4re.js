import{i as e}from"./chunk-62oNxeRG.js";import{t}from"./pen-DJpi5Qfs.js";import{t as n}from"./printer-Djr9EekQ.js";import{t as r}from"./trash-2-30aySZdH.js";import{C as i,F as a,M as o,P as s,X as c,d as l,g as u,p as d}from"./index-DdVl1yAp.js";var f=e(c(),1),p=l(),m=({children:e})=>(0,p.jsx)(`label`,{className:`block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap`,children:e}),h=({options:e,value:t,onChange:n,className:r=``})=>(0,p.jsxs)(`div`,{className:`relative ${r}`,children:[(0,p.jsx)(`select`,{value:t,onChange:n,className:`w-full px-2 py-0.5 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all cursor-pointer font-bold`,children:e.map(e=>(0,p.jsx)(`option`,{value:e,children:e},e))}),(0,p.jsx)(`div`,{className:`pointer-events-none absolute inset-y-0 right-1 flex items-center`,children:(0,p.jsx)(`svg`,{className:`w-3 h-3 text-slate-400`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,children:(0,p.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:3,d:`M19 9l-7 7-7-7`})})})]}),g=({children:e,onClick:t,className:n=``,color:r=`slate`})=>(0,p.jsx)(`button`,{onClick:t,className:`flex items-center gap-1 px-3 py-1 border border-slate-200 bg-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 ${{slate:`text-slate-600 hover:bg-slate-50`,emerald:`text-emerald-600 hover:bg-emerald-50`,rose:`text-rose-600 hover:bg-rose-50`,teal:`text-[#0097A7] hover:bg-[#f0f9fa]`}[r]} ${n}`,children:e}),_=({children:e,onClick:t,className:r=``,icon:i=null})=>(0,p.jsxs)(`button`,{onClick:t,className:`flex items-center gap-1.5 px-3 py-1 bg-[#f8fafc] border border-slate-300 hover:border-[#0097A7] text-slate-700 text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap ${r}`,children:[i===`dot`&&(0,p.jsx)(`div`,{className:`w-2.5 h-2.5 bg-red-600 rounded-full`}),i===`printer`&&(0,p.jsx)(n,{size:14,className:`text-slate-400`}),e]}),v=e=>{if(!e)return`—`;let t=new Date(e);return isNaN(t.getTime())?`—`:`${String(t.getDate()).padStart(2,`0`)}-${[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`][t.getMonth()]}-${t.getFullYear()}`},y=e=>{if(!e)return null;let t=e.split(`-`);if(t.length!==3)return null;let n=parseInt(t[0],10),r=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`].indexOf(t[1]),i=parseInt(t[2],10);return r===-1||isNaN(n)||isNaN(i)?null:new Date(i,r,n)};function b(){let[e,c]=(0,f.useState)([]),[l,b]=(0,f.useState)([]),[x,S]=(0,f.useState)(``),[C,w]=(0,f.useState)(``),[T,E]=(0,f.useState)([]),[D,O]=(0,f.useState)(!0);(0,f.useEffect)(()=>{(async()=>{try{let e=await d.get(`/api/delivery-challan`);if(e.data?.success){let t=e.data.data||[];c(t);let n={};t.forEach(e=>{let t=v(e.date);t&&t!==`—`&&(n[t]=new Date(e.date).getTime())});let r=Object.keys(n).sort((e,t)=>n[e]-n[t]);b(r),r.length>0&&(S(r[0]),w(r[r.length-1]))}}catch(e){console.error(`Error fetching DC details:`,e)}finally{O(!1)}})()},[]);let k=()=>{let t=y(x),n=y(C);E(e.filter(e=>{let r=new Date(e.date);return r.setHours(0,0,0,0),!(t&&r<t||n&&r>n)}))};(0,f.useEffect)(()=>{e.length>0?k():E([])},[e,x,C]);let A=e=>{if(!e)return;let t=window.open(``,`_blank`,`width=900,height=800`);if(!t)return;let n=(e.details||[]).map((e,t)=>`
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
              <p><span class="bold-label">DC Date:</span> ${v(e.date)}</p>
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
    `),t.document.close()};return(0,p.jsx)(`div`,{className:`bg-[#f1f5f9] min-h-screen`,children:(0,p.jsx)(`div`,{className:`p-4`,children:(0,p.jsxs)(`div`,{className:`bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col min-h-[90vh]`,children:[(0,p.jsxs)(`div`,{className:`flex items-center justify-between border-b border-slate-300 bg-[#f8fafc] px-3 py-1.5`,children:[(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,p.jsx)(`div`,{className:`w-3 h-3 bg-red-700 rounded-sm`}),(0,p.jsx)(`h2`,{className:`text-[12px] font-bold text-slate-800 uppercase tracking-tight`,children:`DC Details`})]}),(0,p.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,p.jsxs)(g,{color:`emerald`,children:[(0,p.jsx)(t,{size:14,className:`text-emerald-600`}),` Edit`]}),(0,p.jsxs)(g,{color:`rose`,children:[(0,p.jsx)(r,{size:14,className:`text-rose-600`}),` Delete`]}),(0,p.jsx)(`div`,{className:`w-[1px] h-4 bg-slate-300 mx-1`}),(0,p.jsxs)(g,{children:[(0,p.jsx)(n,{size:14}),` Print Image`]}),(0,p.jsxs)(g,{onClick:()=>window.history.back(),color:`rose`,children:[(0,p.jsx)(u,{size:16,strokeWidth:3}),` Close`]})]})]}),(0,p.jsxs)(`div`,{className:`flex items-center gap-4 bg-white border-b border-slate-200 px-4 py-2 flex-wrap`,children:[(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,p.jsx)(m,{children:`From Date :`}),(0,p.jsx)(h,{options:l,value:x,onChange:e=>S(e.target.value),className:`w-32`})]}),(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,p.jsx)(m,{children:`To Date :`}),(0,p.jsx)(h,{options:l,value:C,onChange:e=>w(e.target.value),className:`w-32`})]}),(0,p.jsx)(`div`,{className:`w-[1px] h-6 bg-slate-200 mx-1`}),(0,p.jsx)(_,{onClick:k,icon:`dot`,children:`Search`}),(0,p.jsx)(_,{icon:`dot`,children:`DC Details`}),(0,p.jsx)(`div`,{className:`w-[1px] h-6 bg-slate-200 mx-1`}),(0,p.jsx)(_,{icon:`printer`,children:`PDF M1`}),(0,p.jsx)(_,{icon:`printer`,children:`PDF M2`}),(0,p.jsx)(_,{icon:`printer`,children:`PDF M3`}),(0,p.jsxs)(`div`,{className:`ml-auto flex items-center gap-4 text-slate-500`,children:[(0,p.jsxs)(`div`,{className:`flex items-center gap-1 text-[11px] font-bold`,children:[(0,p.jsx)(`span`,{children:`LS`}),(0,p.jsx)(`input`,{type:`text`,value:`1`,readOnly:!0,className:`w-8 px-1 py-0.5 border border-slate-300 rounded text-center text-[#0097A7] font-black`})]}),(0,p.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,p.jsxs)(`button`,{className:`hover:text-slate-800 flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,p.jsx)(n,{size:14,className:`text-slate-400`}),` Dos`]}),(0,p.jsxs)(`button`,{className:`hover:text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,p.jsx)(a,{size:14,className:`text-emerald-500`}),` Excel`]}),(0,p.jsxs)(`button`,{className:`hover:text-rose-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,p.jsx)(s,{size:14,className:`text-rose-500`}),` Pdf`]}),(0,p.jsxs)(`button`,{className:`hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,p.jsx)(o,{size:14}),` Filter`]}),(0,p.jsxs)(`button`,{className:`hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors`,children:[(0,p.jsx)(i,{size:14}),` Setting`]})]})]})]}),(0,p.jsx)(`div`,{className:`border border-slate-200 rounded-2xl overflow-hidden shadow-sm m-4`,children:(0,p.jsxs)(`table`,{className:`w-full text-left border-collapse min-w-[1500px]`,children:[(0,p.jsx)(`thead`,{className:`bg-[#fcfdfe] text-[9px] uppercase text-slate-400 font-black border-b border-slate-200`,children:(0,p.jsxs)(`tr`,{className:`divide-x divide-slate-100`,children:[(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100 w-16 text-center`,children:`S.No`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`DC No`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`DC Date`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`DC Type`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Customer Name`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Contact Person`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Contact No`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100 text-right`,children:`Total Qty`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100 text-right`,children:`Total Amount`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Vehicle No`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Driver Name`}),(0,p.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Despatch Through`}),(0,p.jsx)(`th`,{className:`px-5 py-4 text-center w-24`,children:`Action`})]})}),(0,p.jsx)(`tbody`,{className:`divide-y divide-slate-50 text-[12px]`,children:D?(0,p.jsx)(`tr`,{children:(0,p.jsx)(`td`,{colSpan:13,className:`text-center py-8 text-slate-400 italic`,children:`Loading Delivery Challans...`})}):T.length===0?(0,p.jsx)(`tr`,{children:(0,p.jsx)(`td`,{colSpan:13,className:`text-center py-8 text-slate-400 italic`,children:`No Delivery Challan records found for the selected date range.`})}):T.map((e,t)=>(0,p.jsxs)(`tr`,{className:`h-14 hover:bg-[#0097A7]/5 transition-colors divide-x divide-slate-100 group`,children:[(0,p.jsx)(`td`,{className:`px-2 py-1 text-center text-slate-300 font-bold`,children:t+1}),(0,p.jsxs)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-black text-[#0097A7]`,children:[`#`,e.dcNo]}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-bold text-slate-400`,children:v(e.date)}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-semibold text-slate-600`,children:e.dcType}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-bold text-slate-700`,children:e.partyName}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-slate-500 font-medium`,children:e.contPerson||`—`}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-slate-500 font-medium`,children:e.contactNo||`—`}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-right font-bold text-[#0097A7]`,children:e.totalQty||0}),(0,p.jsxs)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-right font-bold text-slate-800`,children:[`₹`,Number(e.totalAmount||0).toFixed(2)]}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50`,children:e.vehicleNo||`—`}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50`,children:e.driverName||`—`}),(0,p.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50`,children:e.desThrough||`—`}),(0,p.jsx)(`td`,{className:`px-5 py-2 text-center`,children:(0,p.jsx)(`button`,{onClick:t=>{t.stopPropagation(),A(e)},className:`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-colors shadow-sm border border-[#0097A7]/20`,title:`Print DC Record`,children:(0,p.jsx)(n,{size:15})})})]},e.id||t))})]})})]})})})}export{b as default};