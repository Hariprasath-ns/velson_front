import{i as e}from"./chunk-62oNxeRG.js";import{t}from"./download-DEH_FMmj.js";import{t as n}from"./image-Tob8-Jf8.js";import{t as r}from"./printer-C6OS9aqd.js";import{t as i}from"./rotate-ccw-ZDSgmr8m.js";import{t as a}from"./trash-2-CKmQ0xUV.js";import{C as o,H as s,K as c,N as l,P as u,V as d,a as ee,f,ft as p,h as m,i as te}from"./index-BrxnA7vQ.js";import{t as h}from"./exceljs.min-B1E5IUQy.js";import{t as ne}from"./jspdf.es.min-BhG_KCPS.js";var g=e(p(),1),_=e(h(),1),v=c(),y=[`PartName`,`Image`,`Qty`,`UOM`,`PartNo`,`RouteCardNo`,`Process1`,`Process2`,`Process3`,`Process4`,`Process5`,`Process6`,`Process7`],b=e=>{if(!e)return{};let t=Object.keys(e),n=n=>{if(e[n]!==void 0)return e[n];let r=n.toLowerCase().replace(/[\s_-]/g,``),i=t.find(e=>e.toLowerCase().replace(/[\s_-]/g,``)===r);return i?e[i]:``},r={};return y.forEach(e=>{r[e]=n(e)}),r},x=({children:e})=>(0,v.jsx)(`label`,{className:`block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap`,children:e}),S=({placeholder:e,value:t,onChange:n,type:r=`text`,className:i=``})=>(0,v.jsx)(`input`,{type:r,placeholder:e,value:t,onChange:n,className:`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${i}`}),C=({options:e,placeholder:t,value:n,onChange:r,className:i=``,disabled:a=!1})=>(0,v.jsxs)(`div`,{className:`relative ${i} ${a?`opacity-50 cursor-not-allowed`:``}`,children:[(0,v.jsxs)(`select`,{value:n,onChange:r,disabled:a,className:`w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${a?`cursor-not-allowed`:`cursor-pointer`}`,children:[(0,v.jsx)(`option`,{value:``,children:t}),e.map(e=>{let t=typeof e==`object`?e.value:e;return(0,v.jsx)(`option`,{value:t,children:typeof e==`object`?e.label:e},t)})]}),(0,v.jsx)(`div`,{className:`pointer-events-none absolute inset-y-0 right-3 flex items-center`,children:(0,v.jsx)(`svg`,{className:`w-4 h-4 text-slate-400`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,children:(0,v.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:2,d:`M19 9l-7 7-7-7`})})})]});function w(){let e=ee(),[c,p]=(0,g.useState)(new Date(Date.now()-720*60*60*1e3).toISOString().split(`T`)[0]),[h,w]=(0,g.useState)(new Date().toISOString().split(`T`)[0]),[T,E]=(0,g.useState)(``),[D,O]=(0,g.useState)(``),[k,A]=(0,g.useState)(``),[j,re]=(0,g.useState)([]),[M,N]=(0,g.useState)([]),[P,F]=(0,g.useState)([]),[ie,I]=(0,g.useState)(!1),[L,R]=(0,g.useState)(null),[ae,z]=(0,g.useState)(!1),[B,V]=(0,g.useState)(null),[H,U]=(0,g.useState)(null),[W,G]=(0,g.useState)(null),[K,q]=(0,g.useState)(null),[J,Y]=(0,g.useState)(null);(0,g.useEffect)(()=>{q(null)},[W]);let X=async()=>{try{let e=(await f.get(`/api/bom-creation`)).data?.data||[];N(e),F(e)}catch(e){console.error(`Error fetching BOMs`,e)}},oe=async()=>{try{re((await f.get(`/api/vehicle-master`)).data?.data||[])}catch(e){console.error(`Error fetching vehicles`,e)}};(0,g.useEffect)(()=>{X(),oe()},[]),(0,g.useEffect)(()=>{let e=c?new Date(c):null;e&&!isNaN(e.getTime())&&e.setHours(0,0,0,0);let t=h?new Date(h):null;t&&!isNaN(t.getTime())&&t.setHours(23,59,59,999),F(M.filter(n=>{let r=new Date(n.date),i=e&&!isNaN(e.getTime()),a=t&&!isNaN(t.getTime()),o=(!i||r>=e)&&(!a||r<=t),s=T?n.customerName===T:!0,c=D?n.serviceJobNo===D||n.serialJobNo===D:!0,l=k?n.assemblyPartNo===k:!0;return o&&s&&c&&l}))},[M,c,h,T,D,k]),(0,g.useEffect)(()=>{let e=null,t=null;if(K){let n=Object.keys(K).find(e=>{let t=e.toLowerCase();return t.includes(`part number`)||t.includes(`part no`)||t===`part`||t===`partno`});n&&(e=K[n]),t=Object.values(K).find(e=>typeof e==`string`&&(e.startsWith(`data:image/`)||e.startsWith(`http://`)||e.startsWith(`https://`)||e.startsWith(`/uploads/`)||e.startsWith(`/api/`)))||null}else e=M.find(e=>e.id===B)?.assemblyPartNo;if(!e){U(t||null);return}let n=new AbortController;return f.get(`/api/item-master?limit=1&search=${encodeURIComponent(e)}`,{signal:n.signal}).then(e=>{let n=e.data?.data?.[0];n?n.hasImage||n.imageMimeType?U(`/api/item-master/${n.id}/download-image`):n.imagePath?n.imagePath.startsWith(`http`)||n.imagePath.startsWith(`/`)?U(n.imagePath):U(`/uploads/${n.imagePath}`):U(t||null):U(t||null)}).catch(e=>{e.name!==`CanceledError`&&e.name!==`AbortError`&&console.error(`Error loading part image`,e),U(t||null)}),()=>n.abort()},[B,K,M]);let se=()=>{I(!0),X().finally(()=>{setTimeout(()=>{I(!1)},400)})},Z=async()=>{if(L){z(!0);try{let e=L.id;await f.delete(`/api/bom-creation/${e}`),N(M.filter(t=>t.id!==e)),F(P.filter(t=>t.id!==e)),R(null),V(null)}catch(t){console.error(`Error deleting record`,t),e.error(`Error deleting record from database.`),R(null)}finally{z(!1)}}},Q=()=>{p(``),w(``),E(``),O(``),A(``),V(null),q(null)},ce=async()=>{if(P.length===0){e.warning(`No data available to export.`);return}try{let e=new _.default.Workbook,t=e.addWorksheet(`BOM Creations`);t.columns=[{header:`S.No`,key:`sno`,width:8},{header:`BOM No`,key:`bomNo`,width:15},{header:`Customer Name`,key:`customerName`,width:30},{header:`Customer Code`,key:`customerCode`,width:15},{header:`Service Job No`,key:`serviceJobNo`,width:25},{header:`Vehicle Count`,key:`vehicleSerialNo`,width:15},{header:`Assembly Part Name`,key:`assemblyPartNo`,width:25},{header:`Model Name`,key:`model`,width:20},{header:`Created Date`,key:`date`,width:15},{header:`Status`,key:`status`,width:12}],P.forEach((e,n)=>{let r=j.filter(t=>t.customer?.customerName===e.customerName).length,i=r>0?r:e.vehicleCount||0;t.addRow({sno:n+1,bomNo:e.bomNo,customerName:e.customerName,customerCode:e.customerCode||`N/A`,serviceJobNo:e.serialJobNo||e.serviceJobNo||`N/A`,vehicleSerialNo:i,assemblyPartNo:e.assemblyPartNo||`N/A`,model:e.model||`N/A`,date:e.date?e.date.split(`T`)[0]:`N/A`,status:e.status||`Created`})}),t.getRow(1).font={bold:!0};let n=await e.xlsx.writeBuffer(),r=new Blob([n],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),i=document.createElement(`a`);i.href=URL.createObjectURL(r),i.download=`bom_creation_report_${new Date().toISOString().split(`T`)[0]}.xlsx`,i.click()}catch(t){console.error(t),e.error(`Error exporting to Excel`)}},le=()=>{if(P.length===0){e.warning(`No data available to export.`);return}let t=`
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>BOM Creation Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #0097A7; color: white; padding: 8px; border: 1px solid #ddd; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          h2 { color: #333; }
        </style>
      </head>
      <body>
        <h2>Customerwise BOM Creation Report</h2>
        <p>Report Date: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>BOM No</th>
              <th>Customer Name</th>
              <th>Customer Code</th>
              <th>Service Job No</th>
              <th>Vehicle Count</th>
              <th>Assembly Part Name</th>
              <th>Model Name</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
    `;P.forEach((e,n)=>{let r=j.filter(t=>t.customer?.customerName===e.customerName).length,i=r>0?r:e.vehicleCount||0;t+=`
        <tr>
          <td>${n+1}</td>
          <td><b>${e.bomNo}</b></td>
          <td>${e.customerName}</td>
          <td>${e.customerCode||`N/A`}</td>
          <td>${e.serialJobNo||e.serviceJobNo||`N/A`}</td>
          <td>${i}</td>
          <td>${e.assemblyPartNo||`N/A`}</td>
          <td>${e.model||`N/A`}</td>
          <td>${e.date?e.date.split(`T`)[0]:`N/A`}</td>
        </tr>
      `}),t+=`
          </tbody>
        </table>
      </body>
      </html>
    `;let n=new Blob([`﻿`+t],{type:`application/msword`}),r=document.createElement(`a`);r.href=URL.createObjectURL(n),r.download=`bom_creation_report_${new Date().toISOString().split(`T`)[0]}.doc`,r.click()},ue=()=>{if(P.length===0){e.warning(`No data available to export.`);return}let t=new ne({orientation:`landscape`,unit:`mm`,format:`a4`});t.setFillColor(0,151,167),t.rect(0,0,297,20,`F`),t.setTextColor(255,255,255),t.setFont(`Helvetica`,`bold`),t.setFontSize(14),t.text(`VELSON ERP - CUSTOMERWISE BOM CREATION REPORT`,15,13),t.setTextColor(100,116,139),t.setFont(`Helvetica`,`normal`),t.setFontSize(9),t.text(`Total Records: ${P.length}`,240,28),t.text(`Generated Date: ${new Date().toLocaleDateString()}`,15,28),t.setFillColor(51,65,85),t.rect(15,32,267,8,`F`),t.setTextColor(255,255,255),t.setFont(`Helvetica`,`bold`),t.setFontSize(8.5),t.text(`S.No`,17,37.5),t.text(`BOM No`,28,37.5),t.text(`Customer Name`,55,37.5),t.text(`Customer Code`,105,37.5),t.text(`Service Job No`,130,37.5),t.text(`Vehicle Count`,165,37.5),t.text(`Assembly Part Name`,195,37.5),t.text(`Model Name`,240,37.5),t.text(`Date`,265,37.5);let n=40;t.setFont(`Helvetica`,`normal`),t.setFontSize(8),P.forEach((e,r)=>{r%2==1&&(t.setFillColor(248,250,252),t.rect(15,n,267,7,`F`)),t.setTextColor(51,65,85),t.text(String(r+1),17,n+4.5),t.setTextColor(0,151,167),t.setFont(`Helvetica`,`bold`),t.text(e.bomNo,28,n+4.5),t.setTextColor(15,23,42),t.text(e.customerName.length>25?e.customerName.substring(0,25)+`...`:e.customerName,55,n+4.5),t.setTextColor(51,65,85),t.setFont(`Helvetica`,`normal`),t.text(e.customerCode||`N/A`,105,n+4.5),t.text(e.serialJobNo||e.serviceJobNo||`N/A`,130,n+4.5);let i=j.filter(t=>t.customer?.customerName===e.customerName).length,a=i>0?i:e.vehicleCount||0;t.text(String(a),165,n+4.5),t.text(e.assemblyPartNo||`N/A`,195,n+4.5),t.text(e.model||`N/A`,240,n+4.5),t.text(e.date?e.date.split(`T`)[0]:`N/A`,265,n+4.5),t.setDrawColor(241,245,249),t.line(15,n+7,282,n+7),n+=7,n>185&&(t.addPage(),t.setFillColor(51,65,85),t.rect(15,10,267,8,`F`),t.setTextColor(255,255,255),t.setFont(`Helvetica`,`bold`),t.text(`S.No`,17,15.5),t.text(`BOM No`,28,15.5),t.text(`Customer Name`,55,15.5),t.text(`Customer Code`,105,15.5),t.text(`Service Job No`,130,15.5),t.text(`Vehicle Count`,165,15.5),t.text(`Assembly Part Name`,195,15.5),t.text(`Model Name`,240,15.5),t.text(`Date`,265,15.5),n=18,t.setFont(`Helvetica`,`normal`),t.setFontSize(8))}),t.save(`bom_creation_report_${new Date().toISOString().split(`T`)[0]}.pdf`)},$=()=>{if(P.length===0){e.warning(`No records available to print.`);return}let t=window.open(``,`_blank`,`width=950,height=750`);t.document.write(`
      <html>
        <head>
          <title>Customerwise BOM Creation Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0097A7; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; color: #0097A7; font-size: 24px; text-transform: uppercase; font-weight: 800; }
            p { margin: 3px 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #0097A7; color: white; font-size: 11px; text-transform: uppercase; font-weight: bold; padding: 10px 8px; border: 1px solid #0097A7; text-align: left; }
            td { padding: 10px 8px; border: 1px solid #e2e8f0; font-size: 12px; }
            .text-center { text-align: center; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>VELSON ERP</h1>
              <p>Customerwise BOM Creation Report</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin:0; font-size:16px; color:#475569;">BOM Registry</h2>
              <p>Total Records: ${P.length}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No</th>
                <th style="width: 10%">BOM No</th>
                <th style="width: 20%">Customer Name</th>
                <th style="width: 10%">Customer Code</th>
                <th style="width: 15%">Service Job No</th>
                <th style="width: 12%">Vehicle Count</th>
                <th style="width: 13%">Assembly Part</th>
                <th style="width: 10%">Model</th>
                <th style="width: 5%">Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${P.map((e,t)=>{let n=j.filter(t=>t.customer?.customerName===e.customerName).length,r=n>0?n:e.vehicleCount||0;return`
                <tr>
                  <td class="text-center">${t+1}</td>
                  <td style="font-weight: bold; color: #0097A7;">${e.bomNo}</td>
                  <td><b>${e.customerName}</b></td>
                  <td>${e.customerCode||`N/A`}</td>
                  <td>${e.serialJobNo||e.serviceJobNo||`N/A`}</td>
                  <td class="text-center">${r}</td>
                  <td>${e.assemblyPartNo||`N/A`}</td>
                  <td>${e.model||`N/A`}</td>
                  <td>${e.date?e.date.split(`T`)[0]:`N/A`}</td>
                </tr>
                `}).join(``)}
            </tbody>
          </table>
          <div class="footer">
            VELSON ERP - System Generated Report - Confidentially Printed
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          <\/script>
        </body>
      </html>
    `),t.document.close()},de=async t=>{if(!(!t||!t.excelRows||t.excelRows.length===0))try{let e=new _.default.Workbook,n=e.addWorksheet(`BOM_${t.bomNo}_Details`);n.columns=[{header:`S.No`,key:`sno`,width:8},...y.map(e=>({header:e,key:e,width:20}))],t.excelRows.forEach((e,t)=>{let r=b(e),i={sno:t+1};y.forEach(e=>{i[e]=r[e]||``}),n.addRow(i)}),n.getRow(1).font={bold:!0};let r=await e.xlsx.writeBuffer(),i=new Blob([r],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),a=document.createElement(`a`);a.href=URL.createObjectURL(i),a.download=`BOM_${t.bomNo}_Child_Entries_${new Date().toISOString().split(`T`)[0]}.xlsx`,a.click()}catch(t){console.error(t),e.error(`Error exporting child entries to Excel`)}},fe=e=>{if(!e||!e.excelRows||e.excelRows.length===0)return;let t=window.open(``,`_blank`,`width=950,height=750`);t.document.write(`
      <html>
        <head>
          <title>BOM Child Entries - ${e.bomNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0097A7; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; color: #0097A7; font-size: 20px; text-transform: uppercase; font-weight: 800; }
            p { margin: 3px 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #0097A7; color: white; font-size: 10px; text-transform: uppercase; font-weight: bold; padding: 8px 6px; border: 1px solid #0097A7; text-align: left; }
            td { padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 11px; }
            .text-center { text-align: center; }
            .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>BOM Child Entries</h1>
              <p>BOM No: <b>${e.bomNo}</b></p>
              <p>Customer: ${e.customerName} (${e.customerCode||`N/A`})</p>
            </div>
            <div style="text-align: right;">
              <p>Service Job No: ${e.serviceJobNo||e.serialJobNo||`N/A`}</p>
              <p>Model: ${e.model||`N/A`}</p>
              <p>Printed: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No</th>
                ${y.map(e=>`<th>${e}</th>`).join(``)}
              </tr>
            </thead>
            <tbody>
              ${e.excelRows.map((e,t)=>{let n=b(e);return`
                <tr>
                  <td class="text-center">${t+1}</td>
                  ${y.map(e=>{let t=n[e],r=String(t||``).trim();return(e===`Image`||r.startsWith(`http://`)||r.startsWith(`https://`)||r.startsWith(`/api/`)||r.startsWith(`/uploads/`)||r.startsWith(`data:image/`))&&r?`<td><img src="${r}" style="max-height: 40px; max-width: 80px; object-fit: contain;" /></td>`:`<td>${r}</td>`}).join(``)}
                </tr>
                `}).join(``)}
            </tbody>
          </table>
          <div class="footer">
            VELSON ERP - System Generated BOM Report
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          <\/script>
        </body>
      </html>
    `),t.document.close()};return(0,v.jsxs)(`div`,{className:`bg-[#f4f6f8] min-h-full pb-10`,children:[(0,v.jsxs)(`div`,{className:`px-6 py-6`,children:[(0,v.jsxs)(`div`,{className:`flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight`,children:[(0,v.jsx)(`span`,{children:`BOM`}),` `,(0,v.jsx)(d,{size:12}),` `,(0,v.jsx)(`span`,{className:`text-[#0097A7]`,children:`BOM Creation Report`})]}),(0,v.jsxs)(`div`,{className:`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col`,children:[(0,v.jsxs)(`div`,{className:`flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3`,children:[(0,v.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,v.jsx)(`div`,{className:`w-3 h-3 bg-red-700 rounded-sm`}),(0,v.jsx)(`h2`,{className:`text-[13px] font-bold text-slate-700 uppercase tracking-tight`,children:`Customerwise BOM Creation Report`})]}),(0,v.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,v.jsxs)(`button`,{onClick:$,className:`flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded shadow-sm`,children:[(0,v.jsx)(r,{size:15}),` Print Report`]}),(0,v.jsxs)(`button`,{onClick:()=>{if(!B){e.warning(`Please select a record first.`);return}let t=M.find(e=>e.id===B);t&&R(t)},className:`flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[11px] font-bold rounded shadow-sm transition-all`,children:[(0,v.jsx)(a,{size:15}),` Delete`]}),(0,v.jsxs)(`button`,{onClick:()=>window.history.back(),className:`flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black rounded transition-all shadow-sm`,children:[(0,v.jsx)(m,{size:18,strokeWidth:2.5}),` Close`]})]})]}),(0,v.jsxs)(`div`,{className:`p-6`,children:[(0,v.jsxs)(`div`,{className:`bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-8 grid grid-cols-12 gap-8`,children:[(0,v.jsx)(`div`,{className:`col-span-8 space-y-6`,children:(0,v.jsxs)(`div`,{className:`space-y-4`,children:[(0,v.jsxs)(`div`,{className:`grid grid-cols-12 gap-4 items-center`,children:[(0,v.jsx)(`div`,{className:`col-span-2`,children:(0,v.jsx)(x,{children:`Customer Name`})}),(0,v.jsx)(`div`,{className:`col-span-10`,children:(0,v.jsx)(C,{options:Array.from(new Set(M.map(e=>e.customerName).filter(Boolean))),placeholder:`--- All Customers ---`,value:T,onChange:e=>E(e.target.value)})})]}),(0,v.jsxs)(`div`,{className:`grid grid-cols-12 gap-4 items-center`,children:[(0,v.jsx)(`div`,{className:`col-span-2`,children:(0,v.jsx)(x,{children:`Service Job No`})}),(0,v.jsx)(`div`,{className:`col-span-10`,children:(0,v.jsx)(C,{options:Array.from(new Set(M.map(e=>e.serviceJobNo||e.serialJobNo).filter(Boolean))),placeholder:`--- All Service Job Numbers ---`,value:D,onChange:e=>O(e.target.value)})})]}),(0,v.jsxs)(`div`,{className:`grid grid-cols-12 gap-4 items-center`,children:[(0,v.jsx)(`div`,{className:`col-span-2`,children:(0,v.jsx)(x,{children:`Assembly Part No`})}),(0,v.jsx)(`div`,{className:`col-span-10`,children:(0,v.jsx)(C,{options:Array.from(new Set(M.map(e=>e.assemblyPartNo).filter(Boolean))),placeholder:`--- All Assembly Parts ---`,value:k,onChange:e=>A(e.target.value)})})]})]})}),(0,v.jsxs)(`div`,{className:`col-span-4 flex flex-col items-center justify-center border-l border-slate-100 pl-8`,children:[(0,v.jsx)(`div`,{onClick:()=>H&&Y(H),className:`w-48 h-48 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden relative shadow-sm transition-all duration-300 ${H?`cursor-zoom-in hover:shadow-md hover:scale-[1.02] hover:border-[#0097A7]/40`:``}`,children:H?(0,v.jsx)(`img`,{src:H,alt:`Part Preview`,className:`w-full h-full object-contain p-2`}):(0,v.jsx)(n,{size:48,className:`text-slate-300`})}),(0,v.jsx)(`p`,{className:`text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest`,children:`Part Preview`}),H&&(0,v.jsx)(`span`,{onClick:()=>Y(H),className:`text-[9px] text-[#0097A7] font-semibold mt-1 cursor-pointer hover:underline`,children:`Click to enlarge`})]})]}),(0,v.jsxs)(`div`,{className:`flex items-center gap-6 py-2`,children:[(0,v.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,v.jsx)(x,{children:`From Date`}),(0,v.jsx)(S,{type:`date`,value:c,onChange:e=>p(e.target.value),className:`w-40`})]}),(0,v.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,v.jsx)(x,{children:`To Date`}),(0,v.jsx)(S,{type:`date`,value:h,onChange:e=>w(e.target.value),className:`w-40`})]}),(0,v.jsxs)(`button`,{onClick:se,className:`flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap`,children:[ie?(0,v.jsx)(i,{size:14,className:`animate-spin`}):(0,v.jsx)(o,{size:14}),`Search`]}),(0,v.jsxs)(`button`,{onClick:Q,className:`flex items-center gap-1 px-3 py-[7px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap w-full justify-center`,children:[(0,v.jsx)(i,{size:14,className:`text-slate-500`}),`Reset Filter`]}),(0,v.jsx)(`div`,{className:`flex justify-items-end my-3 pl-[10%]`,children:(0,v.jsx)(`div`,{className:`flex items-center gap-2`,children:[{icon:(0,v.jsx)(r,{size:14}),l:`DOS`},{icon:(0,v.jsx)(l,{size:14,className:`text-blue-500`}),l:`DOC`},{icon:(0,v.jsx)(u,{size:14,className:`text-green-600`}),l:`xls`},{icon:(0,v.jsx)(t,{size:14,className:`text-red-500`}),l:`PDF`}].map(t=>(0,v.jsxs)(`button`,{onClick:()=>{t.l===`DOS`?$():t.l===`DOC`?le():t.l===`xls`?ce():t.l===`PDF`?ue():t.l===`Clear Filter`?Q():e.info(`${t.l} clicked!`)},className:`flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg shadow-sm transition-all active:scale-95`,children:[t.icon,` `,t.l]},t.l))})})]}),(0,v.jsx)(`div`,{className:`border border-slate-200 rounded-2xl overflow-hidden shadow-sm`,children:(0,v.jsxs)(`table`,{className:`w-full text-left border-collapse`,children:[(0,v.jsx)(`thead`,{className:`bg-[#fcfdfe] text-[9px] uppercase text-slate-400 font-black border-b border-slate-200`,children:(0,v.jsxs)(`tr`,{children:[(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100 w-16 text-center`,children:`S.No`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`BOM No`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Customer Name`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Customer Code`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Service Job no`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Vehicle Count`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Assembly Part name`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Model Name`}),(0,v.jsx)(`th`,{className:`px-5 py-4 border-r border-slate-100`,children:`Created Date`}),(0,v.jsx)(`th`,{className:`px-5 py-4 text-center`,children:`Created By`}),(0,v.jsx)(`th`,{className:`px-5 py-4 text-center w-24`,children:`Action`})]})}),(0,v.jsx)(`tbody`,{className:`divide-y divide-slate-50 text-[12px]`,children:P.length===0?(0,v.jsx)(`tr`,{children:(0,v.jsx)(`td`,{colSpan:11,className:`py-24 text-center text-slate-200 italic`,children:`No BOM creation records match the selected filters.`})}):P.map((e,t)=>(0,v.jsxs)(g.Fragment,{children:[(0,v.jsxs)(`tr`,{onClick:()=>{V(e.id===B?null:e.id),G(e.id===W?null:e.id),q(null)},className:`cursor-pointer transition-colors h-14 group ${e.id===B?`bg-[#0097A7]/10 hover:bg-[#0097A7] hover:text-white font-semibold`:`hover:bg-[#0097A7] hover:text-white`}`,children:[(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-center text-slate-300 font-bold group-hover:text-white`,children:t+1}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-black text-[#0097A7] group-hover:text-white`,children:(0,v.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,v.jsx)(`button`,{onClick:t=>{t.stopPropagation(),G(e.id===W?null:e.id)},className:`p-1 rounded bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-all flex items-center justify-center animate-none group-hover:bg-white/20 group-hover:text-white`,title:e.id===W?`Collapse Child Entries`:`View Child Entries`,children:e.id===W?(0,v.jsx)(s,{size:14}):(0,v.jsx)(d,{size:14})}),(0,v.jsx)(`span`,{children:e.bomNo})]})}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-bold text-slate-700 group-hover:text-white`,children:e.customerName}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 text-slate-500 font-medium group-hover:text-white`,children:e.customerCode||`N/A`}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-bold text-slate-600 uppercase text-[11px] truncate max-w-[300px] group-hover:text-white`,children:e.serialJobNo||e.serviceJobNo||`N/A`}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-semibold text-slate-600 uppercase text-[11px] text-center group-hover:text-white`,children:(()=>{let t=j.filter(t=>t.customer?.customerName===e.customerName).length;return t>0?t:e.vehicleCount||0})()}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 group-hover:text-white`,children:e.assemblyPartNo||`N/A`}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 group-hover:text-white`,children:e.model||`N/A`}),(0,v.jsx)(`td`,{className:`px-5 py-2 border-r border-slate-50 font-bold text-slate-400 group-hover:text-white`,children:e.date?e.date.split(`T`)[0]:`N/A`}),(0,v.jsx)(`td`,{className:`px-5 py-2 text-center font-black text-slate-700 text-[11px] group-hover:text-white`,children:e.createdBy||`superadmin`}),(0,v.jsx)(`td`,{className:`px-5 py-2 text-center`,children:(0,v.jsx)(`button`,{onClick:t=>{t.stopPropagation(),R(e)},className:`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors shadow-sm border border-rose-100 group-hover:bg-white group-hover:text-rose-600`,title:`Delete Record`,children:(0,v.jsx)(a,{size:15})})})]}),e.id===W&&(0,v.jsx)(`tr`,{className:`bg-slate-50/70 hover:bg-slate-50/70 no-hover`,children:(0,v.jsx)(`td`,{colSpan:11,className:`px-8 py-4 border-b border-slate-200`,children:(0,v.jsxs)(`div`,{className:`bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto`,children:[(0,v.jsxs)(`div`,{className:`flex items-center justify-between mb-3 border-b border-slate-100 pb-2`,children:[(0,v.jsxs)(`h4`,{className:`text-[11px] font-black text-[#0097A7] uppercase tracking-widest`,children:[`Child Entries for BOM: `,e.bomNo]}),(0,v.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,v.jsxs)(`button`,{onClick:t=>{t.stopPropagation(),de(e)},className:`flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded shadow-sm transition-all`,title:`Export Excel`,children:[(0,v.jsx)(u,{size:12,className:`text-green-600`}),` Export Excel`]}),(0,v.jsxs)(`button`,{onClick:t=>{t.stopPropagation(),fe(e)},className:`flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded shadow-sm transition-all`,title:`Print BOM`,children:[(0,v.jsx)(r,{size:12,className:`text-slate-600`}),` Print`]})]})]}),!e.excelRows||e.excelRows.length===0?(0,v.jsx)(`div`,{className:`text-center text-slate-400 py-6 italic text-[11px]`,children:`No child entries saved for this BOM.`}):(0,v.jsxs)(`table`,{className:`w-full text-left border-collapse text-[11px]`,children:[(0,v.jsx)(`thead`,{className:`bg-slate-50/80 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200`,children:(0,v.jsxs)(`tr`,{children:[(0,v.jsx)(`th`,{className:`px-4 py-2 border-r border-slate-100 w-12 text-center`,children:`S.No`}),y.map((e,t)=>(0,v.jsx)(`th`,{className:`px-4 py-2 border-r border-slate-100`,children:e},t))]})}),(0,v.jsx)(`tbody`,{className:`divide-y divide-slate-100 bg-white`,children:e.excelRows.map((t,n)=>{let r=b(t);return(0,v.jsxs)(`tr`,{onClick:n=>{n.stopPropagation(),q(t===K?null:t),V(e.id)},className:`cursor-pointer transition-colors group ${t===K?`bg-[#0097A7]/10 hover:bg-[#0097A7] hover:text-white font-semibold`:`hover:bg-[#0097A7] hover:text-white`}`,children:[(0,v.jsx)(`td`,{className:`px-4 py-1.5 border-r border-slate-50 text-center text-slate-400 font-bold group-hover:text-white/50`,children:n+1}),y.map((e,t)=>{let n=r[e],i=String(n||``).trim();return(0,v.jsx)(`td`,{className:`px-4 py-1.5 border-r border-slate-50 text-slate-600 group-hover:text-white`,children:(e===`Image`||i.startsWith(`http://`)||i.startsWith(`https://`)||i.startsWith(`/api/`)||i.startsWith(`/uploads/`)||i.startsWith(`data:image/`))&&i?(0,v.jsx)(`img`,{src:i,alt:`Preview`,onClick:e=>{e.stopPropagation(),Y(i)},className:`max-h-12 max-w-[80px] object-contain rounded border border-slate-200 cursor-zoom-in hover:scale-105 hover:shadow-sm transition-all duration-200`,onError:e=>{e.target.style.display=`none`}}):i},t)})]},n)})})]})]})})})]},e.id))})]})})]})]})]}),(0,v.jsx)(te,{open:!!L,title:`Delete BOM Record`,message:`Are you sure you want to delete BOM "${L?.bomNo}"? This cannot be undone.`,confirming:ae,onConfirm:Z,onCancel:()=>R(null)}),J&&(0,v.jsx)(`div`,{className:`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300`,onClick:()=>Y(null),children:(0,v.jsxs)(`div`,{className:`bg-white rounded-2xl p-4 shadow-2xl max-w-3xl max-h-[85vh] relative flex flex-col items-center transition-all duration-300 scale-100`,onClick:e=>e.stopPropagation(),children:[(0,v.jsx)(`button`,{onClick:()=>Y(null),className:`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95`,children:(0,v.jsx)(m,{size:18})}),(0,v.jsx)(`div`,{className:`overflow-hidden rounded-xl border border-slate-100 flex items-center justify-center bg-slate-50 max-w-full max-h-[70vh]`,children:(0,v.jsx)(`img`,{src:J,alt:`Enlarged Part Preview`,className:`max-w-full max-h-[65vh] object-contain p-2`})}),(0,v.jsx)(`p`,{className:`text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-wider`,children:`Part Image View`})]})})]})}export{w as default};