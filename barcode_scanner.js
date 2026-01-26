let codeReader;
let streamAtual;

async function iniciarScanner() {
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");

  modal.style.display = "block";

  // força câmera traseira
  streamAtual = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { exact: "environment" } },
    audio: false
  });

  video.srcObject = streamAtual;
  video.setAttribute("playsinline", true);
  await video.play();

  if (!codeReader) {
    codeReader = new ZXing.BrowserBarcodeReader();
  }

  codeReader.decodeFromVideoElement(video, result => {
    if (result) {
      document.getElementById("codigo").value = result.text;
      fecharScanner();
    }
  });
}

function fecharScanner() {
  const modal = document.getElementById("scannerModal");
  modal.style.display = "none";

  if (codeReader) codeReader.reset();

  if (streamAtual) {
    streamAtual.getTracks().forEach(track => track.stop());
    streamAtual = null;
  }
}
