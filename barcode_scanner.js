// ============================================
// SCANNER DE CÓDIGO DE BARRAS
// ============================================

let codeReader = null;
let selectedDeviceId = null;
let isScanning = false;

async function iniciarScanner() {
    const scannerContainer = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    const codigoInput = document.getElementById('codigoBarras');
    
    try {
        // Inicializa o leitor de código de barras
        codeReader = new ZXing.BrowserMultiFormatReader();
        
        // Mostra o container do scanner
        scannerContainer.style.display = 'block';
        
        // Lista os dispositivos de vídeo disponíveis
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
            showMessageModal('error', 'Nenhuma câmera encontrada no dispositivo.');
            scannerContainer.style.display = 'none';
            return;
        }
        
        // Tenta usar a câmera traseira (se disponível)
        selectedDeviceId = videoInputDevices[0].deviceId;
        for (let device of videoInputDevices) {
            if (device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('traseira')) {
                selectedDeviceId = device.deviceId;
                break;
            }
        }
        
        console.log('Usando câmera:', selectedDeviceId);
        isScanning = true;
        
        // Inicia a decodificação
        codeReader.decodeFromVideoDevice(selectedDeviceId, video, (result, err) => {
            if (result) {
                console.log('Código detectado:', result.text);
                
                // Preenche o campo com o código
                codigoInput.value = result.text;
                
                // Para o scanner
                pararScanner();
                
                // Mostra mensagem de sucesso
                showMessageModal('success', 'Código escaneado: ' + result.text);
                setTimeout(() => closeMessageModal(), 2000);
            }
            
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error('Erro ao escanear:', err);
            }
        });
        
    } catch (error) {
        console.error('Erro ao iniciar scanner:', error);
        showMessageModal('error', 'Erro ao acessar a câmera: ' + error.message);
        scannerContainer.style.display = 'none';
    }
}

function pararScanner() {
    const scannerContainer = document.getElementById('scannerContainer');
    
    if (codeReader) {
        codeReader.reset();
        codeReader = null;
    }
    
    isScanning = false;
    scannerContainer.style.display = 'none';
}

// Para o scanner se mudar de aba
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (isScanning) {
            pararScanner();
        }
    });
});
