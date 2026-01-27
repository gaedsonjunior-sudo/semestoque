let codeReader;
let streamAtual;
let isScanning = false;

window.iniciarScanner = async function() {
  console.log("=== INICIANDO SCANNER ===");
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");

  modal.style.display = "block";
  isScanning = true;

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
      console.log("Câmera traseira iniciada");
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
    console.log("Vídeo iniciado");

    // Aguarda um pouco para a câmera estabilizar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Cria um novo leitor a cada vez para evitar problemas
    codeReader = new ZXing.BrowserBarcodeReader();
    console.log("ZXing inicializado");

    // Inicia a leitura contínua com callback
    console.log("Iniciando leitura de códigos...");
    
    codeReader.decodeFromVideoDevice(undefined, video, (result, error) => {
      if (result && isScanning) {
        console.log("✅ Código detectado:", result.text);
        document.getElementById("codigoBarras").value = result.text;
        fecharScanner();
      }
      
      // Log apenas erros que não são "not found"
      if (error && !(error instanceof ZXing.NotFoundException)) {
        console.error("Erro no scanner:", error);
      }
    });

  } catch (err) {
    console.error("❌ Erro ao iniciar scanner:", err);
    alert("Não foi possível acessar a câmera. Verifique as permissões.");
    fecharScanner();
  }
}

window.fecharScanner = function() {
  console.log("=== FECHANDO SCANNER ===");
  isScanning = false;
  
  const modal = document.getElementById("scannerModal");
  const video = document.getElementById("scannerVideo");
  
  modal.style.display = "none";

  // Para a leitura do código de barras
  if (codeReader) {
    try {
      codeReader.reset();
      console.log("CodeReader resetado");
    } catch (e) {
      console.log("Erro ao resetar codeReader:", e);
    }
  }

  // Para o stream de vídeo
  if (streamAtual) {
    streamAtual.getTracks().forEach(track => {
      track.stop();
    });
    streamAtual = null;
    console.log("Stream parado");
  }

  // Limpa o srcObject do vídeo
  if (video && video.srcObject) {
    video.srcObject = null;
  }
}

// Fechar scanner ao pressionar ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isScanning) {
    fecharScanner();
  }
});
