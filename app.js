const form = document.getElementById("transferForm");
const submitBtn = document.getElementById("submitBtn");

let dadosCache = [];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  showMessage("Enviando transferência...", "loading");

  try {
    const fiscal = form.fiscal.value.trim();
    const setor = form.setor.value;
    const codigoBarras = form.codigoBarras.value.trim();
    const quantidade = parseFloat(form.quantidade.value.replace(",", "."));
    const foto = form.foto.files[0];

    if (!foto) throw new Error("Foto obrigatória");

    // Upload da imagem
    const fileName = `${Date.now()}_${foto.name}`;
    const { error: uploadError } = await supabase.storage
      .from("transferencias")
      .upload(fileName, foto);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("transferencias")
      .getPublicUrl(fileName);

    const fotoUrl = data.publicUrl;

    // Grava no banco
    const { error } = await supabase.from("transferencias").insert([{
      fiscal,
      setor,
      codigo_barras: codigoBarras,
      quantidade,
      foto_url: fotoUrl,
      baixa_ok: false
    }]);

    if (error) throw error;

    showMessage("Transferência enviada com sucesso!", "success");
    form.reset();
    document.getElementById("imagePreview").style.display = "none";

  } catch (err) {
    console.error(err);
    showMessage("Erro ao enviar: " + err.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
});

async function carregarDados() {
  showMessage("Carregando dados...", "loading");

  const { data, error } = await supabase
    .from("transferencias")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showMessage("Erro ao carregar dados", "error");
    return;
  }

  dadosCache = data;
  renderTabela(data);
  closeMessageModal();
}

function renderTabela(dados) {
  const tbody = document.getElementById("dataTableBody");
  tbody.innerHTML = "";

  if (dados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="no-data">Nenhum registro encontrado</td></tr>`;
    return;
  }

  dados.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
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
      <td>${new Date(item.created_at).toLocaleString()}</td>
      <td class="actions">
        <button class="btn-small btn-edit" onclick="abrirEdicao('${item.id}')">Editar</button>
        <button class="btn-small btn-delete" onclick="excluirItem('${item.id}')">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function excluirItem(id) {
  if (!confirm("Deseja realmente excluir?")) return;

  const { error } = await supabase
    .from("transferencias")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erro ao excluir");
    return;
  }

  carregarDados();
}

let itemEditando = null;

function abrirEdicao(id) {
  itemEditando = dadosCache.find(i => i.id === id);
  if (!itemEditando) return;

  document.getElementById("editFiscal").value = itemEditando.fiscal;
  document.getElementById("editSetor").value = itemEditando.setor;
  document.getElementById("editCodigoBarras").value = itemEditando.codigo_barras;
  document.getElementById("editQuantidade").value = itemEditando.quantidade;

  document.getElementById("editModal").classList.add("show");
}

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const { error } = await supabase
    .from("transferencias")
    .update({
      fiscal: editFiscal.value,
      setor: editSetor.value,
      codigo_barras: editCodigoBarras.value,
      quantidade: parseFloat(editQuantidade.value)
    })
    .eq("id", itemEditando.id);

  if (error) {
    alert("Erro ao salvar edição");
    return;
  }

  closeEditModal();
  carregarDados();
});
