let codeReader;

function iniciarScanner() {
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");

  modal.style.display = "block";

  if (!codeReader) {
    codeReader = new ZXing.BrowserBarcodeReader();
  }

  codeReader.decodeFromVideoDevice(null, video, (result, err) => {
    if (result) {
      document.getElementById("codigo").value = result.text;
      fecharScanner();
    }
  });
}

function fecharScanner() {
  const modal = document.getElementById("scannerModal");
  modal.style.display = "none";

  if (codeReader) {
    codeReader.reset();
  }
}
