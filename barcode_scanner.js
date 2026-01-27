let html5QrcodeScanner = null;

window.iniciarScanner = function() {
  console.log("=== INICIANDO SCANNER ===");
  
  const modal = document.getElementById("scannerModal");
  modal.style.display = "block";
  
  // Cria o container do scanner se não existir
  let scannerContainer = document.getElementById('reader');
  if (!scannerContainer) {
    scannerContainer = document.createElement('div');
    scannerContainer.id = 'reader';
    scannerContainer.style.width = '100%';
    scannerContainer.style.height = '100%';
    document.getElementById('scannerVideo').appendChild(scannerContainer);
  }
  
  // Configuração do scanner
  html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { 
      fps: 10,
      qrbox: { width: 300, height: 150 },
      aspectRatio: 1.777778,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ]
    },
    false // verbose
  );

  // Callback quando detecta o código
  function onScanSuccess(decodedText, decodedResult) {
    console.log("✅ Código detectado:", decodedText);
    
    // Vibração
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    // Preenche o campo
    document.getElementById("codigoBarras").value = decodedText;
    
    // Mostra feedback
    mostrarFeedbackSucesso(decodedText);
    
    // Fecha o scanner
    setTimeout(function() {
      fecharScanner();
    }, 1000);
  }

  function onScanFailure(error) {
    // Ignora erros de "not found" que são normais
  }

  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  
  console.log("Scanner renderizado");
}

function mostrarFeedbackSucesso(code) {
  var modal = document.getElementById("scannerModal");
  var feedback = document.createElement('div');
  feedback.style.position = 'fixed';
  feedback.style.top = '50%';
  feedback.style.left = '50%';
  feedback.style.transform = 'translate(-50%, -50%)';
  feedback.style.backgroundColor = 'rgba(0, 255, 0, 0.95)';
  feedback.style.color = '#000';
  feedback.style.padding = '30px 50px';
  feedback.style.borderRadius = '15px';
  feedback.style.fontSize = '28px';
  feedback.style.fontWeight = 'bold';
  feedback.style.zIndex = '99999';
  feedback.style.boxShadow = '0 0 20px rgba(0,255,0,0.8)';
  feedback.style.textAlign = 'center';
  feedback.innerHTML = '✓ Código Lido!<br><span style="font-size: 20px;">' + code + '</span>';
  
  document.body.appendChild(feedback);
  
  setTimeout(function() {
    if (feedback.parentNode) {
      feedback.remove();
    }
  }, 1000);
}

window.fecharScanner = function() {
  console.log("=== FECHANDO SCANNER ===");
  
  const modal = document.getElementById("scannerModal");
  modal.style.display = "none";

  // Para o scanner
  if (html5QrcodeScanner) {
    try {
      html5QrcodeScanner.clear();
      console.log("✅ Scanner parado");
    } catch (e) {
      console.log("Erro ao parar scanner:", e);
    }
    html5QrcodeScanner = null;
  }
  
  // Remove o container do reader
  const reader = document.getElementById('reader');
  if (reader) {
    reader.remove();
  }
}

// Fechar scanner ao pressionar ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    fecharScanner();
  }
});
