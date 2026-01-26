// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
const transferForm = document.getElementById('transferForm');
const submitBtn = document.getElementById('submitBtn');
const fotoInput = document.getElementById('foto');
const imagePreview = document.getElementById('imagePreview');
const fileLabel = document.getElementById('fileLabel');
const compressionInfo = document.getElementById('compressionInfo');
const quantidadeInput = document.getElementById('quantidade');
const editQuantidadeInput = document.getElementById('editQuantidade');
const codigoBarrasInput = document.getElementById('codigoBarras');
const editCodigoBarrasInput = document.getElementById('editCodigoBarras');

const messageModal = document.getElementById('messageModal');
const modalSpinner = document.getElementById('modalSpinner');
const modalStatusIcon = document.getElementById('modalStatusIcon');
const modalMessageText = document.getElementById('modalMessageText');

let allData = [];
let isDataLoaded = false;
let currentAction = '';
let currentItemId = null;
let currentItemData = null;
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');

// ============================================
// FUNÇÕES DE COMPRESSÃO DE IMAGEM
// ============================================

async function comprimirImagem(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                
                const originalSize = e.target.result.length;
                const compressedSize = compressedBase64.length;
                const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);
                
                resolve({
                    data: compressedBase64,
                    originalSize: (originalSize / 1024).toFixed(0),
                    compressedSize: (compressedSize / 1024).toFixed(0),
                    reduction: reduction
                });
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// FUNÇÕES DO FIREBASE
// ============================================

async function salvarImagemNoStorage(base64Data, codigoBarras) {
    try {
        const timestamp = Date.now();
        const fileName = `fotos/foto_${codigoBarras}_${timestamp}.jpg`;
        
        // Remove o prefixo data:image/jpeg;base64,
        const base64Clean = base64Data.split(',')[1];
        
        // Converte base64 para blob
        const byteCharacters = atob(base64Clean);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        // Faz upload para o Firebase Storage
        const storageRef = storage.ref(fileName);
        const snapshot = await storageRef.put(blob);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        return downloadURL;
    } catch (error) {
        console.error('Erro ao salvar imagem:', error);
        throw error;
    }
}

async function incluirDados(dados) {
    try {
        showMessageModal('loading', 'Salvando imagem...');
        
        // Salva a imagem no Storage
        const fotoUrl = await salvarImagemNoStorage(dados.foto, dados.codigoBarras);
        
        showMessageModal('loading', 'Salvando dados...');
        
        // Adiciona os dados ao Firestore
        const docRef = await db.collection('transferencias').add({
            fiscal: dados.fiscal,
            setor: dados.setor,
            codigoBarras: dados.codigoBarras,
            quantidade: dados.quantidade,
            fotoUrl: fotoUrl,
            baixa: 'PENDENTE',
            dataHora: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        });
        
        console.log('Documento criado com ID:', docRef.id);
        
        return { sucesso: true, mensagem: 'Dados inseridos com sucesso!' };
    } catch (error) {
        console.error('Erro em incluirDados:', error);
        return { sucesso: false, mensagem: 'Erro ao inserir dados: ' + error.message };
    }
}

async function buscarDados() {
    try {
        const snapshot = await db.collection('transferencias')
            .orderBy('createdAt', 'desc')
            .get();
        
        const dados = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            dados.push({
                id: doc.id,
                fiscal: data.fiscal || '',
                setor: data.setor || '',
                codigoBarras: data.codigoBarras || '',
                quantidade: formatarQuantidadeExibicao(data.quantidade),
                fotoUrl: data.fotoUrl || '',
                baixa: data.baixa || 'PENDENTE',
                dataHora: formatarDataHora(data.dataHora || data.createdAt)
            });
        });
        
        return dados;
    } catch (error) {
        console.error('Erro em buscarDados:', error);
        throw error;
    }
}

async function atualizarBaixa(id, status) {
    try {
        await db.collection('transferencias').doc(id).update({
            baixa: status ? 'OK' : 'PENDENTE'
        });
        
        return { sucesso: true, mensagem: 'Status atualizado com sucesso!' };
    } catch (error) {
        console.error('Erro em atualizarBaixa:', error);
        return { sucesso: false, mensagem: 'Erro ao atualizar status: ' + error.message };
    }
}

async function editarDados(id, novosDados) {
    try {
        const updateData = {};
        
        if (novosDados.fiscal) updateData.fiscal = novosDados.fiscal;
        if (novosDados.setor) updateData.setor = novosDados.setor;
        if (novosDados.codigoBarras) updateData.codigoBarras = novosDados.codigoBarras;
        if (novosDados.quantidade) updateData.quantidade = novosDados.quantidade;
        
        await db.collection('transferencias').doc(id).update(updateData);
        
        return { sucesso: true, mensagem: 'Dados atualizados com sucesso!' };
    } catch (error) {
        console.error('Erro em editarDados:', error);
        return { sucesso: false, mensagem: 'Erro ao atualizar dados: ' + error.message };
    }
}

