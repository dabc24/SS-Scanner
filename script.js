// Access elements
const video = document.getElementById('camera');
const cameraSelect = document.getElementById('camera-select');
const startScanButton = document.getElementById('start-scan');
const resetButton = document.getElementById('reset-button');
const scannedItemsList = document.getElementById('scanned-items-list');
const totalPriceDisplay = document.getElementById('total-price');
let mediaStream = null;
let videoDevices = []; // Store all video devices
let mockDatabase = {}; // Store mock database after fetching

// Stop the current video stream
function stopCurrentStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    console.log("Stopped current camera stream.");
  }
}

// Start the camera with the selected device
async function startCamera(deviceId) {
  try {
    // Stop the current stream before starting a new one
    stopCurrentStream();

    // Set video constraints
    const constraints = {
      video: { deviceId: { exact: deviceId } },
    };

    // Start the new camera stream
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = mediaStream;

    console.log("Camera started with device:", deviceId);
  } catch (err) {
    console.error("Error accessing camera:", err);
    alert("Unable to access the selected camera.");
  }
}

// Populate the camera selection dropdown
async function populateCameraSelection() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices = devices.filter(device => device.kind === "videoinput");

    // Clear the dropdown
    cameraSelect.innerHTML = "";

    // Populate dropdown with available cameras
    videoDevices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    console.log("Camera selection populated.");
  } catch (err) {
    console.error("Error populating camera selection:", err);
    alert("Unable to retrieve camera devices.");
  }
}

// Handle camera selection change
cameraSelect.addEventListener("change", () => {
  const selectedDeviceId = cameraSelect.value;
  if (selectedDeviceId) {
    startCamera(selectedDeviceId);
  }
});

// Fetch the mock database
async function fetchMockDatabase() {
  try {
    const response = await fetch('mock-database.json');
    if (!response.ok) {
      throw new Error('Failed to load the mock database.');
    }
    mockDatabase = await response.json();
    console.log("Mock database loaded.");
  } catch (err) {
    console.error("Error loading mock database:", err);
    alert("Unable to load the product database.");
  }
}

// Lookup barcode in the mock database
function fetchItemData(barcode) {
  const item = mockDatabase[barcode];
  if (item) {
    updateScannedItems(item);
    dimScanner(); // Dim the screen for 0.5 seconds
    console.log(`Scanned: ${item.name} - $${item.price.toFixed(2)}`);
  } else {
    console.log("Item not found for barcode:", barcode);
    alert("Item not found.");
  }
}

// Track scanned items and update the display
let scannedItems = [];
function updateScannedItems(item) {
  scannedItems.push(item);

  // Update the UI
  const listItem = document.createElement("li");
  listItem.textContent = `${item.name} - $${item.price.toFixed(2)}`;
  scannedItemsList.appendChild(listItem);

  // Update total price
  const totalPrice = scannedItems.reduce((total, currentItem) => total + currentItem.price, 0);
  totalPriceDisplay.textContent = `$${totalPrice.toFixed(2)}`;
}

// Dim the scanner screen for 0.5 seconds
function dimScanner() {
  const dimOverlay = document.getElementById('dim-overlay'); // Ensure the element exists
  if (!dimOverlay) {
    console.error("Dim overlay element not found.");
    return;
  }

  dimOverlay.style.display = 'block';
  setTimeout(() => {
    dimOverlay.style.display = 'none';
  }, 500);
}

// Reset the application
resetButton.addEventListener("click", () => {
  stopCurrentStream();
  scannedItems = [];
  scannedItemsList.innerHTML = "";
  totalPriceDisplay.textContent = "$0.00";
  console.log("Application reset.");
});

// Initialize the application
async function init() {
  await fetchMockDatabase();
  await populateCameraSelection();

  if (videoDevices.length > 0) {
    // Start with the first available camera
    startCamera(videoDevices[0].deviceId);
    cameraSelect.value = videoDevices[0].deviceId;
  } else {
    alert("No cameras available.");
  }
}

// Start the application on page load
document.addEventListener("DOMContentLoaded", init);
