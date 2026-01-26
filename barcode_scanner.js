let codeReader;
let streamAtual;

async function iniciarScanner() {
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");

  modal.style.display = "block";

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
  document.getElementById("scannerModal").style.display = "none";

  if (codeReader) codeReader.reset();

  if (streamAtual) {
    streamAtual.getTracks().forEach(t => t.stop());
    streamAtual = null;
  }
}
