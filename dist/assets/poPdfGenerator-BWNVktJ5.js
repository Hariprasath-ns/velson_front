import{t as e}from"./api-CLiRfOMY.js";var t=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`],n=e=>{if(!e)return`—`;let n=new Date(e);return isNaN(n.getTime())?e:`${String(n.getDate()).padStart(2,`0`)}-${t[n.getMonth()]}-${n.getFullYear()}`};function r(e){let t=[``,`One `,`Two `,`Three `,`Four `,`Five `,`Six `,`Seven `,`Eight `,`Nine `,`Ten `,`Eleven `,`Twelve `,`Thirteen `,`Fourteen `,`Fifteen `,`Sixteen `,`Seventeen `,`Eighteen `,`Nineteen `],n=[``,``,`Twenty`,`Thirty`,`Forty`,`Fifty`,`Sixty`,`Seventy`,`Eighty`,`Ninety`],r=parseFloat(e);if(isNaN(r)||r===0)return`RUPEES ZERO ONLY`;let i=e=>{let r=``;return e>=1e7&&(r+=i(Math.floor(e/1e7))+`Crore `,e%=1e7),e>=1e5&&(r+=i(Math.floor(e/1e5))+`Lakh `,e%=1e5),e>=1e3&&(r+=i(Math.floor(e/1e3))+`Thousand `,e%=1e3),e>=100&&(r+=i(Math.floor(e/100))+`Hundred `,e%=100),e>0&&(r+=e<20?t[e]:n[Math.floor(e/10)]+` `+t[e%10]),r},a=Math.floor(r),o=Math.round((r-a)*100),s=`Rupees `+i(a);return o>0&&(s+=`and `+i(o)+`Paise `),(s.trim()+` Only`).toUpperCase()}async function i(t,i=null){let a=i;if(!a)try{a=((await e.get(`/api/company-master`,{skipGlobalLoader:!0})).data?.data||[])[0]||{}}catch{a={}}let o=a.companyName||`VELSON PRECISION ENGINEERING`,s=[a.doorNumber,a.street,a.place,a.city,a.state,a.pinCode].filter(Boolean).join(`, `)||a.address||`Industrial Area, Ambattur, Chennai - 600058`,c=a.gstin||`33AAACV1234F1Z5`,l=a.companyEmail||a.purchaseEmail||`purchase@velson.in`,u=a.companyPhone||a.purchasePhone||`+91 44 2688 0000`,d=t.supplier?.supplierCode||t.supplierRefNo||t.supplierCode||`—`,f=t.supplier?.supplierName||t.supplierName||`—`,p=t.supplierAddress||[t.supplier?.address,t.supplier?.city,t.supplier?.state,t.supplier?.pinCode].filter(Boolean).join(`, `)||`—`,m=t.gstNo||t.supplier?.gstin||`—`,h=t.details||[],g=0,_=0,v=0,y=h.map((e,t)=>{let n=parseFloat(e.qty)||0,r=parseFloat(e.unitPrice)||0,i=parseFloat(e.amount)||n*r,a=parseFloat(e.gstAmt)||0,o=parseFloat(e.netAmt)||i+a;g+=i,_+=a,v+=o;let s=[e.itemCode?`<strong>${e.itemCode}</strong>`:``,e.itemName||``,e.description?`<em>${e.description}</em>`:``].filter(Boolean).join(` - `);return`
      <tr>
        <td style="text-align:center;">${t+1}</td>
        <td style="text-align:left;">${s||`—`}</td>
        <td style="text-align:center;">${e.hsnCode||`—`}</td>
        <td style="text-align:right;font-weight:600;">${n.toFixed(2)}</td>
        <td style="text-align:center;">${e.uom||e.unit||`NOS`}</td>
        <td style="text-align:right;">${r.toFixed(2)}</td>
        <td style="text-align:right;font-weight:600;">${i.toFixed(2)}</td>
      </tr>
    `}).join(``);t.totalAmount&&(v=parseFloat(t.totalAmount));let b=r(v),x=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Purchase Order - ${t.poNo||`PO`}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      margin: 0;
      padding: 10px;
      background: #fff;
    }
    .po-container {
      border: 1.5px solid #333;
      padding: 12px;
      background: #fff;
    }
    .company-header {
      text-align: center;
      border-bottom: 2px solid #0097A7;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .company-name {
      font-size: 18px;
      font-weight: 800;
      color: #0097A7;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .company-sub {
      font-size: 10.5px;
      color: #444;
      line-height: 1.4;
    }
    .po-title-banner {
      background: #0097A7;
      color: #ffffff;
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 4px 0;
      margin: 8px 0;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      border: 1px solid #ccc;
      margin-bottom: 10px;
    }
    .supplier-box {
      border-right: 1px solid #ccc;
      padding: 8px;
      font-size: 11px;
      line-height: 1.45;
    }
    .po-meta-box {
      padding: 8px;
      font-size: 11px;
      line-height: 1.5;
    }
    .info-row {
      display: flex;
      margin-bottom: 2px;
    }
    .info-lbl {
      font-weight: 700;
      width: 110px;
      color: #333;
      flex-shrink: 0;
    }
    .info-val {
      color: #111;
      font-weight: 500;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 6px 0;
    }
    table.items-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border: 1px solid #94a3b8;
      padding: 6px 5px;
    }
    table.items-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      font-size: 10.5px;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    .totals-table {
      width: 280px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 3px 6px;
      font-size: 11px;
      border: 1px solid #cbd5e1;
    }
    .totals-table td.lbl {
      font-weight: 700;
      background: #f8fafc;
      text-align: right;
    }
    .totals-table td.val {
      text-align: right;
      font-weight: 700;
    }
    .grand-total-row td {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 12px;
      font-weight: 800;
    }
    .words-box {
      border: 1px solid #94a3b8;
      background: #f8fafc;
      padding: 6px 8px;
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .terms-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      border: 1px solid #cbd5e1;
      padding: 8px;
      margin-bottom: 12px;
      background: #fafafa;
    }
    .term-item {
      font-size: 10px;
      line-height: 1.4;
    }
    .term-lbl {
      font-weight: 700;
      color: #334155;
    }
    .signatures-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 25px;
      padding: 0 15px;
    }
    .sig-block {
      text-align: center;
      width: 220px;
    }
    .sig-line {
      border-top: 1px solid #333;
      margin-bottom: 4px;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }
    @media print {
      body { padding: 0; }
      .po-container { border: 1.5px solid #000; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="po-container">
    <!-- Header -->
    <div class="company-header">
      <div class="company-name">${o}</div>
      <div class="company-sub">
        ${s}<br>
        <strong>GSTIN:</strong> ${c} &nbsp;|&nbsp; <strong>Email:</strong> ${l} &nbsp;|&nbsp; <strong>Phone:</strong> ${u}
      </div>
    </div>

    <!-- Title -->
    <div class="po-title-banner">PURCHASE ORDER</div>

    <!-- Info Grid -->
    <div class="info-grid">
      <!-- Left: Supplier Details ("To:- M/S") -->
      <div class="supplier-box">
        <div style="font-weight:800;text-decoration:underline;margin-bottom:4px;color:#0097A7;">To:- M/S</div>
        <div class="info-row"><span class="info-lbl">Supplier Code:</span><span class="info-val">${d}</span></div>
        <div class="info-row"><span class="info-lbl">Supplier Name:</span><span class="info-val"><strong>${f}</strong></span></div>
        <div class="info-row"><span class="info-lbl">Full Address:</span><span class="info-val">${p}</span></div>
        <div class="info-row"><span class="info-lbl">GSTIN:</span><span class="info-val">${m}</span></div>
        <div class="info-row"><span class="info-lbl">Offer Ref Date:</span><span class="info-val">${n(t.poDate)}</span></div>
      </div>

      <!-- Right: PO Details -->
      <div class="po-meta-box">
        <div class="info-row"><span class="info-lbl">PO Number:</span><span class="info-val" style="color:#0097A7;font-weight:800;">${t.poNo||`—`}</span></div>
        <div class="info-row"><span class="info-lbl">PO Date:</span><span class="info-val">${n(t.poDate)}</span></div>
        <div class="info-row"><span class="info-lbl">Delivery / ETA:</span><span class="info-val">${n(t.etaDate)}</span></div>
        <div class="info-row"><span class="info-lbl">PO Type:</span><span class="info-val">${t.poType||`Purchase Order`}</span></div>
        <div class="info-row"><span class="info-lbl">Status:</span><span class="info-val" style="font-weight:700;">${t.status||`Pending`}</span></div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:35px;text-align:center;">S.No</th>
          <th style="text-align:left;">Description (Part No + Name)</th>
          <th style="width:75px;text-align:center;">HSN Code</th>
          <th style="width:60px;text-align:right;">QTY</th>
          <th style="width:50px;text-align:center;">UOM</th>
          <th style="width:85px;text-align:right;">Rate/Pc (INR)</th>
          <th style="width:95px;text-align:right;">Value (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${y||`<tr><td colspan="7" style="text-align:center;padding:12px;">No line items</td></tr>`}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td class="lbl">Sub Total (INR):</td>
          <td class="val">${g.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="lbl">Taxes / GST (INR):</td>
          <td class="val">${_.toFixed(2)}</td>
        </tr>
        <tr class="grand-total-row">
          <td class="lbl" style="background:#e0f2fe;color:#0369a1;">Grand Total (INR):</td>
          <td class="val">${v.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Amount in Words -->
    <div class="words-box">
      <strong>Amount in Words:</strong> ${b}
    </div>

    <!-- Standard Terms -->
    <div class="terms-grid">
      <div class="term-item"><span class="term-lbl">1. Taxes & Duties:</span> ${t.taxType||`GST Extra as applicable`}</div>
      <div class="term-item"><span class="term-lbl">2. Payment Terms:</span> ${t.paymentTerms||`30 Days after receipt & acceptance`}</div>
      <div class="term-item"><span class="term-lbl">3. Freight / Transport:</span> ${t.freight||`By Supplier / Door Delivery`}</div>
      <div class="term-item"><span class="term-lbl">4. Mode of Dispatch:</span> ${t.modeOfDespatch||`By Road`}</div>
      <div class="term-item"><span class="term-lbl">5. Delivery Period:</span> ${n(t.etaDate)}</div>
      <div class="term-item"><span class="term-lbl">6. Inspection / QC:</span> ${t.testReport||`Material subject to inspection at our works`}</div>
    </div>

    <!-- Signatures -->
    <div class="signatures-box">
      <div class="sig-block">
        <div style="height:35px;"></div>
        <div class="sig-line"></div>
        <div class="sig-title">Prepared By (${t.createdBy||`Authorized User`})</div>
      </div>
      <div class="sig-block">
        <div style="font-size:10.5px;font-weight:700;margin-bottom:25px;">For ${o}</div>
        <div class="sig-line"></div>
        <div class="sig-title">Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`,S=window.open(``,`_blank`,`width=950,height=800`);S&&(S.document.open(),S.document.write(x),S.document.close(),S.focus(),setTimeout(()=>{S.print()},450))}export{i as t};