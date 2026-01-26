// ================== TABS ==================
function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");
  
  if (tabId === 'visualizar') {
    carregarDados();
  }
}

// ================== MODAL MENSAGEM ==================
function showMessage(text, type) {
  const modal = document.getElementById("messageModal");
  const spinner = document.getElementById("modalSpinner");
  const icon = document.getElementById("modalStatusIcon");
  const msg = document.getElementById("modalMessageText");

  spinner.style.display = type === "loading" ? "block" : "none";
  icon.style.display = type === "success" || type === "error" ? "block" : "none";
  icon.textContent = type === "success" ? "✅" : type === "error" ? "❌" : "";

  msg.textContent = text;
  modal.style.display = "flex";
}

function closeMessageModal() {
  document.getElementById("messageModal").style.display = "none";
}

// ================== MÁSCARA QUANTIDADE ==================
document.getElementById("quantidade").addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 3) {
    v = v.slice(0, -3) + "," + v.slice(-3);
  }
  e.target.value = v;
});

// Máscara para o campo de edição também
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("editQuantidade").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 3) {
      v = v.slice(0, -3) + "," + v.slice(-3);
    }
    e.target.value = v;
  });
  
  // Adicionar listener para Enter no campo de senha
  const passwordInput = document.getElementById("passwordInput");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        validatePassword();
      }
    });
  }
});

// ================== PREVIEW FOTO ==================
document.getElementById("foto").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const preview = document.getElementById("imagePreview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
});

// ================== ENVIO ==================
document.getElementById("transferForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Enviando...", "loading");

  try {
    const fiscalInput = document.getElementById("fiscal");
    const setorInput = document.getElementById("setor");
    const codigoInput = document.getElementById("codigoBarras");
    const quantidadeInput = document.getElementById("quantidade");
    const fotoInput = document.getElementById("foto");

    const fiscal = fiscalInput.value.trim();
    const setor = setorInput.value;
    const codigoBarras = codigoInput.value.trim();
    const quantidade = parseFloat(quantidadeInput.value.replace(",", "."));
    const foto = fotoInput.files[0];

    if (!fiscal || !setor || !codigoBarras || !quantidade || !foto) {
      throw new Error("Preencha todos os campos");
    }

    const fileName = `${Date.now()}_${foto.name}`;

    const { error: uploadError } = await supabase
      .storage
      .from("transferencias")
      .upload(fileName, foto);

    if (uploadError) throw uploadError;

    const { data: imageData } = supabase
      .storage
      .from("transferencias")
      .getPublicUrl(fileName);

    const { error } = await supabase
      .from("transferencias")
      .insert([{
        fiscal,
        setor,
        codigo_barras: codigoBarras,
        quantidade,
        foto_url: imageData.publicUrl,
        baixa_ok: false
      }]);

    if (error) throw error;

    showMessage("Transferência enviada com sucesso!", "success");
    e.target.reset();
    document.getElementById("imagePreview").style.display = "none";

  } catch (err) {
    console.error(err);
    showMessage(err.message, "error");
  }
});

// ================== VARIÁVEIS GLOBAIS PARA SENHA ==================
let acaoPendente = null;
let itemIdPendente = null;

// ================== MODAL DE SENHA ==================
window.closePasswordModal = function() {
  document.getElementById("passwordModal").classList.remove("show");
  document.getElementById("passwordInput").value = "";
  acaoPendente = null;
  itemIdPendente = null;
}

window.validatePassword = function() {
  const senha = document.getElementById("passwordInput").value;
  const senhaCorreta = "admin123"; // Senha hardcoded para garantir funcionamento
  
  console.log("Validando senha...");
  console.log("Senha digitada:", senha);
  console.log("Ação pendente:", acaoPendente);
  console.log("Item ID:", itemIdPendente);
  
  if (senha === senhaCorreta) {
    closePasswordModal();
    
    if (acaoPendente === 'editar') {
      abrirModalEdicao(itemIdPendente);
    } else if (acaoPendente === 'excluir') {
      excluirItem(itemIdPendente);
    } else if (acaoPendente === 'baixar') {
      marcarComoBaixado(itemIdPendente);
    }
  } else {
    showMessage("Senha incorreta!", "error");
  }
}

