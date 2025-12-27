/********************************************************************
 * SISTEM PERSURATAN SEDERHANA
 * - Import Kode Master dari Excel
 * - Generate Nomor Surat (ANTI DOUBLE CLICK)
 * - Reset Nomor per Tahun
 * - Simpan & Arsip ke LocalStorage
 * - CRUD Arsip
 * - Export PDF Surat & Arsip
 ********************************************************************/

/* =========================
   AMBIL ELEMENT DOM
========================= */
const uploadExcel = document.getElementById("uploadExcel");
const subSelect = document.getElementById("sub");
const subSubSelect = document.getElementById("subSub");
const uraianInput = document.getElementById("uraian");
const nomorInput = document.getElementById("nomorSurat");

const btnGenerate = document.getElementById("generate");
const btnSave = document.getElementById("save");
const btnPdf = document.getElementById("pdf");

const tabelSurat = document.getElementById("tabelSurat");

/* =========================
   VARIABEL GLOBAL
========================= */
let kodeMaster = [];
let sudahGenerate = false; // 🔒 kunci generate
const tahunSekarang = new Date().getFullYear();

/* =========================
   LOAD DATA DARI LOCALSTORAGE
========================= */
const savedKode = localStorage.getItem("kodeMaster");
if (savedKode) {
  kodeMaster = JSON.parse(savedKode);
  isiDropdownSub();
}

tampilkanTabelSurat();

/* =========================
   UPLOAD & BACA EXCEL
========================= */
uploadExcel.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    console.log("Contoh baris Excel:", rows[0]);

    kodeMaster = rows
      .map((row) => ({
        sub: (row.SUB || row.Sub || "").trim(),
        subSub: (row.SUB_SUB || row["SUB SUB"] || "").trim(),
        uraian: (row.URAIAN || row.Uraian || "").trim(),
      }))
      .filter((row) => row.sub && row.subSub);

    if (kodeMaster.length === 0) {
      alert("Format Excel tidak sesuai. Header wajib: SUB, SUB_SUB, URAIAN");
      return;
    }

    localStorage.setItem("kodeMaster", JSON.stringify(kodeMaster));
    isiDropdownSub();
    alert("Kode Master berhasil dimuat");
  };

  reader.readAsArrayBuffer(file);
});

/* =========================
   ISI DROPDOWN SUB
========================= */
function isiDropdownSub() {
  subSelect.innerHTML = `<option value="">Pilih SUB</option>`;
  subSubSelect.innerHTML = `<option value="">Pilih SUB-SUB</option>`;
  subSubSelect.disabled = true;

  uraianInput.value = "";
  nomorInput.value = "";
  resetGenerate();

  const subUnik = [...new Set(kodeMaster.map((k) => k.sub))];
  subUnik.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    subSelect.appendChild(opt);
  });
}

/* =========================
   EVENT SUB DIPILIH
========================= */
subSelect.addEventListener("change", () => {
  subSubSelect.innerHTML = `<option value="">Pilih SUB-SUB</option>`;
  subSubSelect.disabled = false;
  uraianInput.value = "";
  nomorInput.value = "";
  resetGenerate();

  kodeMaster
    .filter((k) => k.sub === subSelect.value)
    .forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k.subSub;
      opt.textContent = k.subSub;
      subSubSelect.appendChild(opt);
    });
});

/* =========================
   EVENT SUB-SUB DIPILIH
========================= */
subSubSelect.addEventListener("change", () => {
  const data = kodeMaster.find((k) => k.sub === subSelect.value && k.subSub === subSubSelect.value);

  uraianInput.value = data ? data.uraian : "";
  nomorInput.value = "";
  resetGenerate();
});

/* =========================
   GENERATE NOMOR SURAT
   (ANTI DOUBLE CLICK)
========================= */
btnGenerate.addEventListener("click", () => {
  if (sudahGenerate) {
    alert("Nomor surat sudah dibuat. Silakan simpan terlebih dahulu.");
    return;
  }

  if (!subSelect.value || !subSubSelect.value) {
    alert("Lengkapi SUB dan SUB-SUB terlebih dahulu");
    return;
  }

  let counter = JSON.parse(localStorage.getItem("counter")) || {};
  if (!counter[tahunSekarang]) counter[tahunSekarang] = 0;

  counter[tahunSekarang]++;
  localStorage.setItem("counter", JSON.stringify(counter));

  nomorInput.value = `WP.18.PAS.PAS.8.${subSelect.value}.${subSubSelect.value}-${counter[tahunSekarang]}`;

  sudahGenerate = true;
  btnGenerate.disabled = true; // 🔒 kunci tombol
});

