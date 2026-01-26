let codeReader = null;

function iniciarScanner() {
  const container = document.getElementById("scannerContainer");
  const video = document.getElementById("scannerVideo");

  container.style.display = "block";

  codeReader = new ZXing.BrowserBarcodeReader();

  codeReader.decodeFromVideoDevice(null, video, (result, err) => {
    if (result) {
      document.getElementById("codigoBarras").value = result.text;
      pararScanner();
    }
  });
}

function pararScanner() {
  if (codeReader) {
    codeReader.reset();
  }
  document.getElementById("scannerContainer").style.display = "none";
}
