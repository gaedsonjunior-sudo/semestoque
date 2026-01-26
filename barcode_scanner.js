let codeReader;

async function iniciarScanner() {
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");

  modal.style.display = "block";

  if (!codeReader) {
    codeReader = new ZXing.BrowserBarcodeReader();
  }

  const devices = await ZXing.BrowserCodeReader.listVideoInputDevices();

  // tenta pegar a câmera traseira
  const backCamera =
    devices.find(d => d.label.toLowerCase().includes("back")) ||
    devices[devices.length - 1];

  codeReader.decodeFromVideoDevice(
    backCamera.deviceId,
    video,
    (result, err) => {
      if (result) {
        document.getElementById("codigo").value = result.text;
        fecharScanner();
      }
    }
  );
}

function fecharScanner() {
  const modal = document.getElementById("scannerModal");
  modal.style.display = "none";

  if (codeReader) {
    codeReader.reset();
  }
}