// ================== MODAL DE EDIÇÃO ==================
window.closeEditModal = function() {
  document.getElementById("editModal").classList.remove("show");
  document.getElementById("editForm").reset();
  itemIdPendente = null;
}

async function abrirModalEdicao(id) {
  try {
    const { data, error } = await supabase
      .from("transferencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    document.getElementById("editFiscal").value = data.fiscal;
    document.getElementById("editSetor").value = data.setor;
    document.getElementById("editCodigoBarras").value = data.codigo_barras;
    document.getElementById("editQuantidade").value = data.quantidade.toString().replace(".", ",");
    
    itemIdPendente = id;
    document.getElementById("editModal").classList.add("show");
  } catch (err) {
    console.error(err);
    showMessage("Erro ao carregar dados para edição", "error");
  }
}

// ================== FORMULÁRIO DE EDIÇÃO ==================
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Salvando alterações...", "loading");

  try {
    const fiscal = document.getElementById("editFiscal").value.trim();
    const setor = document.getElementById("editSetor").value;
    const codigoBarras = document.getElementById("editCodigoBarras").value.trim();
    const quantidade = parseFloat(document.getElementById("editQuantidade").value.replace(",", "."));

    if (!fiscal || !setor || !codigoBarras || !quantidade) {
      throw new Error("Preencha todos os campos");
    }

    const { error } = await supabase
      .from("transferencias")
      .update({
        fiscal,
        setor,
        codigo_barras: codigoBarras,
        quantidade
      })
      .eq("id", itemIdPendente);

    if (error) throw error;

    showMessage("Item atualizado com sucesso!", "success");
    closeEditModal();
    carregarDados();
  } catch (err) {
    console.error(err);
    showMessage(err.message, "error");
  }
});

// ================== AÇÕES DOS BOTÕES ==================
function solicitarSenhaParaAcao(acao, id) {
  acaoPendente = acao;
  itemIdPendente = id;
  document.getElementById("passwordModal").classList.add("show");
  document.getElementById("passwordInput").focus();
}

async function excluirItem(id) {
  showMessage("Excluindo item...", "loading");
  
  try {
    const { error } = await supabase
      .from("transferencias")
      .delete()
      .eq("id", id);

    if (error) throw error;

    showMessage("Item excluído com sucesso!", "success");
    carregarDados();
  } catch (err) {
    console.error(err);
    showMessage("Erro ao excluir item", "error");
  }
}

async function marcarComoBaixado(id) {
  showMessage("Marcando como baixado...", "loading");
  
  try {
    const { error } = await supabase
      .from("transferencias")
      .update({ baixa_ok: true })
      .eq("id", id);

    if (error) throw error;

    showMessage("Item marcado como baixado!", "success");
    carregarDados();
  } catch (err) {
    console.error(err);
    showMessage("Erro ao marcar item", "error");
  }
}

// ================== FILTROS ==================
let todosOsDados = [];

function aplicarFiltros() {
  const filtroFiscal = document.getElementById("filtroFiscal").value.toLowerCase();
  const filtroSetor = document.getElementById("filtroSetor").value;
  const filtroCodigo = document.getElementById("filtroCodigo").value.toLowerCase();
  const filtroBaixaOk = document.getElementById("filtroBaixaOk").checked;
  const filtroPendente = document.getElementById("filtroPendente").checked;

  let dadosFiltrados = todosOsDados.filter(item => {
    // Filtro de fiscal
    if (filtroFiscal && !item.fiscal.toLowerCase().includes(filtroFiscal)) {
      return false;
    }

    // Filtro de setor
    if (filtroSetor && item.setor !== filtroSetor) {
      return false;
    }

    // Filtro de código
    if (filtroCodigo && !item.codigo_barras.toLowerCase().includes(filtroCodigo)) {
      return false;
    }

    // Filtro de baixa OK
    if (filtroBaixaOk && !item.baixa_ok) {
      return false;
    }

    // Filtro de pendentes
    if (filtroPendente && item.baixa_ok) {
      return false;
    }

    return true;
  });

  renderizarTabela(dadosFiltrados);
}

