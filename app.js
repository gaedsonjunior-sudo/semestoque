// ================== TABS ==================
function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");
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
    const fiscal = fiscal.value.trim();
    const setor = setor.value;
    const codigoBarras = codigoBarras.value.trim();
    const quantidade = parseFloat(quantidade.value.replace(",", "."));
    const foto = foto.files[0];

    if (!foto) throw new Error("Foto obrigatória");

    const fileName = `${Date.now()}_${foto.name}`;

    const { error: uploadError } = await supabase
      .storage.from("transferencias")
      .upload(fileName, foto);

    if (uploadError) throw uploadError;

    const { data } = supabase
      .storage.from("transferencias")
      .getPublicUrl(fileName);

    const { error } = await supabase.from("transferencias").insert([{
      fiscal,
      setor,
      codigo_barras: codigoBarras,
      quantidade,
      foto_url: data.publicUrl,
      baixa_ok: false
    }]);

    if (error) throw error;

    showMessage("Transferência enviada com sucesso!", "success");
    e.target.reset();
    imagePreview.style.display = "none";

  } catch (err) {
    showMessage(err.message, "error");
  }
});

// ================== VISUALIZAR ==================
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

  const tbody = document.getElementById("dataTableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="no-data">Nenhum dado</td></tr>`;
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
        <td>${new Date(item.created_at).toLocaleString()}</td>
        <td>-</td>
      </tr>
    `;
  });

  closeMessageModal();
}
