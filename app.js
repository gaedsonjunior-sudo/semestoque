// ================== VARIÁVEIS GLOBAIS ==================
let acaoPendente = null;
let itemIdPendente = null;
let todosOsDados = [];
window.cacheProdutos = {}; // cache global

// ================== TABS ==================
window.showTab = function(tabId) {
  document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add("active");
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
  icon.style.display = (type === "success" || type === "error") ? "block" : "none";
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
  document.getElementById("passwordInput").value = "";
  acaoPendente = null;
  itemIdPendente = null;
}

window.validatePassword = function() {
  const senha = document.getElementById("passwordInput").value;
  const senhaCorreta = "admin123";

  if (senha === senhaCorreta) {
    const acaoParaExecutar = acaoPendente;
    const idParaExecutar = itemIdPendente;

    closePasswordModal();

    if (acaoParaExecutar === 'editar') {
      window.abrirModalEdicao(idParaExecutar);
    } else if (acaoParaExecutar === 'excluir') {
      window.excluirItem(idParaExecutar);
    } else if (acaoParaExecutar === 'baixar') {
      window.marcarComoBaixado(idParaExecutar);
    }
  } else {
    showMessage("Senha incorreta!", "error");
  }
}

window.solicitarSenhaParaAcao = function(acao, id) {
  acaoPendente = acao;
  itemIdPendente = id;

  const modal = document.getElementById("passwordModal");
  modal.classList.add("show");

  setTimeout(() => {
    document.getElementById("passwordInput").focus();
  }, 100);
}

// ================== MODAL DE EDIÇÃO ==================
window.closeEditModal = function() {
  const modal = document.getElementById("editModal");
  modal.classList.remove("show");
  document.getElementById("editForm").reset();
  // Ocultar campo Outros na edição
  document.getElementById("editOutrosDescricaoGroup").style.display = "none";
  itemIdPendente = null;
}