async function excluirDados(id) {
    try {
        // Busca o documento para pegar a URL da foto
        const doc = await db.collection('transferencias').doc(id).get();
        
        if (doc.exists) {
            const data = doc.data();
            
            // Tenta excluir a foto do Storage
            if (data.fotoUrl) {
                try {
                    const fotoRef = storage.refFromURL(data.fotoUrl);
                    await fotoRef.delete();
                } catch (error) {
                    console.log('Erro ao excluir foto do Storage:', error);
                }
            }
            
            // Exclui o documento
            await db.collection('transferencias').doc(id).delete();
        }
        
        return { sucesso: true, mensagem: 'Dados excluídos com sucesso!' };
    } catch (error) {
        console.error('Erro em excluirDados:', error);
        return { sucesso: false, mensagem: 'Erro ao excluir dados: ' + error.message };
    }
}

function verificarSenha(senha) {
    return senha === CONFIG.SENHA_ADMIN;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatarQuantidadeExibicao(val) {
    if (typeof val === 'number') {
        return Number.isInteger(val) ? val.toString() : val.toFixed(3).replace('.', ',').replace(/,?0+$/, '');
    }
    const num = parseFloat(val.toString().replace(',', '.'));
    if (isNaN(num)) return val;
    return Number.isInteger(num) ? num.toString() : num.toFixed(3).replace('.', ',').replace(/,?0+$/, '');
}

function formatarDataHora(data) {
    try {
        let dateObj;
        
        if (data && data.toDate) {
            // Firestore Timestamp
            dateObj = data.toDate();
        } else if (data instanceof Date) {
            dateObj = data;
        } else if (typeof data === 'string') {
            dateObj = new Date(data);
        } else {
            return '';
        }
        
        return dateObj.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return '';
    }
}

// ============================================
// FUNÇÕES DE INTERFACE
// ============================================

function showMessageModal(type, message) {
    modalSpinner.style.display = 'none';
    modalStatusIcon.style.display = 'none';
    modalStatusIcon.className = 'status-icon';

    if (type === 'loading') {
        modalSpinner.style.display = 'block';
    } else if (type === 'success') {
        modalStatusIcon.style.display = 'block';
        modalStatusIcon.classList.add('success');
        modalStatusIcon.innerHTML = '&#10004;';
    } else if (type === 'error') {
        modalStatusIcon.style.display = 'block';
        modalStatusIcon.classList.add('error');
        modalStatusIcon.innerHTML = '&#10006;';
    }
    modalMessageText.textContent = message;
    messageModal.style.display = 'flex';
}

function closeMessageModal() {
    messageModal.style.display = 'none';
}

// ============================================
// FORMATAÇÃO DE CAMPOS
// ============================================

function formatarCodigoBarras(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
}

function formatarQuantidade(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value === '') {
        input.value = '';
        return;
    }
    
    while (value.length < 4) {
        value = '0' + value;
    }
    
    const parteInteira = value.slice(0, -3);
    const casasDecimais = value.slice(-3);
    const parteInteiraLimpa = parteInteira.replace(/^0+/, '') || '0';
    
    input.value = parteInteiraLimpa + ',' + casasDecimais;
}

// Event Listeners para formatação
codigoBarrasInput.addEventListener('input', function() {
    formatarCodigoBarras(this);
});

editCodigoBarrasInput.addEventListener('input', function() {
    formatarCodigoBarras(this);
});

quantidadeInput.addEventListener('input', function() {
    formatarQuantidade(this);
});

editQuantidadeInput.addEventListener('input', function() {
    formatarQuantidade(this);
});

// ============================================
// PREVIEW E COMPRESSÃO DA IMAGEM
// ============================================

fotoInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (file) {
        try {
            showMessageModal('loading', 'Processando imagem...');
            
            const resultado = await comprimirImagem(file);
            
            imagePreview.src = resultado.data;
            imagePreview.style.display = 'block';
            fileLabel.textContent = file.name;
            
            compressionInfo.style.display = 'block';
            compressionInfo.innerHTML = `
                ✅ Imagem otimizada: ${resultado.originalSize}KB → ${resultado.compressedSize}KB 
                (${resultado.reduction}% menor)
            `;
            
            fotoInput.compressedImage = resultado.data;
            
            closeMessageModal();
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            showMessageModal('error', 'Erro ao processar imagem. Tente novamente.');
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            compressionInfo.style.display = 'none';
        }
    } else {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        fileLabel.textContent = '📷 Tirar foto ou escolher da galeria';
        compressionInfo.style.display = 'none';
    }
});

