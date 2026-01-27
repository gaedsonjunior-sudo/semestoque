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
        aspectRatio: { min: 1, max: 2 },
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 }
      },
      area: { // Define área de leitura (toda a tela)
        top: "0%",
        right: "0%",
        left: "0%",
        bottom: "0%"
      }
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
      patchSize: "large",
      halfSample: false
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
    
    // Ajusta o CSS dos elementos criados pelo Quagga
    ajustarCSSCamera();
    
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

function ajustarCSSCamera() {
  // Espera um pouco para os elementos serem criados
  setTimeout(function() {
    // Pega todos os elementos video e canvas criados pelo Quagga
    var videos = document.querySelectorAll('#scannerVideo video');
    var canvases = document.querySelectorAll('#scannerVideo canvas');
    
    // Ajusta o vídeo
    videos.forEach(function(video) {
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.position = 'absolute';
      video.style.top = '0';
      video.style.left = '0';
    });
    
    // Ajusta os canvas
    canvases.forEach(function(canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
    });
    
    console.log("✅ CSS da câmera ajustado");
  }, 500);
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
  guia.style.top = '50%';
  guia.style.left = '50%';
  guia.style.transform = 'translate(-50%, -50%)';
  guia.style.width = '80%';
  guia.style.maxWidth = '500px';
  guia.style.height = '200px';
  guia.style.border = '3px dashed rgba(255, 255, 255, 0.9)';
  guia.style.borderRadius = '10px';
  guia.style.zIndex = '10000';
  guia.style.pointerEvents = 'none';
  guia.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.4)';
  
  var texto = document.createElement('div');
  texto.style.position = 'absolute';
  texto.style.top = '-60px';
  texto.style.left = '50%';
  texto.style.transform = 'translateX(-50%)';
  texto.style.color = 'white';
  texto.style.fontSize = '16px';
  texto.style.fontWeight = 'bold';
  texto.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  texto.style.backgroundColor = 'rgba(0,0,0,0.7)';
  texto.style.padding = '12px 24px';
  texto.style.borderRadius = '8px';
  texto.style.whiteSpace = 'nowrap';
  texto.textContent = '📷 Centralize o código de barras na área';
  
  var dica = document.createElement('div');
  dica.style.position = 'absolute';
  dica.style.bottom = '-50px';
  dica.style.left = '50%';
  dica.style.transform = 'translateX(-50%)';
  dica.style.color = 'white';
  dica.style.fontSize = '14px';
  dica.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  dica.style.backgroundColor = 'rgba(0,0,0,0.6)';
  dica.style.padding = '8px 16px';
  dica.style.borderRadius = '6px';
  dica.style.whiteSpace = 'nowrap';
  dica.textContent = 'Mantenha estável por 2 segundos';
  
  guia.appendChild(texto);
  guia.appendChild(dica);
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