window.abrirModalEdicao = async function(id) {
  try {
    const { data, error } = await supabase
      .from("transferencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    document.getElementById("editFiscal").value = data.fiscal;
    document.getElementById("editCodigoBarras").value = data.codigo_barras;
    document.getElementById("editQuantidade").value = data.quantidade.toString().replace(".", ",");

    // Tratar setor com suporte a "Outros"
    const setorSelect = document.getElementById("editSetor");
    const setorOpts = Array.from(setorSelect.options).map(o => o.value);
    if (setorOpts.includes(data.setor)) {
      setorSelect.value = data.setor;
      document.getElementById("editOutrosDescricaoGroup").style.display = "none";
    } else {
      // Setor personalizado (valor de "Outros")
      setorSelect.value = "Outros";
      document.getElementById("editOutrosDescricaoGroup").style.display = "flex";
      document.getElementById("editOutrosDescricao").value = data.setor;
    }

    itemIdPendente = id;

    const modal = document.getElementById("editModal");
    modal.classList.add("show");
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    showMessage("Erro ao carregar dados para edição", "error");
  }
}

// ================== AÇÕES DOS BOTÕES ==================
window.excluirItem = async function(id) {
  showMessage("Excluindo item...", "loading");

  try {
    const { error } = await supabase
      .from("transferencias")
      .delete()
      .eq("id", id);

    if (error) throw error;

    showMessage("Item excluído com sucesso!", "success");
    setTimeout(() => { carregarDados(); }, 1000);
  } catch (err) {
    console.error("Erro ao excluir:", err);
    showMessage("Erro ao excluir item", "error");
  }
}

window.marcarComoBaixado = async function(id) {
  showMessage("Marcando como baixado...", "loading");

  try {
    const { error } = await supabase
      .from("transferencias")
      .update({ baixa_ok: true })
      .eq("id", id);

    if (error) throw error;

    showMessage("Item marcado como baixado!", "success");
    setTimeout(() => { carregarDados(); }, 1000);
  } catch (err) {
    console.error("Erro ao marcar:", err);
    showMessage("Erro ao marcar item", "error");
  }
}

// ================== PRODUTOS (LOOKUP) ==================
window.carregarCacheProdutos = async function() {
  // Busca paginada — Supabase limita 1000 por request
  try {
    window.cacheProdutos = {};
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("produtos")
        .select("codigo_barras, descricao")
        .range(from, from + pageSize - 1);

      if (error) { console.warn("⚠️ Produtos erro:", error.message); break; }
      if (!data || data.length === 0) break;

      data.forEach(p => {
        window.cacheProdutos[String(p.codigo_barras).trim()] = p.descricao;
      });

      console.log(`  página ${from/pageSize + 1}: ${data.length} produtos`);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    console.log("✅ Total no cache:", Object.keys(window.cacheProdutos).length);
  } catch (err) {
    console.warn("⚠️ Erro produtos:", err.message);
  }
}

function getDescricaoProduto(codigo) {
  if (!codigo) return null;
  const key = String(codigo).trim();
  return window.cacheProdutos[key] || null;
}

// ================== FILTROS ==================
window.aplicarFiltros = function() {
  const filtroFiscal = document.getElementById("filtroFiscal").value.toLowerCase().trim();
  const filtroSetor = document.getElementById("filtroSetor").value;
  const filtroCodigo = document.getElementById("filtroCodigo").value.toLowerCase().trim();
  const filtroBaixaOk = document.getElementById("filtroBaixaOk").checked;
  const filtroPendente = document.getElementById("filtroPendente").checked;

  let dadosFiltrados = todosOsDados.filter(item => {
    if (filtroFiscal && !item.fiscal.toLowerCase().includes(filtroFiscal)) return false;
    if (filtroSetor && item.setor !== filtroSetor) return false;
    if (filtroCodigo && !item.codigo_barras.toLowerCase().includes(filtroCodigo)) return false;
    if (filtroBaixaOk && !item.baixa_ok) return false;
    if (filtroPendente && item.baixa_ok) return false;
    return true;
  });

  renderizarTabela(dadosFiltrados);
  atualizarSummary(dadosFiltrados);
}

// ================== SUMMARY BAR ==================
function atualizarSummary(data) {
  const bar = document.getElementById("summaryBar");
  const countLabel = document.getElementById("countLabel");
  if (!bar) return;

  const total = data.length;
  const baixados = data.filter(i => i.baixa_ok).length;
  const pendentes = total - baixados;
  const qtdTotal = data.reduce((acc, i) => acc + (parseFloat(i.quantidade) || 0), 0);

  countLabel.textContent = `${total} registro${total !== 1 ? 's' : ''}`;

  bar.innerHTML = `
    <div class="summary-pill">Total <span>${total}</span></div>
    <div class="summary-pill">✅ Baixados <span>${baixados}</span></div>
    <div class="summary-pill">⏳ Pendentes <span>${pendentes}</span></div>
    <div class="summary-pill">📦 Qtd. Total <span>${qtdTotal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span></div>
  `;
}

// ================== RENDERIZAR TABELA ==================
window.renderizarTabela = function(data) {
  const tbody = document.getElementById("dataTableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-text">Nenhum registro encontrado com esses filtros</div>
          </div>
        </td>
      </tr>`;
    return;
  }

  data.forEach(item => {
    const tr = document.createElement('tr');
    const descricao = getDescricaoProduto(item.codigo_barras);
    const setorExibir = item.setor_outros_descricao ? item.setor_outros_descricao : item.setor;

    tr.innerHTML = `
      <td>${escHtml(item.fiscal)}</td>
      <td>${escHtml(setorExibir)}</td>
      <td class="td-mono">${escHtml(item.codigo_barras)}</td>
      <td class="td-desc ${descricao ? '' : 'nao-cadastrado'}"
          title="${descricao || 'Produto não cadastrado'}">
        ${descricao ? escHtml(descricao) : 'Produto não cadastrado'}
      </td>
      <td>${item.quantidade}</td>
      <td><a class="photo-link" href="${escHtml(item.foto_url)}" target="_blank" title="Ver foto">📷</a></td>
      <td>
        <span class="badge ${item.baixa_ok ? 'badge-ok' : 'badge-pendente'}">
          ${item.baixa_ok ? 'Baixado' : 'Pendente'}
        </span>
      </td>
      <td class="td-mono" style="font-size:12px;">${new Date(item.created_at).toLocaleString('pt-BR')}</td>
      <td>
        <div class="actions">
          <button class="btn-action btn-action-edit" onclick="solicitarSenhaParaAcao('editar', '${item.id}')">✏️ Editar</button>
          <button class="btn-action btn-action-del" onclick="solicitarSenhaParaAcao('excluir', '${item.id}')">🗑️</button>
          ${!item.baixa_ok ? `<button class="btn-action btn-action-baixar" onclick="solicitarSenhaParaAcao('baixar', '${item.id}')">✓ Baixar</button>` : ''}
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ================== CARREGAR DADOS ==================
window.carregarDados = async function() {
  showMessage("Carregando dados...", "loading");

  // Garante cache de produtos atualizado
  await carregarCacheProdutos();

  const { data, error } = await supabase
    .from("transferencias")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showMessage("Erro ao carregar dados", "error");
    return;
  }

  todosOsDados = data;
  aplicarFiltros();
  closeMessageModal();
}

// ================== ENVIO DE E-MAIL ==================
async function enviarEmailCadastro(registro) {
  try {
    const SUPABASE_URL = "https://ssziasopmhpszlztmbio.supabase.co";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzemlhc29wbWhwc3psenRtYmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDk0MDksImV4cCI6MjA4NTAyNTQwOX0.FqoNDC-XeWbgG-jkns6rk5z2_-OpWuefQ5esQid0FK8";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/enviar-email-transferencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ registro })
    });
    const json = await res.json();
    console.log(json.enviado ? "✅ E-mail enviado" : "⚠️ E-mail não enviado:", json);
  } catch (err) {
    console.warn("⚠️ Erro e-mail (ignorado):", err.message);
  }
}