// ============================================
// ENVIO DO FORMULÁRIO
// ============================================

transferForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    showMessageModal('loading', 'Enviando dados...');
    submitBtn.disabled = true;

    const file = fotoInput.files[0];
    
    if (!file) {
        showMessageModal('error', 'Por favor, selecione uma foto.');
        submitBtn.disabled = false;
        return;
    }

    const fotoComprimida = fotoInput.compressedImage;
    
    if (!fotoComprimida) {
        showMessageModal('error', 'Erro ao processar a imagem. Tente novamente.');
        submitBtn.disabled = false;
        return;
    }

    const dados = {
        fiscal: document.getElementById('fiscal').value,
        setor: document.getElementById('setor').value,
        codigoBarras: document.getElementById('codigoBarras').value,
        quantidade: document.getElementById('quantidade').value,
        foto: fotoComprimida
    };

    try {
        const response = await incluirDados(dados);
        
        if (response.sucesso) {
            showMessageModal('success', response.mensagem);
            transferForm.reset();
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            fileLabel.textContent = '📷 Tirar foto ou escolher da galeria';
            compressionInfo.style.display = 'none';
            fotoInput.compressedImage = null;
            
            if (document.getElementById('visualizar').classList.contains('active')) {
                setTimeout(() => carregarDados(), 1000);
            }
            
            setTimeout(() => {
                closeMessageModal();
            }, 3000);
        } else {
            showMessageModal('error', response.mensagem);
        }
    } catch (error) {
        console.error('Erro no envio:', error);
        showMessageModal('error', 'Erro ao enviar: ' + error.message);
    }
    
    submitBtn.disabled = false;
});

// ============================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tabContent => {
        tabContent.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tabButton => {
        tabButton.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add('active');

    if (tabId === 'visualizar' && !isDataLoaded) {
        carregarDados();
    }
}

// ============================================
// CARREGAR E FILTRAR DADOS
// ============================================

async function carregarDados() {
    showMessageModal('loading', 'Carregando dados...');
    
    try {
        const data = await buscarDados();
        console.log('Dados recebidos:', data);
        allData = data || [];
        isDataLoaded = true;
        filtrarEExibirDados();
        closeMessageModal();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showMessageModal('error', 'Erro ao carregar dados: ' + error.message);
        allData = [];
        filtrarEExibirDados();
    }
}

