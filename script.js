// Access elements
const video = document.getElementById('camera');
const cameraSelect = document.getElementById('camera-select');
const startScanButton = document.getElementById('start-scan');
const resetButton = document.getElementById('reset-button');
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
  const scannedList = document.getElementById("scanned-items-list");
  const listItem = document.createElement("li");
  listItem.textContent = `${item.name} - $${item.price.toFixed(2)}`;
  scannedList.appendChild(listItem);

  // Update total
  const totalPriceElement = document.getElementById("total-price");
  const totalPrice = scannedItems.reduce((total, currentItem) => total + currentItem.price, 0);
  totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
}

// Reset the application
resetButton.addEventListener("click", () => {
  stopCurrentStream();
  scannedItems = [];
  document.getElementById("scanned-items-list").innerHTML = "";
  document.getElementById("total-price").textContent = "$0.00";
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
