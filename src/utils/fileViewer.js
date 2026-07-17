import * as XLSX from 'xlsx';

export function viewFileBeforeDownload(blob, filename) {
  const newTab = window.open('', '_blank');
  if (!newTab) {
    alert('Please allow popups to view files.');
    return;
  }

  const fileType = filename.split('.').pop().toLowerCase();
  const blobUrl = URL.createObjectURL(blob);

  if (fileType === 'pdf') {
    newTab.location.href = blobUrl;
    return;
  }

  // Build base HTML for the new tab
  newTab.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Preview - ${filename}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
          color: #1e293b;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .header {
          background-color: #0097A7;
          color: white;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          z-index: 10;
        }
        .title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .actions {
          display: flex;
          gap: 12px;
        }
        .btn {
          background-color: white;
          color: #0097A7;
          border: 1px solid rgba(0, 151, 167, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn:hover {
          background-color: #e0f7fa;
          transform: translateY(-1px);
        }
        .btn-download {
          background-color: #27ae60;
          color: white;
          border-color: #219954;
        }
        .btn-download:hover {
          background-color: #219954;
        }
        .content-container {
          flex: 1;
          overflow: auto;
          padding: 24px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .iframe-viewer {
          width: 100%;
          height: 100%;
          border: none;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        /* Table Styles for Excel / CSV / Docs */
        .preview-table {
          border-collapse: collapse;
          width: 100%;
          background-color: white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          border-radius: 8px;
          overflow: hidden;
          font-size: 12px;
          border: 1px solid #e2e8f0;
        }
        .preview-table th {
          background-color: #0097A7;
          color: white;
          padding: 12px 14px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #007a87;
        }
        .preview-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        .preview-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .preview-table tr:hover {
          background-color: #b2ebf2 !important;
        }
        .doc-wrapper {
          background: white;
          padding: 36px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          border-radius: 8px;
          width: 100%;
          max-width: 1000px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">File Preview: ${filename}</div>
        <div class="actions">
          <button class="btn btn-download" id="downloadBtn">Download File</button>
          <button class="btn" onclick="window.close()">Close Preview</button>
        </div>
      </div>
      <div class="content-container" id="content">
        <div style="font-size: 14px; color: #64748b;">Loading preview...</div>
      </div>
    </body>
    </html>
  `);
  newTab.document.close();

  // Add download handler
  const downloadBtn = newTab.document.getElementById('downloadBtn');
  downloadBtn.addEventListener('click', () => {
    const a = newTab.document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.dataset.bypass = 'true'; // Bypass the interceptor!
    newTab.document.body.appendChild(a);
    a.click();
    newTab.document.body.removeChild(a);
  });

  const contentDiv = newTab.document.getElementById('content');

  if (fileType === 'csv') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n').map(row => row.split(','));
      let tableHtml = '<table class="preview-table">';
      rows.forEach((row, rIdx) => {
        if (row.length === 1 && row[0].trim() === '') return;
        tableHtml += '<tr>';
        row.forEach(cell => {
          const cleanCell = cell.replace(/^["']|["']$/g, '').trim();
          if (rIdx === 0) {
            tableHtml += `<th>${cleanCell}</th>`;
          } else {
            tableHtml += `<td>${cleanCell}</td>`;
          }
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      contentDiv.innerHTML = tableHtml;
    };
    reader.readAsText(blob);
  } else if (fileType === 'doc' || fileType === 'docx') {
    const reader = new FileReader();
    reader.onload = (e) => {
      contentDiv.innerHTML = `<div class="doc-wrapper">${e.target.result}</div>`;
    };
    reader.readAsText(blob);
  } else if (fileType === 'xlsx' || fileType === 'xls') {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        
        // Make the table use our preview-table class and clean it up
        const cleanHtml = html
          .replace('<table', '<table class="preview-table"')
          .replace(/<td/g, '<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #334155;"')
          .replace(/<th/g, '<th style="background-color: #0097A7; color: white; padding: 12px 14px; text-align: left; font-weight: 600; border-bottom: 2px solid #007a87;"');
        
        contentDiv.innerHTML = `<div style="width: 100%; max-width: 1200px; overflow-x: auto;">${cleanHtml}</div>`;
      } catch (err) {
        contentDiv.innerHTML = `<div style="color: red;">Failed to render Excel preview. Please download the file to view.</div>`;
      }
    };
    reader.readAsArrayBuffer(blob);
  } else {
    // Fallback for other file types (images, txt, etc.)
    contentDiv.innerHTML = `<iframe class="iframe-viewer" src="${blobUrl}"></iframe>`;
  }
}

// Global click and window.open interceptor initialization
export function initializeDownloadInterceptor() {
  if (typeof window === 'undefined') return;

  // 1. Intercept anchor tag click downloads
  const originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    // Only intercept if it has the download attribute, a valid href, and bypass is not set
    if (this.hasAttribute('download') && this.href && this.dataset.bypass !== 'true') {
      const filename = this.getAttribute('download') || 'file';
      const href = this.href;

      // Helper to fetch authorization header if it's a backend API endpoint
      const getHeaders = () => {
        try {
          const raw = localStorage.getItem('velson_auth');
          if (!raw) return {};
          const { token } = JSON.parse(raw);
          return token ? { 'Authorization': `Bearer ${token}` } : {};
        } catch {
          return {};
        }
      };

      const options = {};
      if (!href.startsWith('blob:')) {
        options.headers = getHeaders();
      }

      fetch(href, options)
        .then(res => {
          if (!res.ok) throw new Error('Fetch failed');
          return res.blob();
        })
        .then(blob => {
          viewFileBeforeDownload(blob, filename);
        })
        .catch(err => {
          console.warn('Failed to intercept download, falling back to direct download:', err);
          originalClick.call(this);
        });
      return;
    }
    originalClick.call(this);
  };

  // 2. Intercept window.open calls for PDF/Excel/Word blob URLs
  const originalOpen = window.open;
  window.open = function(url, target, features) {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      // Determine if this is an excel, word, or pdf document by fetching the blob directly
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const mimeType = blob.type || '';
          const isExcel = mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('sheet');
          const isWord = !isExcel && (mimeType.includes('msword') || mimeType.includes('word') || mimeType.includes('document'));
          const isPdf = mimeType.includes('pdf');

          if ((isExcel || isWord || isPdf) && window.viewFileBeforeDownload) {
            let extension = 'xlsx';
            if (isWord) extension = 'doc';
            else if (isPdf) extension = 'pdf';
            window.viewFileBeforeDownload(blob, `Exported_Document.${extension}`);
          } else {
            originalOpen.call(window, url, target, features);
          }
        })
        .catch(err => {
          console.warn('Failed to inspect blob for preview, falling back:', err);
          originalOpen.call(window, url, target, features);
        });
      return null;
    }
    return originalOpen.call(window, url, target, features);
  };
}