function filtrarEExibirDados() {
    const filtroFiscal = document.getElementById('filtroFiscal').value.toLowerCase();
    const filtroSetor = document.getElementById('filtroSetor').value;
    const filtroCodigo = document.getElementById('filtroCodigo').value.toLowerCase();
    const filtroBaixaOk = document.getElementById('filtroBaixaOk').checked;
    const filtroPendente = document.getElementById('filtroPendente').checked;

    let dadosFiltrados = allData.filter(item => {
        if (!item) return false;
        
        const matchFiscal = !filtroFiscal || (item.fiscal && item.fiscal.toLowerCase().includes(filtroFiscal));
        const matchSetor = filtroSetor === '' || item.setor === filtroSetor;
        const matchCodigo = !filtroCodigo || (item.codigoBarras && item.codigoBarras.toLowerCase().includes(filtroCodigo));
        
        let matchBaixa = true;
        if (filtroBaixaOk && filtroPendente) {
            matchBaixa = true;
        } else if (filtroBaixaOk) {
            matchBaixa = item.baixa === 'OK';
        } else if (filtroPendente) {
            matchBaixa = item.baixa === 'PENDENTE';
        }

        return matchFiscal && matchSetor && matchCodigo && matchBaixa;
    });

    const tbody = document.getElementById('dataTableBody');
    
    if (dadosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhum dado encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = dadosFiltrados.map(item => `
        <tr>
            <td>${item.fiscal || ''}</td>
            <td>${item.setor || ''}</td>
            <td>${item.codigoBarras || ''}</td>
            <td>${item.quantidade || 'N/A'}</td>
            <td>
                ${item.fotoUrl ? `<a href="${item.fotoUrl}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 500;">Ver Foto</a>` : 'N/A'}
            </td>
            <td>
                <span class="status-badge ${item.baixa === 'OK' ? 'status-ok' : 'status-pendente'}">
                    ${item.baixa || 'PENDENTE'}
                </span>
                <input type="checkbox" ${item.baixa === 'OK' ? 'checked' : ''} 
                       onchange="updateBaixaStatus('${item.id}', this.checked)" 
                       style="margin-left: 8px;">
            </td>
            <td>${item.dataHora || ''}</td>
            <td>
                <div class="actions">
                    <button class="btn-small btn-edit" onclick='requestEdit("${item.id}", ${JSON.stringify(item).replace(/'/g, "\\'")})'">Editar</button>
                    <button class="btn-small btn-delete" onclick='requestDelete("${item.id}")'>Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Event listeners para filtros
document.getElementById('filtroFiscal').addEventListener('input', filtrarEExibirDados);
document.getElementById('filtroSetor').addEventListener('change', filtrarEExibirDados);
document.getElementById('filtroCodigo').addEventListener('input', filtrarEExibirDados);
document.getElementById('filtroBaixaOk').addEventListener('change', filtrarEExibirDados);
document.getElementById('filtroPendente').addEventListener('change', filtrarEExibirDados);

// ============================================
// FUNÇÕES DE EDIÇÃO E EXCLUSÃO
// ============================================

function requestEdit(id, item) {
    currentAction = 'edit';
    currentItemId = id;
    currentItemData = item;
    passwordInput.value = '';
    passwordModal.classList.add('show');
}

function requestDelete(id) {
    currentAction = 'delete';
    currentItemId = id;
    passwordInput.value = '';
    passwordModal.classList.add('show');
}

function closePasswordModal() {
    passwordModal.classList.remove('show');
}

function validatePassword() {
    const senha = passwordInput.value;
    
    if (!senha) {
        showMessageModal('error', 'Digite a senha!');
        return;
    }

    if (verificarSenha(senha)) {
        closePasswordModal();
        
        if (currentAction === 'delete') {
            excluirItem(currentItemId);
        } else if (currentAction === 'edit') {
            openEditModal(currentItemData);
        }
    } else {
        showMessageModal('error', 'Senha incorreta!');
    }
}

passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        validatePassword();
    }
});

async function excluirItem(id) {
    showMessageModal('loading', 'Excluindo item...');
    
    try {
        const response = await excluirDados(id);
        
        if (response.sucesso) {
            showMessageModal('success', response.mensagem);
            allData = allData.filter(item => item.id !== id);
            setTimeout(() => {
                closeMessageModal();
                filtrarEExibirDados();
            }, 1000);
        } else {
            showMessageModal('error', response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showMessageModal('error', 'Erro ao excluir: ' + error.message);
    }
}

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editFiscal = document.getElementById('editFiscal');
const editSetor = document.getElementById('editSetor');
const editCodigoBarras = document.getElementById('editCodigoBarras');

function openEditModal(item) {
    if (!item) return;
    
    currentItemId = item.id;
    editFiscal.value = item.fiscal || '';
    editSetor.value = item.setor || '';
    editCodigoBarras.value = item.codigoBarras || '';
    editQuantidadeInput.value = item.quantidade || '';
    editModal.classList.add('show');
}

function closeEditModal() {
    editModal.classList.remove('show');
}

editForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    showMessageModal('loading', 'Salvando edição...');

    const novosDados = {
        fiscal: editFiscal.value,
        setor: editSetor.value,
        codigoBarras: editCodigoBarras.value,
        quantidade: editQuantidadeInput.value
    };

    try {
        const response = await editarDados(currentItemId, novosDados);
        
        if (response.sucesso) {
            showMessageModal('success', response.mensagem);
            closeEditModal();
            
            const itemIndex = allData.findIndex(item => item.id === currentItemId);
            if (itemIndex !== -1) {
                allData[itemIndex] = { ...allData[itemIndex], ...novosDados };
            }
            
            setTimeout(() => {
                closeMessageModal();
                filtrarEExibirDados();
            }, 1000);
        } else {
            showMessageModal('error', response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao editar:', error);
        showMessageModal('error', 'Erro ao salvar edição: ' + error.message);
    }
});

async function updateBaixaStatus(id, isChecked) {
    showMessageModal('loading', 'Atualizando status...');
    
    try {
        const response = await atualizarBaixa(id, isChecked);
        
        if (response.sucesso) {
            showMessageModal('success', 'Status atualizado!');
            const itemIndex = allData.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                allData[itemIndex].baixa = isChecked ? 'OK' : 'PENDENTE';
            }
            setTimeout(() => {
                closeMessageModal();
                filtrarEExibirDados();
            }, 1000);
        } else {
            showMessageModal('error', 'Erro ao atualizar: ' + response.mensagem);
            const checkbox = document.querySelector(`input[onchange*="${id}"]`);
            if (checkbox) checkbox.checked = !isChecked;
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showMessageModal('error', 'Erro ao atualizar: ' + error.message);
        const checkbox = document.querySelector(`input[onchange*="${id}"]`);
        if (checkbox) checkbox.checked = !isChecked;
    }
}

// Fecha modais ao clicar fora
window.onclick = function(event) {
    if (event.target === passwordModal) {
        closePasswordModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
};
