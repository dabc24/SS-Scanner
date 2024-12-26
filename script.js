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

// Load beep sounds
const successBeep = new Audio('success-beep.mp3');  // Path to the success beep sound
const failureBeep = new Audio('failure-beep.mp3');  // Path to the failure beep sound

// Access the device camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment", // Use the rear camera
        width: { ideal: 1280 }, // Set ideal width
        height: { ideal: 720 }, // Set ideal height
      }
    });
    video.srcObject = stream;
  } catch (err) {
    console.error('Error accessing camera: ', err);
  }
}

function initScanner() {
  // Ensure the video is available
  if (!video.srcObject) {
    console.error("Camera stream not available");
    return;
  }

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
      console.error('Quagga initialization failed:', err);
      return;
    }
    Quagga.start(); // Start scanning after initialization
  });

  Quagga.onDetected((result) => {
    const barcode = result.codeResult.code;
    handleScan(barcode);  // Process the scan result
  });
}


// Handle the scan result: recognized or not recognized
function handleScan(barcode) {
  fetchItemData(barcode);
  Quagga.stop();  // Stop scanning temporarily
  video.classList.add('dim');  // Dim the video for 0.5 seconds
  setTimeout(() => {
    Quagga.start();  // Restart scanning
    video.classList.remove('dim');  // Remove the dim effect
  }, 500);  // Pause for 0.5 seconds
}

// Fetch item data from the mock-database.json file
function fetchItemData(barcode) {
  fetch('mock-database.json')
    .then(response => response.json())
    .then(database => {
      const item = database[barcode];
      if (item) {
        // Item recognized
        successBeep.play();  // Play success beep
        itemName.textContent = item.name;
        itemPrice.textContent = `$${item.price.toFixed(2)}`;
        updateScannedItems(item);
      } else {
        // Item not recognized
        failureBeep.play();  // Play failure beep
        itemName.textContent = "Item not found";
        itemPrice.textContent = "N/A";
      }
    })
    .catch(err => {
      console.error('Error fetching product data:', err);
      itemName.textContent = "Error fetching item";
      itemPrice.textContent = "N/A";
      failureBeep.play();  // Play failure beep
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

  // Clear the item and price displays
  itemName.textContent = "";
  itemPrice.textContent = "";
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
