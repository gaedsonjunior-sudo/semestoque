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
function closePasswordModal() {
  document.getElementById("passwordModal").classList.remove("show");
  document.getElementById("passwordInput").value = "";
  acaoPendente = null;
  itemIdPendente = null;
}

function validatePassword() {
  const senha = document.getElementById("passwordInput").value;
  
  if (senha === CONFIG.SENHA_ADMIN) {
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
function closeEditModal() {
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
    tbody.innerHTML += `
      <tr>
        <td>${item.fiscal}</td>
        <td>${item.setor}</td>
        <td>${item.codigo_barras}</td>
        <td>${item.quantidade}</td>
        <td><a href="${item.foto_url}" target="_blank">📷</a></td>
        <td>
          <span class="status-badge ${item.baixa_ok ? "status-ok" : "status-pendente"}">
            ${item.baixa_ok ? "OK" : "Pendente"}
          </span>
        </td>
        <td>${new Date(item.created_at).toLocaleString('pt-BR')}</td>
        <td>
          <div class="actions">
            <button class="btn-small btn-edit" onclick="solicitarSenhaParaAcao('editar', ${item.id})">✏️ Editar</button>
            <button class="btn-small btn-delete" onclick="solicitarSenhaParaAcao('excluir', ${item.id})">🗑️ Excluir</button>
            ${!item.baixa_ok ? `<button class="btn-small" style="background-color: #28a745; color: white;" onclick="solicitarSenhaParaAcao('baixar', ${item.id})">✓ Baixar</button>` : ''}
          </div>
        </td>
      </tr>
    `;
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
