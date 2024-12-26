// Access camera and start scanning
const video = document.getElementById('camera');
const startScanButton = document.getElementById('start-scan');
const resultContainer = document.getElementById('result');
const itemName = document.getElementById('item-name');
const itemPrice = document.getElementById('item-price');
const scannedItemsList = document.getElementById('scanned-items-list');
const totalPriceDisplay = document.getElementById('total-price');
const resetButton = document.getElementById('reset-button');

let scannedItems = [];
let totalPrice = 0;

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
      target: video, // Targeting the video element
    },
    decoder: {
      readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader"], // Barcode types
    },
  }, function(err) {
    if (err) {
      console.log(err);
      return;
    }
    Quagga.start(); // Start scanning
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

// Track scanned items on the client-side and update total
function updateScannedItems(item) {
  scannedItems.push(item);
  totalPrice += item.price;
  localStorage.setItem('scannedItems', JSON.stringify(scannedItems));
  localStorage.setItem('totalPrice', totalPrice.toFixed(2));
  displayScannedItems();
  updateTotalPrice();
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

// Update the total price display
function updateTotalPrice() {
  totalPriceDisplay.textContent = `$${totalPrice.toFixed(2)}`;
}

// Load previous scanned items and total from localStorage
function loadScannedItems() {
  const savedItems = JSON.parse(localStorage.getItem('scannedItems')) || [];
  const savedTotalPrice = parseFloat(localStorage.getItem('totalPrice')) || 0;

  scannedItems = savedItems;
  totalPrice = savedTotalPrice;
  
  displayScannedItems();
  updateTotalPrice();
}

// Reset the scanned items and total price
function resetScannedItems() {
  scannedItems = [];
  totalPrice = 0;
  localStorage.removeItem('scannedItems');
  localStorage.removeItem('totalPrice');
  
  displayScannedItems();
  updateTotalPrice();
}

// Start the camera and barcode scanner when the button is clicked
startScanButton.addEventListener('click', () => {
  loadScannedItems();
  initScanner();
  startCamera();
});

// Reset scanned items and total when reset button is clicked
resetButton.addEventListener('click', () => {
  resetScannedItems();
});
