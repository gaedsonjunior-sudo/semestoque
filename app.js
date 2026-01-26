function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "visualizar") carregarVisualizacao();
}

function solicitarSenhaAdmin() {
  const senha = prompt("Senha de administrador:");
  if (senha !== CONFIG.SENHA_ADMIN) {
    alert("Senha incorreta");
    return false;
  }
  return true;
}

async function enviar() {
  try {
    const fiscal = fiscalInput().value;
    const setor = setorInput().value;
    const codigo = codigoInput().value;
    const quantidade = quantidadeInput().value;
    const foto = document.getElementById("foto").files[0];

    if (!fiscal || !setor || !codigo || !quantidade) {
      alert("Preencha todos os campos");
      return;
    }

    let fotoUrl = null;

    if (foto) {
      const fileName = `${Date.now()}_${foto.name}`;

      const { error: uploadError } = await supabaseClient
        .storage
        .from("transferencias")
        .upload(fileName, foto);

      if (uploadError) throw uploadError;

      fotoUrl = supabaseClient
        .storage
        .from("transferencias")
        .getPublicUrl(fileName).data.publicUrl;
    }

    const { error } = await supabaseClient
      .from("transferencias")
      .insert([{
        fiscal,
        setor,
        codigo_barras: codigo,
        quantidade,
        foto_url: fotoUrl,
        baixa_ok: false
      }]);

    if (error) throw error;

    alert("Salvo com sucesso");
    limparFormulario();

  } catch (e) {
    alert("Erro ao salvar");
    console.error(e);
  }
}

async function carregarVisualizacao() {
  const { data, error } = await supabaseClient
    .from("transferencias")
    .select("*")
    .order("id", { ascending: false });

  if (error) return;

  const tbody = document.getElementById("lista");
  tbody.innerHTML = "";

  data.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.fiscal}</td>
      <td>${item.setor}</td>
      <td>${item.codigo_barras}</td>
      <td>${item.quantidade}</td>
      <td>${item.baixa_ok ? "Resolvido" : "Pendente"}</td>
      <td>
        <button onclick="editarItem(${item.id})">✏️</button>
        <button onclick="baixarItem(${item.id})">✅</button>
        <button onclick="excluirItem(${item.id})">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function editarItem(id) {
  if (!solicitarSenhaAdmin()) return;

  const fiscal = prompt("Fiscal:");
  const setor = prompt("Setor:");
  const quantidade = prompt("Quantidade:");

  await supabaseClient
    .from("transferencias")
    .update({ fiscal, setor, quantidade })
    .eq("id", id);

  carregarVisualizacao();
}

async function baixarItem(id) {
  if (!solicitarSenhaAdmin()) return;

  await supabaseClient
    .from("transferencias")
    .update({ baixa_ok: true })
    .eq("id", id);

  carregarVisualizacao();
}

async function excluirItem(id) {
  if (!solicitarSenhaAdmin()) return;

  if (!confirm("Excluir registro?")) return;

  await supabaseClient
    .from("transferencias")
    .delete()
    .eq("id", id);

  carregarVisualizacao();
}

function limparFormulario() {
  fiscalInput().value = "";
  setorInput().value = "";
  codigoInput().value = "";
  quantidadeInput().value = "";
  document.getElementById("foto").value = "";
}

const fiscalInput = () => document.getElementById("fiscal");
const setorInput = () => document.getElementById("setor");
const codigoInput = () => document.getElementById("codigo");
const quantidadeInput = () => document.getElementById("quantidade");
