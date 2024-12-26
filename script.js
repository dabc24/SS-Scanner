// Access camera and start scanning
const video = document.getElementById('camera');
const startScanButton = document.getElementById('start-scan');
const resultContainer = document.getElementById('result');
const itemName = document.getElementById('item-name');
const itemPrice = document.getElementById('item-price');
const scannedItemsList = document.getElementById('scanned-items-list');

let scannedItems = [];

// Access the device camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
  } catch (err) {
    console.error('Error accessing camera: ', err);
  }
}

// Initialize barcode scanning with QuaggaJS
function initScanner() {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: video,
    },
    decoder: {
      readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader"],
    },
  }, function(err) {
    if (err) {
      console.log(err);
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected((result) => {
    const barcode = result.codeResult.code;
    fetchItemData(barcode);
  });
}

// Fetch item data from the mock-database.json file
function fetchItemData(barcode) {
  fetch('mock-database.json')
    .then(response => response.json())
    .then(database => {
      const item = database[barcode];
      if (item) {
        itemName.textContent = item.name;
        itemPrice.textContent = `$${item.price.toFixed(2)}`;
        updateScannedItems(item);
      } else {
        itemName.textContent = "Item not found";
        itemPrice.textContent = "N/A";
      }
    })
    .catch(err => {
      console.error('Error fetching product data:', err);
      itemName.textContent = "Error fetching item";
      itemPrice.textContent = "N/A";
    });
}

// Track scanned items on the client-side
function updateScannedItems(item) {
  scannedItems.push(item);
  localStorage.setItem('scannedItems', JSON.stringify(scannedItems));
  displayScannedItems();
}

// Display list of scanned items
function displayScannedItems() {
  scannedItemsList.innerHTML = '';
  scannedItems.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
    scannedItemsList.appendChild(li);
  });
}

// Load previous scanned items from localStorage
function loadScannedItems() {
  const savedItems = JSON.parse(localStorage.getItem('scannedItems')) || [];
  scannedItems = savedItems;
  displayScannedItems();
}

// Start the camera and barcode scanner when the button is clicked
startScanButton.addEventListener('click', () => {
  loadScannedItems();
  initScanner();
  startCamera();
});
