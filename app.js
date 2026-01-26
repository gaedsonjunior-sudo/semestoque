// ================== VARIÁVEIS GLOBAIS ==================
let acaoPendente = null;
let itemIdPendente = null;
let todosOsDados = [];

// ================== TABS ==================
window.showTab = function(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");
  
  if (tabId === 'visualizar') {
    carregarDados();
  }
}

// ================== MODAL MENSAGEM ==================
window.showMessage = function(text, type) {
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

window.closeMessageModal = function() {
  document.getElementById("messageModal").style.display = "none";
}

// ================== MODAL DE SENHA ==================
window.closePasswordModal = function() {
  const modal = document.getElementById("passwordModal");
  modal.classList.remove("show");
  modal.style.display = "none";
  document.getElementById("passwordInput").value = "";
  acaoPendente = null;
  itemIdPendente = null;
}

window.validatePassword = function() {
  const senha = document.getElementById("passwordInput").value;
  const senhaCorreta = "admin123";
  
  console.log("=== VALIDANDO SENHA ===");
  console.log("Senha digitada:", senha);
  console.log("Senha correta:", senhaCorreta);
  console.log("Ação pendente:", acaoPendente);
  console.log("Item ID:", itemIdPendente);
  
  if (senha === senhaCorreta) {
    console.log("Senha correta! Executando ação...");
    
    // IMPORTANTE: Salvar as variáveis ANTES de fechar o modal
    const acaoParaExecutar = acaoPendente;
    const idParaExecutar = itemIdPendente;
    
    // Agora sim fecha o modal (isso reseta as variáveis globais)
    closePasswordModal();
    
    // Executa a ação com as variáveis salvas
    if (acaoParaExecutar === 'editar') {
      console.log("Chamando abrirModalEdicao...");
      window.abrirModalEdicao(idParaExecutar);
    } else if (acaoParaExecutar === 'excluir') {
      console.log("Chamando excluirItem...");
      window.excluirItem(idParaExecutar);
    } else if (acaoParaExecutar === 'baixar') {
      console.log("Chamando marcarComoBaixado...");
      window.marcarComoBaixado(idParaExecutar);
    } else {
      console.log("ERRO: Ação não reconhecida:", acaoParaExecutar);
    }
  } else {
    console.log("Senha incorreta!");
    showMessage("Senha incorreta!", "error");
  }
}

window.solicitarSenhaParaAcao = function(acao, id) {
  console.log("=== SOLICITANDO SENHA ===");
  console.log("Ação:", acao);
  console.log("ID:", id);
  
  acaoPendente = acao;
  itemIdPendente = id;
  
  const modal = document.getElementById("passwordModal");
  modal.classList.add("show");
  modal.style.display = "flex";
  
  setTimeout(() => {
    document.getElementById("passwordInput").focus();
  }, 100);
}

// ================== MODAL DE EDIÇÃO ==================
window.closeEditModal = function() {
  const modal = document.getElementById("editModal");
  modal.classList.remove("show");
  modal.style.display = "none";
  document.getElementById("editForm").reset();
  itemIdPendente = null;
}

window.abrirModalEdicao = async function(id) {
  try {
    console.log("Carregando dados do item:", id);
    
    const { data, error } = await supabase
      .from("transferencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    console.log("Dados carregados:", data);

    document.getElementById("editFiscal").value = data.fiscal;
    document.getElementById("editSetor").value = data.setor;
    document.getElementById("editCodigoBarras").value = data.codigo_barras;
    document.getElementById("editQuantidade").value = data.quantidade.toString().replace(".", ",");
    
    itemIdPendente = id;
    
    const modal = document.getElementById("editModal");
    modal.classList.add("show");
    modal.style.display = "flex";
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    showMessage("Erro ao carregar dados para edição", "error");
  }
}

// ================== AÇÕES DOS BOTÕES ==================
window.excluirItem = async function(id) {
  console.log("=== FUNÇÃO EXCLUIR ITEM INICIADA ===");
  console.log("ID recebido:", id);
  
  showMessage("Excluindo item...", "loading");
  
  try {
    console.log("Tentando excluir do Supabase...");
    
    const { error } = await supabase
      .from("transferencias")
      .delete()
      .eq("id", id);

    console.log("Resposta do Supabase - Error:", error);

    if (error) throw error;

    console.log("Item excluído com sucesso!");
    showMessage("Item excluído com sucesso!", "success");
    setTimeout(() => {
      carregarDados();
    }, 1000);
  } catch (err) {
    console.error("Erro ao excluir:", err);
    showMessage("Erro ao excluir item", "error");
  }
}

window.marcarComoBaixado = async function(id) {
  console.log("=== FUNÇÃO MARCAR COMO BAIXADO INICIADA ===");
  console.log("ID recebido:", id);
  
  showMessage("Marcando como baixado...", "loading");
  
  try {
    console.log("Tentando atualizar no Supabase...");
    
    const { error } = await supabase
      .from("transferencias")
      .update({ baixa_ok: true })
      .eq("id", id);

    console.log("Resposta do Supabase - Error:", error);

    if (error) throw error;

    console.log("Item marcado como baixado com sucesso!");
    showMessage("Item marcado como baixado!", "success");
    setTimeout(() => {
      carregarDados();
    }, 1000);
  } catch (err) {
    console.error("Erro ao marcar:", err);
    showMessage("Erro ao marcar item", "error");
  }
}

// ================== FILTROS ==================
window.aplicarFiltros = function() {
  const filtroFiscal = document.getElementById("filtroFiscal").value.toLowerCase();
  const filtroSetor = document.getElementById("filtroSetor").value;
  const filtroCodigo = document.getElementById("filtroCodigo").value.toLowerCase();
  const filtroBaixaOk = document.getElementById("filtroBaixaOk").checked;
  const filtroPendente = document.getElementById("filtroPendente").checked;

  let dadosFiltrados = todosOsDados.filter(item => {
    if (filtroFiscal && !item.fiscal.toLowerCase().includes(filtroFiscal)) {
      return false;
    }

    if (filtroSetor && item.setor !== filtroSetor) {
      return false;
    }

    if (filtroCodigo && !item.codigo_barras.toLowerCase().includes(filtroCodigo)) {
      return false;
    }

    if (filtroBaixaOk && !item.baixa_ok) {
      return false;
    }

    if (filtroPendente && item.baixa_ok) {
      return false;
    }

    return true;
  });

  renderizarTabela(dadosFiltrados);
}

// ================== VISUALIZAR ==================
window.renderizarTabela = function(data) {
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

window.carregarDados = async function() {
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

// ================== INICIALIZAÇÃO ==================
document.addEventListener('DOMContentLoaded', () => {
  console.log("=== APP CARREGADO ===");
  
  // Máscara quantidade
  document.getElementById("quantidade").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 3) {
      v = v.slice(0, -3) + "," + v.slice(-3);
    }
    e.target.value = v;
  });

  // Máscara quantidade edição
  document.getElementById("editQuantidade").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 3) {
      v = v.slice(0, -3) + "," + v.slice(-3);
    }
    e.target.value = v;
  });
  
  // Preview foto
  document.getElementById("foto").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("imagePreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });
  
  // Listener para Enter no campo de senha
  const passwordInput = document.getElementById("passwordInput");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        validatePassword();
      }
    });
  }
  
  // Filtros
  document.getElementById("filtroFiscal").addEventListener("input", aplicarFiltros);
  document.getElementById("filtroSetor").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroCodigo").addEventListener("input", aplicarFiltros);
  document.getElementById("filtroBaixaOk").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroPendente").addEventListener("change", aplicarFiltros);
  
  // Formulário de cadastro
  document.getElementById("transferForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("Enviando...", "loading");

    try {
      const fiscal = document.getElementById("fiscal").value.trim();
      const setor = document.getElementById("setor").value;
      const codigoBarras = document.getElementById("codigoBarras").value.trim();
      const quantidade = parseFloat(document.getElementById("quantidade").value.replace(",", "."));
      const foto = document.getElementById("foto").files[0];

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
  
  // Formulário de edição
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
      setTimeout(() => {
        carregarDados();
      }, 1000);
    } catch (err) {
      console.error(err);
      showMessage(err.message, "error");
    }
  });
});
