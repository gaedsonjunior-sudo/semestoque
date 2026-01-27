let html5QrCode = null;

window.iniciarScanner = async function() {
  console.log("=== INICIANDO SCANNER ===");
  
  const modal = document.getElementById("scannerModal");
  modal.style.display = "block";
  
  // Limpa o container
  const container = document.getElementById('scannerVideo');
  container.innerHTML = '<div id="reader" style="width: 100%; max-width: 600px;"></div>';
  
  try {
    // Cria instância do Html5Qrcode
    html5QrCode = new Html5Qrcode("reader");
    
    console.log("Solicitando câmera...");
    
    // Inicia a câmera
    await html5QrCode.start(
      { facingMode: "environment" }, // Usa câmera traseira
      {
        fps: 10,
        qrbox: { width: 300, height: 150 },
        aspectRatio: 1.0,
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
    
    // Adiciona estilo ao reader
    setTimeout(() => {
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.style.border = 'none';
        
        // Adiciona dica de uso
        const dica = document.createElement('div');
        dica.style.color = 'white';
        dica.style.textAlign = 'center';
        dica.style.padding = '20px';
        dica.style.fontSize = '16px';
        dica.innerHTML = '📷 Posicione o código de barras no retângulo vermelho<br><small>Mantenha estável por alguns segundos</small>';
        container.insertBefore(dica, readerElement);
      }
    }, 500);
    
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
