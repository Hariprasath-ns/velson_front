/* eslint-disable */
import api from '../services/api';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, '0')}-${months[dt.getMonth()]}-${dt.getFullYear()}`;
};

export function numberToWords(num) {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = parseFloat(num);
  if (isNaN(n) || n === 0) return 'RUPEES ZERO ONLY';

  const inWords = (val) => {
    let str = '';
    if (val >= 10000000) {
      str += inWords(Math.floor(val / 10000000)) + 'Crore ';
      val %= 10000000;
    }
    if (val >= 100000) {
      str += inWords(Math.floor(val / 100000)) + 'Lakh ';
      val %= 100000;
    }
    if (val >= 1000) {
      str += inWords(Math.floor(val / 1000)) + 'Thousand ';
      val %= 1000;
    }
    if (val >= 100) {
      str += inWords(Math.floor(val / 100)) + 'Hundred ';
      val %= 100;
    }
    if (val > 0) {
      if (val < 20) {
        str += a[val];
      } else {
        str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
      }
    }
    return str;
  };

  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);

  let result = 'Rupees ' + inWords(rupees);
  if (paise > 0) {
    result += 'and ' + inWords(paise) + 'Paise ';
  }
  return (result.trim() + ' Only').toUpperCase();
}

export async function generatePurchaseOrderPdf(po, companyInfo = null) {
  let comp = companyInfo;
  if (!comp) {
    try {
      const res = await api.get('/api/company-master', { skipGlobalLoader: true });
      const list = res.data?.data || [];
      comp = list[0] || {};
    } catch {
      comp = {};
    }
  }

  const companyName = comp.companyName || 'VELSON PRECISION ENGINEERING';
  const companyAddress = [comp.doorNumber, comp.street, comp.place, comp.city, comp.state, comp.pinCode].filter(Boolean).join(', ') || comp.address || 'Industrial Area, Ambattur, Chennai - 600058';
  const companyGst = comp.gstin || '33AAACV1234F1Z5';
  const companyEmail = comp.companyEmail || comp.purchaseEmail || 'purchase@velson.in';
  const companyPhone = comp.companyPhone || comp.purchasePhone || '+91 44 2688 0000';

  const supplierCode = po.supplier?.supplierCode || po.supplierRefNo || po.supplierCode || '—';
  const supplierName = po.supplier?.supplierName || po.supplierName || '—';
  const supplierAddress = po.supplierAddress || [po.supplier?.address, po.supplier?.city, po.supplier?.state, po.supplier?.pinCode].filter(Boolean).join(', ') || '—';
  const supplierGst = po.gstNo || po.supplier?.gstin || '—';

  const details = po.details || [];
  let itemsSubTotal = 0;
  let itemsTotalTax = 0;
  let itemsGrandTotal = 0;

  const itemRowsHtml = details.map((d, i) => {
    const qty = parseFloat(d.qty) || 0;
    const rate = parseFloat(d.unitPrice) || 0;
    const val = parseFloat(d.amount) || (qty * rate);
    const gstAmt = parseFloat(d.gstAmt) || (parseFloat(d.gstPer) ? (val * parseFloat(d.gstPer) / 100) : 0);
    const netAmt = parseFloat(d.netAmt) || (val + gstAmt);

    itemsSubTotal += val;
    itemsTotalTax += gstAmt;
    itemsGrandTotal += netAmt;

    const partNo = d.itemCode || d.partNo || d.supplierPartNo || '—';
    const partName = d.itemName || '—';
    const desc = d.description || '—';

    return `
      <tr>
        <td style="text-align:center;font-weight:600;color:#555;">${i + 1}</td>
        <td style="text-align:left;font-weight:700;font-family:monospace;color:#007a87;white-space:nowrap;">${partNo}</td>
        <td style="text-align:left;font-weight:600;">${partName}</td>
        <td style="text-align:left;word-break:break-word;overflow-wrap:break-word;white-space:normal;line-height:1.35;max-width:130px;">${desc}</td>
        <td style="text-align:center;">${d.hsnCode || '—'}</td>
        <td style="text-align:right;font-weight:700;">${qty.toFixed(2)}</td>
        <td style="text-align:center;">${d.uom || d.unit || 'NOS'}</td>
        <td style="text-align:right;">${rate.toFixed(2)}</td>
        <td style="text-align:right;font-weight:700;">${val.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const subTotal = (parseFloat(po.subTotal) > 0) ? parseFloat(po.subTotal) : itemsSubTotal;
  const cgstAmt = parseFloat(po.cgstAmt) || 0;
  const sgstAmt = parseFloat(po.sgstAmt) || 0;
  const igstAmt = parseFloat(po.igstAmt) || 0;
  const othersAmt = parseFloat(po.othersAmt) || 0;
  const freightAmt = parseFloat(po.freight) || 0;

  const headerTax = cgstAmt + sgstAmt + igstAmt;
  const totalTax = headerTax > 0 ? headerTax : itemsTotalTax;

  let grandTotal = 0;
  if (parseFloat(po.totalAmount) > 0) {
    grandTotal = parseFloat(po.totalAmount);
  } else {
    grandTotal = subTotal + totalTax + othersAmt + freightAmt;
  }

  const amtInWords = numberToWords(grandTotal);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Purchase Order - ${po.poNo || 'PO'}</title>
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
      <div class="company-name">${companyName}</div>
      <div class="company-sub">
        ${companyAddress}<br>
        <strong>GSTIN:</strong> ${companyGst} &nbsp;|&nbsp; <strong>Email:</strong> ${companyEmail} &nbsp;|&nbsp; <strong>Phone:</strong> ${companyPhone}
      </div>
    </div>

    <!-- Title -->
    <div class="po-title-banner">PURCHASE ORDER</div>

    <!-- Info Grid -->
    <div class="info-grid">
      <!-- Left: Supplier Details ("To:- M/S") -->
      <div class="supplier-box">
        <div style="font-weight:800;text-decoration:underline;margin-bottom:4px;color:#0097A7;">To:- M/S</div>
        <div class="info-row"><span class="info-lbl">Supplier Code:</span><span class="info-val">${supplierCode}</span></div>
        <div class="info-row"><span class="info-lbl">Supplier Name:</span><span class="info-val"><strong>${supplierName}</strong></span></div>
        <div class="info-row"><span class="info-lbl">Full Address:</span><span class="info-val">${supplierAddress}</span></div>
        <div class="info-row"><span class="info-lbl">GSTIN:</span><span class="info-val">${supplierGst}</span></div>
        <div class="info-row"><span class="info-lbl">Offer Ref Date:</span><span class="info-val">${fmtDate(po.poDate)}</span></div>
      </div>

      <!-- Right: PO Details -->
      <div class="po-meta-box">
        <div class="info-row"><span class="info-lbl">PO Number:</span><span class="info-val" style="color:#0097A7;font-weight:800;">${po.poNo || '—'}</span></div>
        <div class="info-row"><span class="info-lbl">PO Date:</span><span class="info-val">${fmtDate(po.poDate)}</span></div>
        <div class="info-row"><span class="info-lbl">Delivery / ETA:</span><span class="info-val">${fmtDate(po.etaDate)}</span></div>
        <div class="info-row"><span class="info-lbl">PO Type:</span><span class="info-val">${po.poType || 'Purchase Order'}</span></div>
        <div class="info-row"><span class="info-lbl">Status:</span><span class="info-val" style="font-weight:700;">${po.status || 'Pending'}</span></div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:30px;text-align:center;">S.No</th>
          <th style="width:115px;text-align:left;">Part No</th>
          <th style="width:210px;text-align:left;">Part Name</th>
          <th style="width:130px;text-align:left;">Description</th>
          <th style="width:60px;text-align:center;">HSN Code</th>
          <th style="width:50px;text-align:right;">QTY</th>
          <th style="width:45px;text-align:center;">UOM</th>
          <th style="width:75px;text-align:right;">Rate (INR)</th>
          <th style="width:85px;text-align:right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml || '<tr><td colspan="9" style="text-align:center;padding:12px;">No line items</td></tr>'}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td class="lbl">Sub Total (INR):</td>
          <td class="val">${subTotal.toFixed(2)}</td>
        </tr>
        ${cgstAmt > 0 ? `
        <tr>
          <td class="lbl">CGST (${po.cgstPer || 9}%):</td>
          <td class="val">${cgstAmt.toFixed(2)}</td>
        </tr>` : ''}
        ${sgstAmt > 0 ? `
        <tr>
          <td class="lbl">SGST (${po.sgstPer || 9}%):</td>
          <td class="val">${sgstAmt.toFixed(2)}</td>
        </tr>` : ''}
        ${igstAmt > 0 ? `
        <tr>
          <td class="lbl">IGST (${po.igstPer || 18}%):</td>
          <td class="val">${igstAmt.toFixed(2)}</td>
        </tr>` : ''}
        ${(cgstAmt === 0 && sgstAmt === 0 && igstAmt === 0 && totalTax > 0) ? `
        <tr>
          <td class="lbl">Taxes / GST (INR):</td>
          <td class="val">${totalTax.toFixed(2)}</td>
        </tr>` : ''}
        ${othersAmt > 0 ? `
        <tr>
          <td class="lbl">Other Charges (INR):</td>
          <td class="val">${othersAmt.toFixed(2)}</td>
        </tr>` : ''}
        ${freightAmt > 0 ? `
        <tr>
          <td class="lbl">Freight (INR):</td>
          <td class="val">${freightAmt.toFixed(2)}</td>
        </tr>` : ''}
        <tr class="grand-total-row">
          <td class="lbl" style="background:#e0f2fe;color:#0369a1;">Grand Total (INR):</td>
          <td class="val">${grandTotal.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Amount in Words -->
    <div class="words-box">
      <strong>Amount in Words:</strong> ${amtInWords}
    </div>

    <!-- Standard Terms -->
    <div class="terms-grid">
      <div class="term-item"><span class="term-lbl">1. Taxes & Duties:</span> ${po.taxType || 'GST Extra as applicable'}</div>
      <div class="term-item"><span class="term-lbl">2. Payment Terms:</span> ${po.paymentTerms || '30 Days after receipt & acceptance'}</div>
      <div class="term-item"><span class="term-lbl">3. Freight / Transport:</span> ${po.freight || 'By Supplier / Door Delivery'}</div>
      <div class="term-item"><span class="term-lbl">4. Mode of Dispatch:</span> ${po.modeOfDespatch || 'By Road'}</div>
      <div class="term-item"><span class="term-lbl">5. Delivery Period:</span> ${fmtDate(po.etaDate)}</div>
      <div class="term-item"><span class="term-lbl">6. Inspection / QC:</span> ${po.testReport || 'Material subject to inspection at our works'}</div>
    </div>

    <!-- Signatures -->
    <div class="signatures-box">
      <div class="sig-block">
        <div style="height:35px;"></div>
        <div class="sig-line"></div>
        <div class="sig-title">Prepared By (${po.createdBy || 'Authorized User'})</div>
      </div>
      <div class="sig-block">
        <div style="font-size:10.5px;font-weight:700;margin-bottom:25px;">For ${companyName}</div>
        <div class="sig-line"></div>
        <div class="sig-title">Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const printWin = window.open('', '_blank', 'width=950,height=800');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 450);
  }
}
