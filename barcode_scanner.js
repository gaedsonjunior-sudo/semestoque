let codeReader;
let streamAtual;

async function iniciarScanner() {
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");

  modal.style.display = "block";

  try {
    // Primeiro tenta com a câmera traseira (environment)
    try {
      streamAtual = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
    } catch (err) {
      // Se falhar, tenta sem especificar a câmera
      console.log("Câmera traseira não disponível, usando padrão");
      streamAtual = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
    }

    video.srcObject = streamAtual;
    video.setAttribute("playsinline", true);
    
    // Aguarda o vídeo estar pronto
    await video.play();

    // Aguarda um pouco para a câmera estabilizar
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!codeReader) {
      codeReader = new ZXing.BrowserBarcodeReader();
    }

    // Inicia a leitura contínua
    codeReader.decodeFromVideoElement(video, (result, error) => {
      if (result) {
        console.log("Código detectado:", result.text);
        document.getElementById("codigoBarras").value = result.text;
        fecharScanner();
      }
      
      // Ignora erros de "not found" que são normais durante a leitura
      if (error && !(error instanceof ZXing.NotFoundException)) {
        console.error("Erro no scanner:", error);
      }
    });

  } catch (err) {
    console.error("Erro ao iniciar scanner:", err);
    alert("Não foi possível acessar a câmera. Verifique as permissões.");
    fecharScanner();
  }
}

function fecharScanner() {
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");
  
  modal.style.display = "none";

  // Para a leitura do código de barras
  if (codeReader) {
    codeReader.reset();
  }

  // Para o stream de vídeo
  if (streamAtual) {
    streamAtual.getTracks().forEach(track => {
      track.stop();
    });
    streamAtual = null;
  }

  // Limpa o srcObject do vídeo
  if (video.srcObject) {
    video.srcObject = null;
  }
}

// Fechar scanner ao pressionar ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    fecharScanner();
  }
});
