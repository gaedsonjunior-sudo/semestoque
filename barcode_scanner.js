let isScanning = false;
let lastDetectedCode = null;
let detectionCount = 0;
const REQUIRED_DETECTIONS = 3; // Precisa detectar 3 vezes o mesmo código para confirmar

window.iniciarScanner = async function() {
  console.log("=== INICIANDO SCANNER QUAGGA ===");
  
  const modal = document.getElementById("scannerModal");
  modal.style.display = "block";
  isScanning = true;
  lastDetectedCode = null;
  detectionCount = 0;

  try {
    // Solicita permissão da câmera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    
    console.log("Câmera autorizada");

    // Configuração do Quagga
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.getElementById('scannerVideo'),
        constraints: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      },
      decoder: {
        readers: [
          "ean_reader",      // EAN-13, EAN-8
          "code_128_reader", // Code 128
          "code_39_reader",  // Code 39
          "upc_reader",      // UPC-A, UPC-E
          "ean_8_reader",
          "code_39_vin_reader"
        ],
        multiple: false
      },
      locate: true, // Ativa a localização visual do código
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 4,
      frequency: 10,
      area: { // Define área de leitura (centro da tela)
        top: "20%",
        right: "10%",
        left: "10%",
        bottom: "20%"
      }
    }, (err) => {
      if (err) {
        console.error("Erro ao inicializar Quagga:", err);
        alert("Erro ao iniciar a câmera: " + err);
        fecharScanner();
        return;
      }
      console.log("Quagga inicializado com sucesso");
      Quagga.start();
      
      // Adiciona overlay visual
      adicionarOverlayVisual();
    });

    // Evento de detecção
    Quagga.onDetected((result) => {
      if (!isScanning) return;

      const code = result.codeResult.code;
      console.log("Código detectado:", code, "Confiança:", result.codeResult.decodedCodes);

      // Sistema de confirmação - precisa ler o mesmo código várias vezes
      if (code === lastDetectedCode) {
        detectionCount++;
        console.log(`Confirmação ${detectionCount}/${REQUIRED_DETECTIONS}`);
        
        if (detectionCount >= REQUIRED_DETECTIONS) {
          console.log("✅ Código confirmado:", code);
          
          // Feedback visual de sucesso
          mostrarFeedbackSucesso();
          
          // Preenche o campo
          document.getElementById("codigoBarras").value = code;
          
          // Aguarda um pouco para o usuário ver o feedback
          setTimeout(() => {
            fecharScanner();
          }, 500);
        }
      } else {
        lastDetectedCode = code;
        detectionCount = 1;
      }

      // Desenha o retângulo verde ao redor do código detectado
      desenharDeteccao(result);
    });

    // Evento de processamento (mostra retângulo vermelho enquanto procura)
    Quagga.onProcessed((result) => {
      if (!isScanning) return;
      
      const drawingCtx = Quagga.canvas.ctx.overlay;
      const drawingCanvas = Quagga.canvas.dom.overlay;

      if (result) {
        // Limpa o canvas
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        
        if (result.boxes) {
          // Desenha caixas de detecção em vermelho (procurando)
          result.boxes.filter(box => box !== result.box).forEach(box => {
            Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {
              color: "red",
              lineWidth: 2
            });
          });
        }

        if (result.box) {
          // Desenha a caixa principal em amarelo (encontrou algo)
          Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {
            color: "yellow",
            lineWidth: 3
          });
        }
      }
    });

  } catch (err) {
    console.error("❌ Erro ao acessar câmera:", err);
    alert("Não foi possível acessar a câmera. Verifique as permissões.");
    fecharScanner();
  }
}

function desenharDeteccao(result) {
  const drawingCtx = Quagga.canvas.ctx.overlay;
  const drawingCanvas = Quagga.canvas.dom.overlay;

  drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

  // Desenha retângulo verde quando detecta o código
  if (result.line) {
    Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {
      color: '#00FF00',
      lineWidth: 5
    });
  }

  if (result.box) {
    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {
      color: '#00FF00',
      lineWidth: 4
    });
  }

  if (result.codeResult && result.codeResult.code) {
    // Mostra o código detectado na tela
    drawingCtx.font = "24px Arial";
    drawingCtx.fillStyle = "#00FF00";
    drawingCtx.fillText(result.codeResult.code, 10, 30);
  }
}

function mostrarFeedbackSucesso() {
  const modal = document.getElementById("scannerModal");
  const feedback = document.createElement('div');
  feedback.style.position = 'absolute';
  feedback.style.top = '50%';
  feedback.style.left = '50%';
  feedback.style.transform = 'translate(-50%, -50%)';
  feedback.style.backgroundColor = '#00FF00';
  feedback.style.color = '#000';
  feedback.style.padding = '20px 40px';
  feedback.style.borderRadius = '10px';
  feedback.style.fontSize = '24px';
  feedback.style.fontWeight = 'bold';
  feedback.style.zIndex = '10001';
  feedback.textContent = '✓ Código Lido!';
  
  modal.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 500);
}

function adicionarOverlayVisual() {
  // Adiciona guia visual no centro da tela
  const modal = document.getElementById("scannerModal");
  const guia = document.createElement('div');
  guia.id = 'scanner-guia';
  guia.style.position = 'absolute';
  guia.style.top = '30%';
  guia.style.left = '10%';
  guia.style.width = '80%';
  guia.style.height = '40%';
  guia.style.border = '3px dashed rgba(255, 255, 255, 0.7)';
  guia.style.borderRadius = '10px';
  guia.style.zIndex = '10000';
  guia.style.pointerEvents = 'none';
  
  const texto = document.createElement('div');
  texto.style.position = 'absolute';
  texto.style.top = '-40px';
  texto.style.left = '50%';
  texto.style.transform = 'translateX(-50%)';
  texto.style.color = 'white';
  texto.style.fontSize = '18px';
  texto.style.fontWeight = 'bold';
  texto.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  texto.style.backgroundColor = 'rgba(0,0,0,0.5)';
  texto.style.padding = '10px 20px';
  texto.style.borderRadius = '5px';
  texto.textContent = 'Posicione o código de barras aqui';
  
  guia.appendChild(texto);
  modal.appendChild(guia);
}

window.fecharScanner = function() {
  console.log("=== FECHANDO SCANNER ===");
  isScanning = false;
  lastDetectedCode = null;
  detectionCount = 0;
  
  const modal = document.getElementById("scannerModal");
  modal.style.display = "none";

  // Para o Quagga
  if (typeof Quagga !== 'undefined') {
    Quagga.stop();
    Quagga.offDetected();
    Quagga.offProcessed();
    console.log("Quagga parado");
  }

  // Remove a guia visual
  const guia = document.getElementById('scanner-guia');
  if (guia) {
    guia.remove();
  }
}

// Fechar scanner ao pressionar ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isScanning) {
    fecharScanner();
  }
});
