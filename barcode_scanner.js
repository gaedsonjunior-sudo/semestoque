let html5QrCode = null;

window.iniciarScanner = async function() {
  console.log("=== INICIANDO SCANNER ===");
  
  const modal = document.getElementById("scannerModal");
  modal.style.display = "block";
  
  // Limpa o container e prepara layout centralizado
  const container = document.getElementById('scannerVideo');
  container.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100%;
    ">
      <div id="reader" style="width: 90%; max-width: 500px;"></div>
    </div>
  `;
  
  try {
    // Cria instância do Html5Qrcode
    html5QrCode = new Html5Qrcode("reader");
    
    console.log("Solicitando câmera...");
    
    // Inicia a câmera
    await html5QrCode.start(
      { facingMode: "environment" }, // Usa câmera traseira
      {
        fps: 10,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
          // Retângulo responsivo - 70% da largura, altura fixa
          let qrboxWidth = Math.min(viewfinderWidth * 0.7, 300);
          return {
            width: qrboxWidth,
            height: 150
          };
        },
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
      (decodedText, decodedResult) => {
        // Sucesso ao ler código
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
        setTimeout(() => {
          fecharScanner();
        }, 1000);
      },
      (errorMessage) => {
        // Erro de leitura - ignora (é normal não ler sempre)
      }
    );
    
    console.log("✅ Scanner iniciado com sucesso!");
    
  } catch (err) {
    console.error("❌ Erro ao iniciar câmera:", err);
    alert("Erro ao acessar a câmera: " + err + "\n\nVerifique se:\n1. Você deu permissão para a câmera\n2. Está usando HTTPS ou localhost\n3. Nenhum outro app está usando a câmera");
    fecharScanner();
  }
}

function mostrarFeedbackSucesso(code) {
  const feedback = document.createElement('div');
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
  
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.remove();
    }
  }, 1000);
}

window.fecharScanner = async function() {
  console.log("=== FECHANDO SCANNER ===");
  
  const modal = document.getElementById("scannerModal");
  
  // Para o scanner
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      console.log("✅ Scanner parado");
    } catch (e) {
      console.log("Erro ao parar scanner:", e);
    }
    html5QrCode = null;
  }
  
  // Limpa o container
  const container = document.getElementById('scannerVideo');
  if (container) {
    container.innerHTML = '';
  }
  
  modal.style.display = "none";
}

// Fechar scanner ao pressionar ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    fecharScanner();
  }
});
