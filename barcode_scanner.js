let isScanning = false;
let lastDetectedCode = null;
let detectionCount = 0;
const REQUIRED_DETECTIONS = 2; // Precisa detectar 2 vezes o mesmo código para confirmar

window.iniciarScanner = function() {
  console.log("=== INICIANDO SCANNER QUAGGA ===");
  
  const modal = document.getElementById("scannerModal");
  modal.style.display = "block";
  isScanning = true;
  lastDetectedCode = null;
  detectionCount = 0;

  // Configuração do Quagga
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.getElementById('scannerVideo'),
      constraints: {
        facingMode: "environment",
        width: { min: 640, ideal: 1920 },
        height: { min: 480, ideal: 1080 }
      },
    },
    decoder: {
      readers: [
        "ean_reader",      // EAN-13, EAN-8 (mais comuns)
        "ean_8_reader",
        "code_128_reader", // Code 128
        "code_39_reader",  // Code 39
        "upc_reader",      // UPC-A, UPC-E
      ],
      multiple: false
    },
    locate: true,
    locator: {
      patchSize: "medium",
      halfSample: true
    },
    numOfWorkers: navigator.hardwareConcurrency || 4,
    frequency: 10,
  }, function(err) {
    if (err) {
      console.error("Erro ao inicializar Quagga:", err);
      alert("Erro ao acessar a câmera: " + err.message + "\n\nVerifique se:\n1. Você deu permissão para a câmera\n2. Está usando HTTPS ou localhost\n3. Nenhum outro app está usando a câmera");
      fecharScanner();
      return;
    }
    
    console.log("✅ Quagga inicializado com sucesso");
    Quagga.start();
    
    // Adiciona overlay visual
    adicionarOverlayVisual();
  });

  // Evento de detecção
  Quagga.onDetected(function(result) {
    if (!isScanning) return;

    const code = result.codeResult.code;
    const format = result.codeResult.format;
    
    console.log("📷 Código detectado:", code, "Formato:", format);

    // Sistema de confirmação - precisa ler o mesmo código várias vezes
    if (code === lastDetectedCode) {
      detectionCount++;
      console.log(`✓ Confirmação ${detectionCount}/${REQUIRED_DETECTIONS}`);
      
      if (detectionCount >= REQUIRED_DETECTIONS) {
        console.log("✅ Código confirmado:", code);
        
        // Feedback sonoro (vibração no mobile)
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        // Feedback visual de sucesso
        mostrarFeedbackSucesso(code);
        
        // Preenche o campo
        document.getElementById("codigoBarras").value = code;
        
        // Aguarda um pouco para o usuário ver o feedback
        setTimeout(function() {
          fecharScanner();
        }, 800);
      }
    } else {
      lastDetectedCode = code;
      detectionCount = 1;
    }

    // Desenha o retângulo verde ao redor do código detectado
    desenharDeteccao(result);
  });

  // Evento de processamento (mostra retângulo enquanto procura)
  Quagga.onProcessed(function(result) {
    if (!isScanning) return;
    
    var drawingCtx = Quagga.canvas.ctx.overlay;
    var drawingCanvas = Quagga.canvas.dom.overlay;

    if (result) {
      // Limpa o canvas
      drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      
      if (result.boxes) {
        // Desenha caixas de detecção em vermelho (procurando)
        result.boxes.filter(function(box) {
          return box !== result.box;
        }).forEach(function(box) {
          Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {
            color: "rgba(255, 0, 0, 0.5)",
            lineWidth: 2
          });
        });
      }

      if (result.box) {
        // Desenha a caixa principal em amarelo (encontrou algo)
        Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {
          color: "rgba(255, 255, 0, 0.8)",
          lineWidth: 3
        });
      }
    }
  });
}

