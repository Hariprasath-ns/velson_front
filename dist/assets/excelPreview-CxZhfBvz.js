function e(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function t(t,n,r,i=`Excel Preview`){let a=window.open(``,`_blank`,`width=1100,height=750`);if(!a)throw Error(`Unable to open preview tab. Please allow popups for this site.`);let o=URL.createObjectURL(n),s=t.length?Object.keys(t[0]):[],c=s.map(t=>`<th class="px-3 py-2 border bg-slate-100 text-left text-xs font-semibold text-slate-700">${e(t)}</th>`).join(``),l=t.map(t=>`
    <tr class="odd:bg-white even:bg-slate-50">
      ${s.map(n=>`<td class="px-3 py-2 border text-sm text-slate-700">${e(t[n]??``)}</td>`).join(``)}
    </tr>
  `).join(``);a.document.write(`
    <html>
      <head>
        <title>${e(i)}</title>
        <style>
          body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; }
          .page { max-width: 1440px; margin: 0 auto; padding: 24px; }
          .header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 18px; }
          .title { font-size: 1.2rem; font-weight: 800; letter-spacing: 0.02em; }
          .note { color: #475569; font-size: 0.95rem; margin-top: 4px; }
          .download-button { display: inline-flex; align-items: center; justify-content: center; padding: 0.8rem 1.1rem; background: #059669; color: #fff; border-radius: 0.75rem; text-decoration: none; font-weight: 700; box-shadow: 0 10px 24px rgba(5, 150, 105, 0.14); }
          .download-button:hover { background: #047857; }
          .preview-table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
          .preview-table th, .preview-table td { border: 1px solid #e2e8f0; padding: 10px 12px; }
          .preview-table th { background: #f8fafc; color: #334155; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; }
          .preview-table td { font-size: 0.9rem; }
          .preview-note { font-size: 0.92rem; color: #475569; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div>
              <div class="title">${e(i)}</div>
              <div class="note">Preview the sheet here first. Use the button to download the Excel file.</div>
            </div>
            <a class="download-button" href="${o}" download="${e(r)}">Download Excel</a>
          </div>
          <table class="preview-table">
            <thead>
              <tr>${c}</tr>
            </thead>
            <tbody>${l}</tbody>
          </table>
        </div>
        <script>
          window.addEventListener('beforeunload', function() {
            try { URL.revokeObjectURL('${o}') } catch (e) { }
          })
        <\/script>
      </body>
    </html>
  `),a.document.close()}export{t};