// ================== INICIALIZAÇÃO ==================
document.addEventListener('DOMContentLoaded', () => {
  console.log("=== APP CARREGADO ===");

  // Máscara quantidade
  function mascaraQuantidade(e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 3) {
      v = v.slice(0, -3) + "," + v.slice(-3);
    }
    e.target.value = v;
  }

  document.getElementById("quantidade").addEventListener("input", mascaraQuantidade);
  document.getElementById("editQuantidade").addEventListener("input", mascaraQuantidade);

  // Preview foto
  document.getElementById("foto").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById("imagePreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });

  // Enter no campo senha
  document.getElementById("passwordInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validatePassword();
    }
  });

  // Filtros
  document.getElementById("filtroFiscal").addEventListener("input", aplicarFiltros);
  document.getElementById("filtroSetor").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroCodigo").addEventListener("input", aplicarFiltros);
  document.getElementById("filtroBaixaOk").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroPendente").addEventListener("change", aplicarFiltros);

  // ===== FORMULÁRIO CADASTRO =====
  document.getElementById("transferForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("Enviando...", "loading");

    try {
      const fiscal = document.getElementById("fiscal").value.trim();
      const setorBase = document.getElementById("setor").value;
      const outrosDescricao = document.getElementById("outrosDescricao").value.trim();
      const codigoBarras = document.getElementById("codigoBarras").value.trim();
      const quantidade = parseFloat(document.getElementById("quantidade").value.replace(",", "."));
      const foto = document.getElementById("foto").files[0];

      if (!fiscal || !setorBase || !codigoBarras || !quantidade || !foto) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      if (setorBase === "Outros" && !outrosDescricao) {
        throw new Error("Descreva o setor para a opção 'Outros'");
      }

      // O setor salvo: se "Outros", usa descrição; senão usa o valor do select
      const setorFinal = setorBase === "Outros" ? outrosDescricao : setorBase;

      // Upload foto
      const fileName = `${Date.now()}_${foto.name}`;
      const { error: uploadError } = await supabase.storage.from("transferencias").upload(fileName, foto);
      if (uploadError) throw uploadError;

      const { data: imageData } = supabase.storage.from("transferencias").getPublicUrl(fileName);

      const { error } = await supabase.from("transferencias").insert([{
        fiscal,
        setor: setorFinal,
        codigo_barras: codigoBarras,
        quantidade,
        foto_url: imageData.publicUrl,
        baixa_ok: false
      }]);

      if (error) throw error;

      showMessage("Transferência enviada com sucesso!", "success");
      e.target.reset();
      document.getElementById("imagePreview").style.display = "none";
      document.getElementById("outrosDescricaoGroup").style.display = "none";

      // Envia e-mail em background (não bloqueia o cadastro)
      enviarEmailCadastro({ fiscal, setor: setorFinal, codigo_barras: codigoBarras, quantidade });

    } catch (err) {
      console.error(err);
      showMessage(err.message, "error");
    }
  });

  // ===== FORMULÁRIO EDIÇÃO =====
  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("Salvando alterações...", "loading");

    try {
      const fiscal = document.getElementById("editFiscal").value.trim();
      const setorBase = document.getElementById("editSetor").value;
      const outrosDescricao = document.getElementById("editOutrosDescricao").value.trim();
      const codigoBarras = document.getElementById("editCodigoBarras").value.trim();
      const quantidade = parseFloat(document.getElementById("editQuantidade").value.replace(",", "."));

      if (!fiscal || !setorBase || !codigoBarras || !quantidade) {
        throw new Error("Preencha todos os campos");
      }

      if (setorBase === "Outros" && !outrosDescricao) {
        throw new Error("Descreva o setor para a opção 'Outros'");
      }

      const setorFinal = setorBase === "Outros" ? outrosDescricao : setorBase;

      const { error } = await supabase
        .from("transferencias")
        .update({ fiscal, setor: setorFinal, codigo_barras: codigoBarras, quantidade })
        .eq("id", itemIdPendente);

      if (error) throw error;

      showMessage("Item atualizado com sucesso!", "success");
      closeEditModal();
      setTimeout(() => { carregarDados(); }, 1000);
    } catch (err) {
      console.error(err);
      showMessage(err.message, "error");
    }
  });
});