// Adicionar eventos aos filtros
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("filtroFiscal").addEventListener("input", aplicarFiltros);
  document.getElementById("filtroSetor").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroCodigo").addEventListener("input", aplicarFiltros);
  document.getElementById("filtroBaixaOk").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroPendente").addEventListener("change", aplicarFiltros);
});

// ================== VISUALIZAR ==================
function renderizarTabela(data) {
  const tbody = document.getElementById("dataTableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="no-data">Nenhum dado encontrado</td></tr>`;
    return;
  }

  data.forEach(item => {
    const tr = document.createElement('tr');
    
    // Fiscal
    const tdFiscal = document.createElement('td');
    tdFiscal.textContent = item.fiscal;
    tr.appendChild(tdFiscal);
    
    // Setor
    const tdSetor = document.createElement('td');
    tdSetor.textContent = item.setor;
    tr.appendChild(tdSetor);
    
    // Código
    const tdCodigo = document.createElement('td');
    tdCodigo.textContent = item.codigo_barras;
    tr.appendChild(tdCodigo);
    
    // Quantidade
    const tdQuantidade = document.createElement('td');
    tdQuantidade.textContent = item.quantidade;
    tr.appendChild(tdQuantidade);
    
    // Foto
    const tdFoto = document.createElement('td');
    const linkFoto = document.createElement('a');
    linkFoto.href = item.foto_url;
    linkFoto.target = '_blank';
    linkFoto.textContent = '📷';
    tdFoto.appendChild(linkFoto);
    tr.appendChild(tdFoto);
    
    // Status
    const tdStatus = document.createElement('td');
    const spanStatus = document.createElement('span');
    spanStatus.className = `status-badge ${item.baixa_ok ? 'status-ok' : 'status-pendente'}`;
    spanStatus.textContent = item.baixa_ok ? 'OK' : 'Pendente';
    tdStatus.appendChild(spanStatus);
    tr.appendChild(tdStatus);
    
    // Data/Hora
    const tdData = document.createElement('td');
    tdData.textContent = new Date(item.created_at).toLocaleString('pt-BR');
    tr.appendChild(tdData);
    
    // Ações
    const tdAcoes = document.createElement('td');
    const divActions = document.createElement('div');
    divActions.className = 'actions';
    
    // Botão Editar
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-small btn-edit';
    btnEditar.textContent = '✏️ Editar';
    btnEditar.onclick = () => solicitarSenhaParaAcao('editar', item.id);
    divActions.appendChild(btnEditar);
    
    // Botão Excluir
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn-small btn-delete';
    btnExcluir.textContent = '🗑️ Excluir';
    btnExcluir.onclick = () => solicitarSenhaParaAcao('excluir', item.id);
    divActions.appendChild(btnExcluir);
    
    // Botão Baixar (apenas se não estiver baixado)
    if (!item.baixa_ok) {
      const btnBaixar = document.createElement('button');
      btnBaixar.className = 'btn-small';
      btnBaixar.style.backgroundColor = '#28a745';
      btnBaixar.style.color = 'white';
      btnBaixar.textContent = '✓ Baixar';
      btnBaixar.onclick = () => solicitarSenhaParaAcao('baixar', item.id);
      divActions.appendChild(btnBaixar);
    }
    
    tdAcoes.appendChild(divActions);
    tr.appendChild(tdAcoes);
    
    tbody.appendChild(tr);
  });
}

async function carregarDados() {
  showMessage("Carregando dados...", "loading");

  const { data, error } = await supabase
    .from("transferencias")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showMessage("Erro ao carregar", "error");
    return;
  }

  todosOsDados = data;
  aplicarFiltros();
  closeMessageModal();
}
