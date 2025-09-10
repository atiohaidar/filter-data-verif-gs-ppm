// Script untuk di-copy paste langsung ke console browser
(function() {
  // Function untuk extract text dari element
  function extractText(element) {
    return element ? element.textContent.trim() : '';
  }

  // Function untuk extract link dari element
  function extractLink(element) {
    return element && element.querySelector('a') ? element.querySelector('a').href : '';
  }

  // Array untuk menyimpan semua data publikasi
  const publications = [];

  // Cari semua modal publikasi
  const publicationModals = document.querySelectorAll('[id^="modal-default-"]');
  console.log(`Menemukan ${publicationModals.length} publikasi`);

  // Proses setiap modal
  publicationModals.forEach(modal => {
    // Dapatkan ID dari modal
    const modalId = modal.id.replace('modal-default-', '');
    
    // Extract data dari modal
    const publication = {
      id: modalId,
      title: '',
      authors: '',
      internalAuthors: '',
      publicationType: '',
      journalName: '',
      publicationYear: '',
      publicationLink: '',
      validitasArtikel: '' // Tambahan untuk validitas artikel
    };

    // Extract judul
    const titleElement = modal.querySelector('tr:nth-child(1) td:nth-child(2) .text-wrap');
    publication.title = extractText(titleElement);

    // Extract penulis
    const authorsElement = modal.querySelector('tr:nth-child(2) td:nth-child(2) .text-wrap');
    publication.authors = extractText(authorsElement);

    // Extract penulis internal
    const internalAuthorsElement = modal.querySelector('tr:nth-child(3) td:nth-child(2) .text-wrap');
    publication.internalAuthors = extractText(internalAuthorsElement);

    // Extract tipe publikasi
    const publicationTypeId = `tipePublikasiDisp_${modalId}`;
    const publicationTypeElement = document.getElementById(publicationTypeId)?.querySelector('td:nth-child(2)');
    publication.publicationType = extractText(publicationTypeElement);

    // Extract nama jurnal/conference
    const journalNameId = `namaJurnalDisp_${modalId}`;
    const journalNameElement = document.getElementById(journalNameId)?.querySelector('td:nth-child(2) .text-wrap');
    publication.journalName = extractText(journalNameElement);

    // Extract tahun publikasi
    const pubYearId = `thnPubDisp_${modalId}`;
    const pubYearElement = document.getElementById(pubYearId)?.querySelector('td:nth-child(2)');
    publication.publicationYear = extractText(pubYearElement);

    // Extract link publikasi
    const linkId = `tautanDisp_${modalId}`;
    const linkElement = document.getElementById(linkId)?.querySelector('td:nth-child(2) .text-wrap');
    publication.publicationLink = extractLink(linkElement);

    // Extract validitas artikel (radio button)
    // Cari input radio dengan name="validArtikel" di dalam modal
    const validitasRadio = modal.querySelector('input[type="radio"][name="validArtikel"]:checked');
    if (validitasRadio) {
      publication.validitasArtikel = validitasRadio.value === '1' ? 'Valid' : 'Tidak Valid';
    } else {
      publication.validitasArtikel = '';
    }

    // Tambahkan publikasi ke array
    publications.push(publication);
  });

  // Output hasil
  console.log('Data Publikasi yang berhasil diekstrak:');
  console.log(JSON.stringify(publications, null, 2));
  
  // Generate dan download CSV otomatis
  // Buat konten CSV
  const headers = ['ID', 'Judul Artikel', 'Penulis', 'Penulis Internal', 'Tipe Publikasi', 
                  'Nama Jurnal/Conference', 'Tahun Publikasi', 'Tautan Publikasi', 'Validitas Artikel'];
  let csvContent = headers.join(',') + '\n';

  publications.forEach(pub => {
    // Escape fields yang mungkin berisi koma
    const escapedFields = [
      pub.id,
      `"${pub.title.replace(/"/g, '""')}"`,
      `"${pub.authors.replace(/"/g, '""')}"`,
      `"${pub.internalAuthors.replace(/"/g, '""')}"`,
      `"${pub.publicationType.replace(/"/g, '""')}"`,
      `"${pub.journalName.replace(/"/g, '""')}"`,
      pub.publicationYear,
      `"${pub.publicationLink.replace(/"/g, '""')}"`,
      pub.validitasArtikel
    ];
    csvContent += escapedFields.join(',') + '\n';
  });
  
  // Hitung statistik Nama Jurnal/Conference unik
  const journalStats = {};
  publications.forEach(pub => {
    const name = pub.journalName || '-';
    if (journalStats[name]) {
      journalStats[name] += 1;
    } else {
      journalStats[name] = 1;
    }
  });

  // Hitung statistik domain web dari publicationLink
  function extractDomain(url) {
    if (!url) return '-';
    try {
      // Hilangkan " di awal/akhir jika ada
      url = url.replace(/^"|"$/g, '');
      const a = document.createElement('a');
      a.href = url;
      let domain = a.hostname || '';
      if (!domain) {
        // Fallback: regex ambil domain
        const match = url.match(/^(?:https?:\/\/)?([^\/]+)/i);
        domain = match ? match[1] : url;
      }
      // Hilangkan awalan www. jika ada
      domain = domain.replace(/^www\./i, '');
      return domain || '-';
    } catch {
      return url;
    }
  }
  const domainStats = {};
  publications.forEach(pub => {
    const domain = extractDomain(pub.publicationLink);
    if (domainStats[domain]) {
      domainStats[domain] += 1;
    } else {
      domainStats[domain] = 1;
    }
  });

  // Tambahkan statistik ke bagian bawah CSV (dengan header baru di kolom kanan), urut dari jumlah terbanyak dan beri ranking
  csvContent += '\nStatistik Nama Jurnal/Conference, , ,Jumlah\n';
  csvContent += 'Ranking,"Nama Jurnal/Conference",,Jumlah\n';
  Object.entries(journalStats)
    .sort((a, b) => b[1] - a[1]) // urutkan dari jumlah terbanyak
    .forEach(([name, count], idx) => {
      // Pastikan nama jurnal diapit petik dan escape petik ganda
      csvContent += `${idx + 1},"${name.replace(/"/g, '""')}",,${count}\n`;
    });

  // Tambahkan statistik domain web
  csvContent += '\nStatistik Domain Web, , ,Jumlah\n';
  csvContent += 'Ranking,"Domain Web",,Jumlah\n';
  Object.entries(domainStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count], idx) => {
      csvContent += `${idx + 1},"${domain.replace(/"/g, '""')}",,${count}\n`;
    });

  // Minta nama file dari user
  let fileName = prompt('Masukkan nama file untuk diunduh (tanpa ekstensi):', 'data_publikasi');
  if (!fileName) {
    fileName = 'data_publikasi';
  }
  fileName = fileName.trim() + '.csv';

  // Tambahkan BOM UTF-8 agar karakter non-latin terbaca di Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Buat link download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log('File CSV diunduh dengan nama: ' + fileName);
  
  // Return hasil untuk inspeksi di console
  // Tambahan: simpan ke localStorage dan buka web filter
  try {
    localStorage.setItem('publikasiData', JSON.stringify(publications));
    window.open('https://atiohaidar.github.io/filter-data-verif-gs-ppm/', '_blank');
    console.log('Data publikasi disimpan ke localStorage dan web filter dibuka.');
  } catch (e) {
    console.warn('Gagal simpan ke localStorage:', e);
  }
  return publications;
})();