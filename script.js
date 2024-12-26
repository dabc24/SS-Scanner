// Access elements
const video = document.getElementById('camera');
const startScanButton = document.getElementById('start-scan');
const cycleCameraButton = document.getElementById('cycle-camera');
const resultContainer = document.getElementById('result');
const itemName = document.getElementById('item-name');
const itemPrice = document.getElementById('item-price');
const scannedItemsList = document.getElementById('scanned-items-list');
const totalPriceDisplay = document.getElementById('total-price');
const resetButton = document.getElementById('reset-button');
const dimOverlay = document.getElementById('dim-overlay');
const successSound = document.getElementById('success-sound');
const errorSound = document.getElementById('error-sound');

let scannedItems = [];
let totalPrice = 0;
let scanningPaused = false;
let mediaStream;
let currentCameraIndex = 0;  // Track which camera is currently being used
let videoDevices = [];  // Store all video devices (cameras)

// Access the device camera
async function startCamera() {
  try {
    // Get all devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices = devices.filter(device => device.kind === 'videoinput'); // Filter only video devices

    if (videoDevices.length === 0) {
      console.error('No video devices found');
      return;
    }

    // Log available video devices for debugging
    console.log("Available video devices:", videoDevices);

    // Get the current camera and its deviceId
    const constraints = {
      video: {
        deviceId: { exact: videoDevices[currentCameraIndex].deviceId }
      }
    };

    // Stop any previous stream if exists
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    // Start the new camera stream
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = mediaStream;
  } catch (err) {
    console.error('Error accessing camera: ', err);
  }
}

// Cycle through the available cameras
function cycleCamera() {
  if (videoDevices.length === 0) {
    console.log('No video devices available');
    return;
  }

  // Update the current camera index
  currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;

  // Log the index of the current camera for debugging
  console.log("Current camera index:", currentCameraIndex);

  // Restart the camera with the new device
  startCamera();
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
    if (!scanningPaused) {
      fetchItemData(barcode);
    }
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
        playSound('success');
        updateScannedItems(item);
        pauseScanning();
        dimScanner();
      } else {
        itemName.textContent = "Item not found";
        itemPrice.textContent = "N/A";
        playSound('error');
      }
    })
    .catch(err => {
      console.error('Error fetching product data:', err);
      itemName.textContent = "Error fetching item";
      itemPrice.textContent = "N/A";
      playSound('error');
    });
}

// Play sound based on recognition result
function playSound(type) {
  if (type === 'success') {
    successSound.play();
  } else {
    errorSound.play();
  }
}

// Pause scanning for 0.5 seconds
function pauseScanning() {
  scanningPaused = true;
  setTimeout(() => {
    scanningPaused = false;
  }, 500);
}

// Dim the scanner screen for 0.5 seconds
function dimScanner() {
  dimOverlay.style.display = 'block';
  setTimeout(() => {
    dimOverlay.style.display = 'none';
  }, 500);
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
  co
