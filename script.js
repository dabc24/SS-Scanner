document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById('camera');
  const cameraSelect = document.getElementById('camera-select');
  const resetButton = document.getElementById('reset-button');
  const scannedItemsList = document.getElementById('scanned-items-list');
  const totalPriceDisplay = document.getElementById('total-price');
  let mediaStream = null;
  let videoDevices = [];
  let mockDatabase = {};

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
      stopCurrentStream();
      const constraints = { video: { deviceId: { exact: deviceId } } };
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
      cameraSelect.innerHTML = "";
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

  // Fetch the mock database
  async function fetchMockDatabase() {
    try {
      const response = await fetch('mock-database.json');
      if (!response.ok) throw new Error('Failed to load the mock database.');
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
      dimScanner();
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
    const listItem = document.createElement("li");
    listItem.textContent = `${item.name} - $${item.price.toFixed(2)}`;
    scannedItemsList.appendChild(listItem);
    const totalPrice = scannedItems.reduce((total, currentItem) => total + currentItem.price, 0);
    totalPriceDisplay.textContent = `$${totalPrice.toFixed(2)}`;
  }

  // Dim the scanner screen for 0.5 seconds
  function dimScanner() {
    const dimOverlay = document.getElementById('dim-overlay');
    if (!dimOverlay) {
      console.error("Dim overlay element not found.");
      return;
    }
    dimOverlay.style.display = 'block';
    setTimeout(() => {
      dimOverlay.style.display = 'none';
    }, 500);
  }

  // Reset button functionality
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      stopCurrentStream();
      scannedItems = [];
      scannedItemsList.innerHTML = "";
      totalPriceDisplay.textContent = "$0.00";
      console.log("Application reset.");
    });
  } else {
    console.error("Reset button not found.");
  }

  // Camera selection functionality
  if (cameraSelect) {
    cameraSelect.addEventListener("change", () => {
      const selectedDeviceId = cameraSelect.value;
      if (selectedDeviceId) {
        startCamera(selectedDeviceId);
      }
    });
  } else {
    console.error("Camera selection dropdown not found.");
  }

  // Initialize the application
  async function init() {
    await fetchMockDatabase();
    await populateCameraSelection();
    if (videoDevices.length > 0) {
      startCamera(videoDevices[0].deviceId);
      cameraSelect.value = videoDevices[0].deviceId;
    } else {
      alert("No cameras available.");
    }
  }

  // Start the application
  init();
});
