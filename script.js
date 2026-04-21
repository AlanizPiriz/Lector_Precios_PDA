let data = [];
    let typingTimer;

    // ---------- IndexedDB Helpers ----------
    const dbName = "ExcelDB";
    const storeName = "excelData";

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = function (event) {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async function saveDataToIndexedDB(data) {
      const db = await openDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.put({ id: 1, data });
      return tx.complete;
    }

    async function loadDataFromIndexedDB() {
      const db = await openDB();
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      return new Promise((resolve) => {
        const request = store.get(1);
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
        request.onerror = () => resolve(null);
      });
    }

    // ---------- Mostrar información del archivo cargado ----------
    function showFileInfo() {
      const info = JSON.parse(localStorage.getItem("lastFileInfo") || "null");
      if (info) {
        const div = document.getElementById("fileInfo");
        div.innerHTML = `📂 <b>${info.name}</b> (cargado: ${info.date})`;
      }
    }

    // ---------- Cargar datos guardados ----------
    window.addEventListener('load', async () => {
      const storedData = await loadDataFromIndexedDB();
      if (storedData) {
        data = storedData;
        document.getElementById('searchInput').disabled = false;
        document.getElementById('searchBtn').disabled = false;
        console.log("Datos restaurados desde IndexedDB ✅");
      }
      showFileInfo();
    });

    // ---------- Cargar archivo Excel ----------
    document.getElementById('excelFile').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async function(e) {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        data = XLSX.utils.sheet_to_json(sheet);

        // Guardar en IndexedDB
       await saveDataToIndexedDB(data);

        // Guardar nombre y fecha en localStorage
        localStorage.setItem("lastFileInfo", JSON.stringify({
          name: file.name,
          date: new Date().toLocaleString()
        }));

        alert(`Archivo "${file.name}" cargado correctamente ✅`);
        document.getElementById('searchInput').disabled = false;
        document.getElementById('searchBtn').disabled = false;
        document.getElementById('searchInput').focus();
        showFileInfo();
      };
      reader.readAsBinaryString(file);
    });

    // ---------- Buscar automáticamente ----------
    const input = document.getElementById('searchInput');
    input.addEventListener('input', function() {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        document.getElementById('searchBtn').click();
      }, 300);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('searchBtn').click();
      }
    });

    // ---------- Buscar producto ----------
    document.getElementById('searchBtn').addEventListener('click', function() {
      const term = document.getElementById('searchInput').value.trim().toLowerCase();
      if (!term) return;

      const resultDiv = document.getElementById('result');
      const infoDiv = document.getElementById('productInfo');
      const found = data.find(row =>
        Object.values(row).some(val => String(val).toLowerCase().includes(term))
      );

      	if (found) {
  	// Convertimos el objeto en un array de [key, value]
  	const entries = Object.entries(found);

  	// Separamos el PVP del resto
  	const pvpEntry = entries.find(([key]) => key.toLowerCase() === 'pvp');
 	const otherEntries = entries.filter(([key]) => key.toLowerCase() !== 'pvp');

  	// Armamos el HTML
  	let html = '';

  	// Primero el PVP en rojo (si existe)
  	if (pvpEntry) {
    	const [key, value] = pvpEntry;
    	html += `<b style="color:red;">${key}:</b> <span style="color:red;">${value}</span><br>`;
  	}

  	// Luego el resto normalmente
  	html += otherEntries
    	.map(([key, value]) => `<b>${key}:</b> ${value}`)
    	.join('<br>');

  	// Asignamos al contenedor
  	infoDiv.innerHTML = html;
        resultDiv.style.display = 'block';


        // ✅ Limpiar input y volver a enfocar automáticamente
        document.getElementById('searchInput').value = "";
        setTimeout(() => document.getElementById('searchInput').focus(), 300);

      } else {
        resultDiv.style.display = 'none';
        alert("Producto no encontrado ❌");
        //document.getElementById('searchInput').focus();
        document.getElementById('searchInput').value = "";
        setTimeout(() => document.getElementById('searchInput').focus(), 300);
      }
    });

    // ---------- Botones ----------
    document.getElementById('noBtn').addEventListener('click', function() {
      document.getElementById('searchInput').value = "";
      document.getElementById('result').style.display = 'none';
      document.getElementById('searchInput').focus();
    });

    let cbosTab; // Variable global

document.getElementById('yesBtn').addEventListener('click', function() {
  const url = "https://cbos.arcadiasuite.com/cbos/storeLabelGenerateFind.html";
  
  if (!cbosTab || cbosTab.closed) {
    cbosTab = window.open(url, "cbosTab");
  } else {
    cbosTab.focus();
  }
});