function desenharDeteccao(result) {
  var drawingCtx = Quagga.canvas.ctx.overlay;
  var drawingCanvas = Quagga.canvas.dom.overlay;

  drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

  // Desenha retângulo verde quando detecta o código
  if (result.line) {
    Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {
      color: 'rgba(0, 255, 0, 0.9)',
      lineWidth: 5
    });
  }

  if (result.box) {
    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {
      color: 'rgba(0, 255, 0, 0.9)',
      lineWidth: 4
    });
  }

  if (result.codeResult && result.codeResult.code) {
    // Mostra o código detectado na tela
    drawingCtx.font = "bold 28px Arial";
    drawingCtx.fillStyle = "#00FF00";
    drawingCtx.shadowColor = "black";
    drawingCtx.shadowBlur = 10;
    drawingCtx.fillText(result.codeResult.code, 20, 50);
  }
}

function mostrarFeedbackSucesso(code) {
  var modal = document.getElementById("scannerModal");
  var feedback = document.createElement('div');
  feedback.style.position = 'absolute';
  feedback.style.top = '50%';
  feedback.style.left = '50%';
  feedback.style.transform = 'translate(-50%, -50%)';
  feedback.style.backgroundColor = 'rgba(0, 255, 0, 0.95)';
  feedback.style.color = '#000';
  feedback.style.padding = '30px 50px';
  feedback.style.borderRadius = '15px';
  feedback.style.fontSize = '28px';
  feedback.style.fontWeight = 'bold';
  feedback.style.zIndex = '10001';
  feedback.style.boxShadow = '0 0 20px rgba(0,255,0,0.8)';
  feedback.style.textAlign = 'center';
  feedback.innerHTML = '✓ Código Lido!<br><span style="font-size: 20px;">' + code + '</span>';
  
  modal.appendChild(feedback);
  
  setTimeout(function() {
    if (feedback.parentNode) {
      feedback.remove();
    }
  }, 800);
}

function adicionarOverlayVisual() {
  var modal = document.getElementById("scannerModal");
  
  // Remove guia antiga se existir
  var guiaAntiga = document.getElementById('scanner-guia');
  if (guiaAntiga) {
    guiaAntiga.remove();
  }
  
  var guia = document.createElement('div');
  guia.id = 'scanner-guia';
  guia.style.position = 'absolute';
  guia.style.top = '25%';
  guia.style.left = '10%';
  guia.style.width = '80%';
  guia.style.height = '30%';
  guia.style.border = '3px dashed rgba(255, 255, 255, 0.8)';
  guia.style.borderRadius = '10px';
  guia.style.zIndex = '10000';
  guia.style.pointerEvents = 'none';
  guia.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.5)';
  
  var texto = document.createElement('div');
  texto.style.position = 'absolute';
  texto.style.top = '-50px';
  texto.style.left = '50%';
  texto.style.transform = 'translateX(-50%)';
  texto.style.color = 'white';
  texto.style.fontSize = '18px';
  texto.style.fontWeight = 'bold';
  texto.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  texto.style.backgroundColor = 'rgba(0,0,0,0.7)';
  texto.style.padding = '12px 24px';
  texto.style.borderRadius = '8px';
  texto.style.whiteSpace = 'nowrap';
  texto.textContent = '📷 Posicione o código de barras aqui';
  
  guia.appendChild(texto);
  modal.appendChild(guia);
}

window.fecharScanner = function() {
  console.log("=== FECHANDO SCANNER ===");
  isScanning = false;
  lastDetectedCode = null;
  detectionCount = 0;
  
  var modal = document.getElementById("scannerModal");
  modal.style.display = "none";

  // Para o Quagga
  try {
    if (typeof Quagga !== 'undefined') {
      Quagga.stop();
      Quagga.offDetected();
      Quagga.offProcessed();
      console.log("✅ Quagga parado");
    }
  } catch (e) {
    console.log("Erro ao parar Quagga:", e);
  }

  // Remove a guia visual
  var guia = document.getElementById('scanner-guia');
  if (guia) {
    guia.remove();
  }
}

// Fechar scanner ao pressionar ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && isScanning) {
    fecharScanner();
  }
});
