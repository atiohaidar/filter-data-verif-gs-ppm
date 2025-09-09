// Dashboard Verifikasi Publikasi Dosen
// - Drag & drop CSV (PapaParse)
// - Filter berdasarkan dosen (Penulis Internal atau Penulis semua)
// - Verifikasi data dengan berbagai checks
// - Status verifikasi disimpan ke CSV
// - Tabel hasil + export CSV filter

(() => {
  const el = (id) => document.getElementById(id);

  // Elements
  const dropInner = el('dropInner');
  const fileInput = el('fileInput');
  const fileMeta = el('fileMeta');
  const applyBtn = el('applyFilterBtn');
  const resetBtn = el('resetFilterBtn');
  const exportBtn = el('exportBtn');
  const exportVerificationBtn = el('exportVerificationBtn');
  const importVerificationBtn = el('importVerificationBtn');
  const verificationFileInput = el('verificationFileInput');
  const markAllVerifiedBtn = el('markAllVerifiedBtn');
  const judulInput = el('judulInput');
  const tipeSelect = el('tipeSelect');
  const dosenInput = el('dosenInput');
  const dosenDatalist = el('dosenDatalist');
  const tableBody = el('tableBody');
  const autoApplyChk = el('autoApplyChk');
  const filtersSection = el('filtersSection');
  const tableSection = el('tableSection');
  const statsSection = el('statsSection');
  const summarySection = el('summarySection');
  const summaryCounts = el('summaryCounts');
  const filterSummary = el('filterSummary');
  const pageSizeSelect = el('pageSizeSelect');
  const paginationEl = el('pagination');
  const sourceInternalChk = el('sourceInternalChk');
  const sourceAllChk = el('sourceAllChk');

  let rawData = [];
  let filteredData = [];
  let uniqueDosen = [];
  let uniqueTipe = [];
  let verificationData = new Map(); // ID -> {verified: boolean, timestamp: string}
  let pageSize = 5;
  let currentPage = 1;

  // CSV columns expected
  const COLS = {
    id: 'ID',
    judul: 'Judul Artikel',
    penulis: 'Penulis',
    internal: 'Penulis Internal',
    tipe: 'Tipe Publikasi',
    venue: 'Nama Jurnal/Conference',
    tahun: 'Tahun Publikasi',
    link: 'Tautan Publikasi',
    valid: 'Validitas Artikel',
  };

  // Verification checks
  function checkDataIssues(row) {
    const issues = [];
    const link = (row[COLS.link] || '').toString().toLowerCase();
    const originalLink = (row[COLS.link] || '').toString();
    
    // 1. Check invalid links (basic validation)
    if (link && !link.match(/^https?:\/\/.+/)) {
      issues.push('Link tidak valid');
    }
    
    // 2. PDF links
    if (link.includes('.pdf')) {
      issues.push('Link PDF');
    }
    
    // 3. Semantic Scholar
    if (link.includes('semanticscholar.org')) {
      issues.push('Semantic Scholar');
    }
    
    // 4. ResearchGate
    if (link.includes('researchgate.net')) {
      issues.push('ResearchGate');
    }
    
    // 5. EBSCOhost
    if (link.includes('ebscohost')) {
      issues.push('EBSCOhost');
    }
    
    // 6. Library links
    if (link.includes('/lib/') || link.includes('library') || link.includes('perpustakaan')) {
      issues.push('Link Library');
    }
    
    // 7. IOS (book chapter indicator)
    if (link.includes('ios') && (link.includes('book') || link.includes('chapter'))) {
      issues.push('IOS Book Chapter');
    }
    
    // 8. AIP (proceedings indicator)
    if (link.includes('aip.org') || (link.includes('aip') && link.includes('proceeding'))) {
      issues.push('AIP Proceedings');
    }
    
    // 9. Download links
    if (link.includes('download')) {
      issues.push('Link Download');
    }
    
    // 10. Journal name inconsistency (basic check for obvious variations)
    const venue = (row[COLS.venue] || '').toString();
    if (venue.includes('IEEE') && !venue.includes('IEEE ')) {
      issues.push('Nama jurnal tidak seragam');
    }
    
    return issues;
  }

  // Helpers
  const normalizeName = (s) => (s || '').toString().trim();
  // Split authors by comma and drop numeric-only tokens (e.g., statistics "2020" or "12")
  const splitAuthors = (s) => normalizeName(s)
    .split(/\s*,\s*/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && !/^\d+(?:[.,]\d+)?$/.test(x));
  // Parse comma-separated dosen input; ignore empty and numeric-only tokens
  const parseInputDosen = (s) => normalizeName(s)
    .split(/\s*,\s*/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && !/^\d+(?:[.,]\d+)?$/.test(x));
  const isCSV = (file) => /\.csv$/i.test(file.name) || file.type === 'text/csv';

  function showFileMeta(file) {
    fileMeta.hidden = false;
    fileMeta.textContent = `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
  }

  function enableControls(enabled) {
    applyBtn.disabled = !enabled;
    resetBtn.disabled = !enabled;
    exportBtn.disabled = !enabled || filteredData.length === 0;
    exportVerificationBtn.disabled = !enabled;
    importVerificationBtn.disabled = !enabled;
    markAllVerifiedBtn.disabled = !enabled || filteredData.length === 0;
  }

  // Parse CSV
  function parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim(),
        complete: (res) => resolve(res.data),
        error: (err) => reject(err),
      });
    });
  }

  // Figure out which sources are enabled; if both unchecked, default to both true
  function getSourceFlags() {
    const internal = !!sourceInternalChk?.checked;
    const all = !!sourceAllChk?.checked;
    if (!internal && !all) return { internal: true, all: true };
    return { internal, all };
  }

  // Build dosen suggestions from selected source(s)
  function buildUniqueDosen() {
    const { internal, all } = getSourceFlags();
    const set = new Set();
    for (const row of rawData) {
      if (internal) splitAuthors(row[COLS.internal]).forEach((n) => set.add(n));
      if (all) splitAuthors(row[COLS.penulis]).forEach((n) => set.add(n));
    }
    uniqueDosen = Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));

    // Fill datalist
    dosenDatalist.innerHTML = '';
    for (const n of uniqueDosen) {
      const opt = document.createElement('option');
      opt.value = n;
      dosenDatalist.appendChild(opt);
    }
  }

  // Build unique tipe publikasi for select
  function buildUniqueTipe() {
    const set = new Set();
    for (const row of rawData) {
      const v = normalizeName(row[COLS.tipe]) || '';
      if (v) set.add(v);
    }
    uniqueTipe = Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
    tipeSelect.innerHTML = '<option value="">Semua</option>' + uniqueTipe.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  }

  // kept for backward usage removal — replaced with getSourceFlags

  function applyFilter() {
    const qJudul = (judulInput.value || '').trim().toLowerCase();
    const tipeVal = (tipeSelect.value || '').trim();
    const dosenVals = parseInputDosen(dosenInput.value || '');
    const { internal, all } = getSourceFlags();
    const verificationStatus = document.querySelector('input[name="verificationStatus"]:checked')?.value || 'all';

    filteredData = rawData.filter((row) => {
      // Judul filter (contains)
      const judulOk = !qJudul || (row[COLS.judul] || '').toString().toLowerCase().includes(qJudul);
      if (!judulOk) return false;

      // Tipe filter (exact match)
      const tipeOk = !tipeVal || normalizeName(row[COLS.tipe]) === tipeVal;
      if (!tipeOk) return false;

      // Dosen filter (OR across comma-entered names; match against union of selected sources)
      if (dosenVals.length > 0) {
        const namesSet = new Set();
        if (internal) splitAuthors(row[COLS.internal]).forEach((n) => namesSet.add(n));
        if (all) splitAuthors(row[COLS.penulis]).forEach((n) => namesSet.add(n));
        const dosenOk = dosenVals.some((q) => namesSet.has(q));
        if (!dosenOk) return false;
      }

      // Verification status filter
      const rowId = row[COLS.id];
      const isVerified = verificationData.has(rowId) && verificationData.get(rowId).verified;
      const issues = checkDataIssues(row);
      const hasIssues = issues.length > 0;
      
      if (verificationStatus === 'verified' && !isVerified) return false;
      if (verificationStatus === 'unverified' && isVerified) return false;
      if (verificationStatus === 'issues' && !hasIssues) return false;

      return true;
    });

  // Reset to first page after filtering
  currentPage = 1;
  updateAll();
  }

  function updateAll() {
    renderTable();
    renderCharts();
    renderSummary();
    enableControls(true);
  }

  // Filter summary below the table
  function renderSummary() {
    const total = rawData.length;
    const filt = filteredData.length;
    summaryCounts.textContent = `Menampilkan ${filt} dari ${total} baris`;
    const chips = [];
    if (judulInput.value) chips.push(`<span class="chip">Judul: ${escapeHtml(judulInput.value)}</span>`);
    if (tipeSelect.value) chips.push(`<span class="chip">Tipe: ${escapeHtml(tipeSelect.value)}</span>`);
    const dv = parseInputDosen(dosenInput.value || '');
    dv.forEach((d) => chips.push(`<span class="chip">Dosen: ${escapeHtml(d)}</span>`));
    filterSummary.innerHTML = chips.join(' ');
  }

  function escapeHtml(str) {
    return (str || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderTable() {
    if (!filteredData.length) {
      tableBody.innerHTML = `<tr><td colspan="11" class="muted">Tidak ada hasil untuk filter saat ini</td></tr>`;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    // Pagination window
    const total = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    const pageRows = filteredData.slice(startIdx, endIdx);

    const rowsHtml = pageRows.map((r) => {
      const rowId = r[COLS.id];
      const isVerified = verificationData.has(rowId) && verificationData.get(rowId).verified;
      const issues = checkDataIssues(r);
      const hasIssues = issues.length > 0;
      
      // Show the actual link URL with clickable link
      const linkUrl = r[COLS.link] || '';
      const linkDisplay = linkUrl ? 
        `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener" title="${escapeHtml(linkUrl)}">${escapeHtml(linkUrl.length > 50 ? linkUrl.substring(0, 47) + '...' : linkUrl)}</a>` : 
        '';
      
      // Make title clickable - single click copy, double click Google search
      const title = r[COLS.judul] || '';
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(title)}`;
      const titleDisplay = title ? 
        `<span class="title-link" data-title="${escapeHtml(title)}" data-google-url="${googleSearchUrl}" title="Klik sekali untuk copy | Klik 2x untuk mencari di Google: ${escapeHtml(title)}">${escapeHtml(title)}</span>` : 
        '';
      
      const verificationCheckbox = `<input type="checkbox" class="verification-checkbox" data-id="${escapeHtml(rowId)}" ${isVerified ? 'checked' : ''} />`;
      
      const issueIndicators = hasIssues ? 
        `<div class="issue-indicators">${issues.map(issue => `<span class="issue-indicator">${escapeHtml(issue)}</span>`).join('')}</div>` : 
        '<span class="verification-status verified">OK</span>';
      
      const rowClass = hasIssues ? 'has-issues' : (isVerified ? 'verified' : '');
      
      return `<tr class="${rowClass}">
        <td>${verificationCheckbox}</td>
        <td class="title-cell">${titleDisplay}</td>
        <td>${escapeHtml(r[COLS.internal])}</td>
        <td>${escapeHtml(r[COLS.tipe])}</td>
        <td>${escapeHtml(r[COLS.venue])}</td>
        <td class="link-cell">${linkDisplay}</td>
        <td>${issueIndicators}</td>
        <td>${escapeHtml(r[COLS.valid])}</td>
        <td>${escapeHtml(r[COLS.id])}</td>
        <td>${escapeHtml(r[COLS.penulis])}</td>
        <td>${escapeHtml(r[COLS.tahun])}</td>
      </tr>`;
    }).join('');

    tableBody.innerHTML = rowsHtml;

    // Add event listeners for verification checkboxes
    tableBody.querySelectorAll('.verification-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const rowId = e.target.getAttribute('data-id');
        const isChecked = e.target.checked;
        
        if (isChecked) {
          verificationData.set(rowId, {
            verified: true,
            timestamp: new Date().toISOString()
          });
        } else {
          verificationData.delete(rowId);
        }
        
        // Re-render table to update row styling
        renderTable();
        renderCharts();
      });
    });

    // Add click functionality for title links (single click = copy, double click = Google search)
    tableBody.querySelectorAll('.title-link').forEach(titleLink => {
      let clickTimer = null;
      let clickCount = 0;

      titleLink.addEventListener('click', (e) => {
        clickCount++;
        
        if (clickCount === 1) {
          // Wait for potential second click
          clickTimer = setTimeout(() => {
            // Single click - copy title
            const title = titleLink.getAttribute('data-title');
            copyTextToClipboard(title, true).then(() => {
              // Visual feedback for successful copy
              titleLink.style.backgroundColor = '#10b981';
              titleLink.style.color = 'white';
              setTimeout(() => {
                titleLink.style.backgroundColor = '';
                titleLink.style.color = '';
              }, 500);
            });
            clickCount = 0;
          }, 300); // 300ms delay to detect double click
        } else if (clickCount === 2) {
          // Double click - open Google search
          if (clickTimer) {
            clearTimeout(clickTimer);
          }
          const googleUrl = titleLink.getAttribute('data-google-url');
          window.open(googleUrl, '_blank', 'noopener');
          
          // Visual feedback for Google search
          titleLink.style.backgroundColor = '#2563eb';
          titleLink.style.color = 'white';
          setTimeout(() => {
            titleLink.style.backgroundColor = '';
            titleLink.style.color = '';
          }, 500);
          
          clickCount = 0;
        }
        
        e.preventDefault();
      });
    });

    // Render pagination controls
    renderPagination(total, totalPages, startIdx + 1, endIdx);
  }

  function renderPagination(total, totalPages, from, to) {
    if (!paginationEl) return;
    const mkBtn = (label, page, disabled = false, active = false) => {
      const cls = ['page-btn'];
      if (active) cls.push('active');
      if (disabled) return `<button class="${cls.join(' ')}" disabled>${label}</button>`;
      return `<button class="${cls.join(' ')}" data-page="${page}">${label}</button>`;
    };

    let html = `<span class="page-info">${from}-${to} dari ${total}</span>`;
    html += mkBtn('«', 1, currentPage === 1);
    html += mkBtn('‹', currentPage - 1, currentPage === 1);

    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
    for (let p = start; p <= end; p++) {
      html += mkBtn(String(p), p, false, p === currentPage);
    }

    html += mkBtn('›', currentPage + 1, currentPage === totalPages);
    html += mkBtn('»', totalPages, currentPage === totalPages);

    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('button[data-page]')?.forEach((b) => {
      b.addEventListener('click', () => {
        const p = parseInt(b.getAttribute('data-page'), 10);
        if (!Number.isNaN(p)) {
          currentPage = p;
          renderTable();
        }
      });
    });
  }

  function countBy(arr, keyFn) {
    const m = new Map();
    for (const item of arr) {
      const k = keyFn(item);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }

  function renderCharts() {
    // Verification stats
    const verificationStats = new Map([
      ['Sudah Diverifikasi', 0],
      ['Belum Diverifikasi', 0],
      ['Ada Potensi Masalah', 0]
    ]);
    
    filteredData.forEach(row => {
      const rowId = row[COLS.id];
      const isVerified = verificationData.has(rowId) && verificationData.get(rowId).verified;
      const issues = checkDataIssues(row);
      const hasIssues = issues.length > 0;
      
      if (isVerified) {
        verificationStats.set('Sudah Diverifikasi', verificationStats.get('Sudah Diverifikasi') + 1);
      } else {
        verificationStats.set('Belum Diverifikasi', verificationStats.get('Belum Diverifikasi') + 1);
      }
      
      if (hasIssues) {
        verificationStats.set('Ada Potensi Masalah', verificationStats.get('Ada Potensi Masalah') + 1);
      }
    });
    
    const verificationBody = document.getElementById('verificationStatsBody');
    verificationBody.innerHTML = Array.from(verificationStats.entries())
      .map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`) 
      .join('');

    // Issues stats
    const issuesMap = new Map();
    filteredData.forEach(row => {
      const issues = checkDataIssues(row);
      issues.forEach(issue => {
        issuesMap.set(issue, (issuesMap.get(issue) || 0) + 1);
      });
    });
    
    const issuesBody = document.getElementById('issuesStatsBody');
    issuesBody.innerHTML = Array.from(issuesMap.entries())
      .sort((a,b) => b[1] - a[1])
      .map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`) 
      .join('');

    // Replace with stats tables
    const validMap = countBy(filteredData, (r) => normalizeName(r[COLS.valid]) || 'Tidak Diketahui');
    const validBody = document.getElementById('validitasStatsBody');
    validBody.innerHTML = Array.from(validMap.entries())
      .sort((a,b) => b[1] - a[1])
      .map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`) 
      .join('');

    const tipeMap = countBy(filteredData, (r) => normalizeName(r[COLS.tipe]) || 'Tidak Diketahui');
    const tipeBody = document.getElementById('tipeStatsBody');
    tipeBody.innerHTML = Array.from(tipeMap.entries())
      .sort((a,b) => b[1] - a[1])
      .map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`) 
      .join('');
  }

  function exportCSV() {
    if (!filteredData.length) return;
    // Enforce header/column order
    const fields = [COLS.id, COLS.judul, COLS.penulis, COLS.internal, COLS.tipe, COLS.venue, COLS.tahun, COLS.link, COLS.valid];
    const data = filteredData.map((r) => ({
      [COLS.id]: r[COLS.id] ?? '',
      [COLS.judul]: r[COLS.judul] ?? '',
      [COLS.penulis]: r[COLS.penulis] ?? '',
      [COLS.internal]: r[COLS.internal] ?? '',
      [COLS.tipe]: r[COLS.tipe] ?? '',
      [COLS.venue]: r[COLS.venue] ?? '',
      [COLS.tahun]: r[COLS.tahun] ?? '',
      [COLS.link]: r[COLS.link] ?? '',
      [COLS.valid]: r[COLS.valid] ?? '',
    }));
    const csv = Papa.unparse({ fields, data }, { quotes: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    a.download = `export-filter-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Copy helpers (TSV for spreadsheet-friendly paste)
  function rowsToTSV(rows) {
    const headers = ['Verifikasi', COLS.judul, COLS.internal, COLS.tipe, COLS.venue, COLS.link, 'Potensi Masalah', COLS.valid, COLS.id, COLS.penulis, COLS.tahun];
    const escapeField = (val) => (val ?? '').toString().replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    const lines = [headers.join('\t')];
    for (const r of rows) {
      const rowId = r[COLS.id];
      const isVerified = verificationData.has(rowId) && verificationData.get(rowId).verified;
      const issues = checkDataIssues(r);
      
      lines.push([
        isVerified ? 'Sudah' : 'Belum',
        escapeField(r[COLS.judul]), // Keep original title text for copy
        escapeField(r[COLS.internal]),
        escapeField(r[COLS.tipe]),
        escapeField(r[COLS.venue]),
        escapeField(r[COLS.link]),
        issues.join(', '),
        escapeField(r[COLS.valid]),
        escapeField(r[COLS.id]),
        escapeField(r[COLS.penulis]),
        escapeField(r[COLS.tahun])
      ].join('\t'));
    }
    return lines.join('\n');
  }

  // Export verification status to CSV
  function exportVerificationCSV() {
    const data = Array.from(verificationData.entries()).map(([id, info]) => ({
      ID: id,
      Verified: info.verified,
      Timestamp: info.timestamp
    }));
    
    const csv = Papa.unparse(data, { quotes: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    a.download = `verification-status-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import verification status from CSV
  function importVerificationCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim(),
        complete: (res) => {
          try {
            res.data.forEach(row => {
              const id = row.ID;
              const verified = row.Verified === 'true' || row.Verified === true;
              const timestamp = row.Timestamp || new Date().toISOString();
              
              if (id && verified) {
                verificationData.set(id, { verified, timestamp });
              }
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        error: (err) => reject(err),
      });
    });
  }

  // Mark all current page rows as verified
  function markAllCurrentPageVerified() {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, filteredData.length);
    const pageRows = filteredData.slice(startIdx, endIdx);
    
    pageRows.forEach(row => {
      const rowId = row[COLS.id];
      verificationData.set(rowId, {
        verified: true,
        timestamp: new Date().toISOString()
      });
    });
    
    updateAll();
  }

  async function copyTextToClipboard(text, isTitle = false) {
    try {
      await navigator.clipboard.writeText(text);
      if (isTitle) {
        // Don't show alert for title copy, just return success
        return Promise.resolve();
      } else {
        alert('Tabel disalin ke clipboard.');
        return Promise.resolve();
      }
    } catch (e) {
      // Fallback using temporary textarea
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { 
        document.execCommand('copy'); 
        if (isTitle) {
          return Promise.resolve();
        } else {
          alert('Tabel disalin ke clipboard.');
          return Promise.resolve();
        }
      } catch {} finally { 
        document.body.removeChild(ta); 
      }
    }
  }

  // No select options now; using datalist suggestions instead

  // Reset
  function resetAll() {
    judulInput.value = '';
    tipeSelect.value = '';
    dosenInput.value = '';
    filteredData = [...rawData];
    updateAll();
  }
  // selection counter no longer used

  // Drag & Drop Handling
  function handleFiles(files) {
    if (!files || !files.length) return;
    const file = files[0];
    if (!isCSV(file)) {
      alert('Mohon unggah file CSV.');
      return;
    }
    showFileMeta(file);
    parseCSV(file)
      .then((data) => {
        // Filter out empty rows and stop at statistik marker row
        const cleaned = [];
        for (const r of data) {
          const hasValues = Object.values(r).some((v) => (v || '').toString().trim() !== '');
          if (!hasValues) continue; // skip empty rows
          const firstColName = Object.keys(r)[0];
          const firstVal = (r[firstColName] || '').toString().trim().toLowerCase();
          if (firstVal === 'statistik nama jurnal/conference') break; // stop reading further
          cleaned.push(r);
        }
        rawData = cleaned;
        filteredData = [...rawData];
        buildUniqueDosen();
        buildUniqueTipe();

        // reveal sections
        filtersSection.classList.remove('hidden');
        tableSection.classList.remove('hidden');
        statsSection.classList.remove('hidden');
        summarySection.classList.remove('hidden');

        currentPage = 1;
        updateAll();
      })
      .catch((e) => {
        console.error(e);
        alert('Gagal membaca CSV. Pastikan format kolom sesuai.');
      });
  }

  dropInner.addEventListener('click', () => fileInput.click());
  dropInner.addEventListener('dragover', (e) => { e.preventDefault(); dropInner.classList.add('dragover'); });
  dropInner.addEventListener('dragleave', () => dropInner.classList.remove('dragover'));
  dropInner.addEventListener('drop', (e) => {
    e.preventDefault(); dropInner.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  applyBtn.addEventListener('click', applyFilter);
  resetBtn.addEventListener('click', resetAll);
  exportBtn.addEventListener('click', exportCSV);
  exportVerificationBtn.addEventListener('click', exportVerificationCSV);
  importVerificationBtn.addEventListener('click', () => verificationFileInput.click());
  markAllVerifiedBtn.addEventListener('click', markAllCurrentPageVerified);
  
  verificationFileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file && isCSV(file)) {
      importVerificationCSV(file)
        .then(() => {
          alert('Status verifikasi berhasil diimpor!');
          updateAll();
        })
        .catch((error) => {
          console.error(error);
          alert('Gagal mengimpor status verifikasi. Pastikan format CSV sesuai.');
        });
    }
  });
  // Source checkboxes
  ;[sourceInternalChk, sourceAllChk].forEach((c) => c?.addEventListener('change', () => {
    buildUniqueDosen();
    if (autoApplyChk.checked) applyFilter();
  }));
  // Auto-apply wires
  judulInput.addEventListener('input', () => { if (autoApplyChk.checked) applyFilter(); });
  tipeSelect.addEventListener('change', () => { if (autoApplyChk.checked) applyFilter(); });
  dosenInput.addEventListener('change', () => { if (autoApplyChk.checked) applyFilter(); });
  
  // Verification filter
  document.querySelectorAll('input[name="verificationStatus"]').forEach(radio => {
    radio.addEventListener('change', () => { if (autoApplyChk.checked) applyFilter(); });
  });
  pageSizeSelect?.addEventListener('change', () => {
    const val = parseInt(pageSizeSelect.value, 10);
    pageSize = Number.isNaN(val) ? 10 : val;
    currentPage = 1;
    renderTable();
  });

  // Copy buttons
  const copyPageBtn = document.getElementById('copyPageBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const copyValidStatsBtn = document.getElementById('copyValidStatsBtn');
  const copyTipeStatsBtn = document.getElementById('copyTipeStatsBtn');
  const copyVerificationStatsBtn = document.getElementById('copyVerificationStatsBtn');
  const copyIssuesStatsBtn = document.getElementById('copyIssuesStatsBtn');

  copyPageBtn?.addEventListener('click', () => {
    if (!filteredData.length) return;
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, filteredData.length);
    const tsv = rowsToTSV(filteredData.slice(startIdx, endIdx));
    copyTextToClipboard(tsv);
  });
  copyAllBtn?.addEventListener('click', () => {
    if (!filteredData.length) return;
    const tsv = rowsToTSV(filteredData);
    copyTextToClipboard(tsv);
  });
  copyValidStatsBtn?.addEventListener('click', () => {
    const validMap = countBy(filteredData, (r) => normalizeName(r[COLS.valid]) || 'Tidak Diketahui');
    const lines = ['Kategori\tJumlah', ...Array.from(validMap.entries()).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `${k}\t${v}`)];
    copyTextToClipboard(lines.join('\n'));
  });
  copyTipeStatsBtn?.addEventListener('click', () => {
    const tipeMap = countBy(filteredData, (r) => normalizeName(r[COLS.tipe]) || 'Tidak Diketahui');
    const lines = ['Kategori\tJumlah', ...Array.from(tipeMap.entries()).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `${k}\t${v}`)];
    copyTextToClipboard(lines.join('\n'));
  });
  copyVerificationStatsBtn?.addEventListener('click', () => {
    const verificationStats = new Map([['Sudah Diverifikasi', 0], ['Belum Diverifikasi', 0], ['Ada Potensi Masalah', 0]]);
    filteredData.forEach(row => {
      const rowId = row[COLS.id];
      const isVerified = verificationData.has(rowId) && verificationData.get(rowId).verified;
      const issues = checkDataIssues(row);
      if (isVerified) verificationStats.set('Sudah Diverifikasi', verificationStats.get('Sudah Diverifikasi') + 1);
      else verificationStats.set('Belum Diverifikasi', verificationStats.get('Belum Diverifikasi') + 1);
      if (issues.length > 0) verificationStats.set('Ada Potensi Masalah', verificationStats.get('Ada Potensi Masalah') + 1);
    });
    const lines = ['Status\tJumlah', ...Array.from(verificationStats.entries()).map(([k,v]) => `${k}\t${v}`)];
    copyTextToClipboard(lines.join('\n'));
  });
  copyIssuesStatsBtn?.addEventListener('click', () => {
    const issuesMap = new Map();
    filteredData.forEach(row => {
      checkDataIssues(row).forEach(issue => {
        issuesMap.set(issue, (issuesMap.get(issue) || 0) + 1);
      });
    });
    const lines = ['Jenis Masalah\tJumlah', ...Array.from(issuesMap.entries()).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `${k}\t${v}`)];
    copyTextToClipboard(lines.join('\n'));
  });

  // Initialize empty state
  enableControls(false);
})();