/* =========================
   SIMPAN SURAT (CREATE)
========================= */
btnSave.addEventListener("click", () => {
  if (!nomorInput.value) {
    alert("Nomor surat belum dibuat");
    return;
  }

  const arsip = JSON.parse(localStorage.getItem("arsipSurat")) || [];

  arsip.push({
    sub: subSelect.value,
    subSub: subSubSelect.value,
    uraian: uraianInput.value,
    nomor: nomorInput.value,
    tanggal: new Date().toLocaleDateString(),
  });

  localStorage.setItem("arsipSurat", JSON.stringify(arsip));

  tampilkanTabelSurat();
  alert("Surat berhasil disimpan");

  // reset form setelah simpan
  nomorInput.value = "";
  resetGenerate();
});

/* =========================
   RESET STATUS GENERATE
========================= */
function resetGenerate() {
  sudahGenerate = false;
  btnGenerate.disabled = false;
}

/* =========================
   TAMPILKAN ARSIP (READ)
========================= */
function tampilkanTabelSurat() {
  tabelSurat.innerHTML = "";

  const arsip = JSON.parse(localStorage.getItem("arsipSurat")) || [];

  arsip.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.nomor}</td>
      <td>${item.uraian}</td>
      <td>${item.tanggal}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="editSurat(${index})">
          Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="hapusSurat(${index})">
          Hapus
        </button>
      </td>
    `;

    tabelSurat.appendChild(tr);
  });
}

/* =========================
   UPDATE (EDIT URAIAN)
========================= */
window.editSurat = function (index) {
  const arsip = JSON.parse(localStorage.getItem("arsipSurat")) || [];
  const data = arsip[index];

  const uraianBaru = prompt("Edit uraian surat:", data.uraian);
  if (!uraianBaru) return;

  arsip[index].uraian = uraianBaru;
  localStorage.setItem("arsipSurat", JSON.stringify(arsip));
  tampilkanTabelSurat();
};

/* =========================
   DELETE (HAPUS DATA)
========================= */
window.hapusSurat = function (index) {
  if (!confirm("Yakin ingin menghapus surat ini?")) return;

  const arsip = JSON.parse(localStorage.getItem("arsipSurat")) || [];
  arsip.splice(index, 1);
  localStorage.setItem("arsipSurat", JSON.stringify(arsip));
  tampilkanTabelSurat();
};

/* =========================
   EXPORT PDF SURAT (SINGLE)
========================= */
btnPdf.addEventListener("click", () => {
  if (!nomorInput.value) {
    alert("Nomor surat belum dibuat");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("SURAT KELUAR", 20, 20);

  doc.setFontSize(11);
  doc.text(`Nomor   : ${nomorInput.value}`, 20, 40);
  doc.text(`Uraian  : ${uraianInput.value}`, 20, 55);
  doc.text(`Tanggal : ${new Date().toLocaleDateString()}`, 20, 70);

  doc.save("surat-keluar.pdf");
});

document.getElementById("btnBackup").addEventListener("click", () => {
  const backup = {
    kodeMaster: JSON.parse(localStorage.getItem("kodeMaster")) || [],
    arsipSurat: JSON.parse(localStorage.getItem("arsipSurat")) || [],
    counter: JSON.parse(localStorage.getItem("counter")) || {},
    auditTrail: JSON.parse(localStorage.getItem("auditTrail")) || [],
    createdAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "backup-persuratan.json";
  link.click();
});

document.getElementById("restoreFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm("Data saat ini akan diganti. Lanjutkan restore?")) {
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const data = JSON.parse(evt.target.result);

      localStorage.setItem("kodeMaster", JSON.stringify(data.kodeMaster || []));
      localStorage.setItem("arsipSurat", JSON.stringify(data.arsipSurat || []));
      localStorage.setItem("counter", JSON.stringify(data.counter || {}));
      localStorage.setItem("auditTrail", JSON.stringify(data.auditTrail || []));

      alert("Restore berhasil. Halaman akan dimuat ulang.");
      location.reload();
    } catch (err) {
      alert("File backup tidak valid.");
    }
  };

  reader.readAsText(file);
});

/* =========================
   RESET DATA (PASSWORD)
========================= */
const btnReset = document.getElementById("btnReset");

// 🔐 password reset (ganti sesuai kebutuhan)
const RESET_PASSWORD = "admin123"; // ❗ GANTI INI

btnReset.addEventListener("click", () => {
  const input = prompt("Masukkan password reset:");

  if (input === null) return; // batal

  if (input !== RESET_PASSWORD) {
    alert("Password salah!");
    return;
  }

  const yakin = confirm("PERINGATAN!\n\n" + "- Nomor surat akan direset\n" + "- Arsip surat akan dihapus\n\n" + "Kode master TIDAK dihapus.\n\n" + "Lanjutkan?");

  if (!yakin) return;

  // reset data penting
  localStorage.removeItem("counter");
  localStorage.removeItem("arsipSurat");

  alert("Data berhasil direset.\nHalaman akan dimuat ulang.");
  location.reload();
});
