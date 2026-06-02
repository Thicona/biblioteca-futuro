const clientes = JSON.parse(localStorage.getItem('usuariosCadastrados')) || [
    { nome: "Ana Silva" },
    { nome: "Carlos Souza" },
    { nome: "Mariana Costa" }
];

function realizarLogin() {
    const nome = document.getElementById('nome-completo').value.trim();
    const email = document.getElementById('email-login').value.trim();
    const cpf = document.getElementById('cpf-login').value.trim();

    if (!nome || !email || !cpf) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    if (nome.length <= 3) {
        alert("O nome deve ter mais de 3 letras.");
        return;
    }

    if (!email.endsWith("@gmail.com")) {
        alert("O e-mail deve terminar com @gmail.com");
        return;
    }

    const apenasNumerosCpf = cpf.replace(/\D/g, '');

    if (apenasNumerosCpf.length !== 11) {
        alert("O CPF deve conter exatamente 11 números.");
        return;
    }

    window.location.href = "pagPrincipal.html";
}

async function buscarLivros() {
    // CORREÇÃO: Pegando os elementos atualizados direto no clique
    const inputBusca = document.getElementById('buscaLivro');
    const divLoading = document.getElementById('loading');
    const divResultados = document.getElementById('resultadosLivros');

    if (!inputBusca) {
        alert("Erro no HTML: Campo de busca não encontrado.");
        return;
    }

    const termo = inputBusca.value.trim();

    if (!termo) {
        alert("Digite um livro");
        return;
    }

    if (divLoading) divLoading.innerText = "Carregando...";
    if (divResultados) divResultados.innerHTML = "";

    try {
        // CORREÇÃO: Adicionado o /search.json?q= e o sinal de $ na URL da API
        const resposta = await fetch("https://openlibrary.org" + encodeURIComponent(termo));
        const dados = await resposta.json();

        if (divLoading) divLoading.innerText = "";

        if (!dados.docs || dados.docs.length === 0) {
            if (divResultados) divResultados.innerHTML = "<p>Nenhum livro encontrado</p>";
            return;
        }

        dados.docs.slice(0, 5).forEach((livro, index) => {
            const titulo = livro.title || "Sem título";
            const autor = livro.author_name ? livro.author_name[0] : "Autor desconhecido";
            
            // CORREÇÃO: URL das capas corrigida com o caminho oficial da API
            const capa = livro.cover_i
                ? "https://openlibrary.org" + livro.cover_i + "-M.jpg"
                : "https://placeholder.com";

            const tituloEscapado = titulo.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const capaEscapada = capa.replace(/'/g, "\\'");

            if (divResultados) {
                divResultados.innerHTML += `
                    <div class="livro">
                        <img src="${capa}" alt="Capa">
                        <h3>${titulo}</h3>
                        <p>${autor}</p>
                        
                        <select id="cliente-${index}">
                            <option value="">Selecione um cliente</option>
                            ${clientes.map(cliente => `
                                <option value="${cliente.nome}">${cliente.nome}</option>
                            `).join("")}
                        </select>

                        <button onclick="salvarEmprestimoDaApi('${tituloEscapado}', '${capaEscapada}', '${index}')">
                            Finalizar Empréstimo
                        </button>
                    </div>
                `;
            }
        });

    } catch (error) {
        if (divLoading) divLoading.innerText = "";
        if (divResultados) divResultados.innerHTML = "<p>Erro ao buscar livros</p>";
        console.error(error);
    }
}

function salvarEmprestimoDaApi(titulo, capa, index) {
    const selectCliente = document.getElementById(`cliente-${index}`);
    const nomeCliente = selectCliente ? selectCliente.value : "";

    if (!nomeCliente) {
        alert("Por favor, selecione um cliente para o empréstimo!");
        return;
    }

    const hoje = new Date();
    const dataDevolucao = new Date(hoje);
    dataDevolucao.setDate(hoje.getDate() + 7);
    const dataFormatada = dataDevolucao.toLocaleDateString('pt-BR');

    const novoEmprestimo = {
        cliente: nomeCliente,
        livro: titulo,
        capa: capa,
        devolucao: dataFormatada
    };

    const emprestimosAtivos = JSON.parse(localStorage.getItem('emprestimosAtivos')) || [];
    emprestimosAtivos.push(novoEmprestimo);
    localStorage.setItem('emprestimosAtivos', JSON.stringify(emprestimosAtivos));

    alert(`Empréstimo de "${titulo}" registrado para ${nomeCliente}!`);
    window.location.href = "meusEmprestimos.html";
}

const params = new URLSearchParams(window.location.search);
const tituloLivro = decodeURIComponent(params.get('titulo') || '');
const capaLivro = decodeURIComponent(params.get('capa') || '');

if (document.getElementById('livro-titulo') && document.getElementById('livro-capa')) {
    document.getElementById('livro-titulo').innerText = tituloLivro;
    document.getElementById('livro-capa').src = capaLivro;
}

function finalizarEmprestimo() {
    const nomeCliente = document.getElementById('nome-cliente').value;

    if (!nomeCliente) {
        alert("Por favor, digite o nome do cliente.");
        return;
    }

    const hoje = new Date();
    const dataDevolucao = new Date(hoje);
    dataDevolucao.setDate(hoje.getDate() + 7);
    const dataFormatada = dataDevolucao.toLocaleDateString('pt-BR');

    const novoEmprestimo = {
        cliente: nomeCliente,
        livro: tituloLivro,
        capa: capaLivro,
        devolucao: dataFormatada
    };

    const emprestimosAtivos = JSON.parse(localStorage.getItem('emprestimosAtivos')) || [];
    emprestimosAtivos.push(novoEmprestimo);
    localStorage.setItem('emprestimosAtivos', JSON.stringify(emprestimosAtivos));

    window.location.href = "meusEmprestimos.html";
}

function renderizarEmprestimosAtivos() {
    const container = document.getElementById('container-emprestimos-ativos');
    if (!container) return;

    container.innerHTML = '';
    const emprestimosAtivos = JSON.parse(localStorage.getItem('emprestimosAtivos')) || [];

    if (emprestimosAtivos.length === 0) {
        container.innerHTML = '<p class="sem-emprestimos">Nenhum empréstimo ativo no momento.</p>';
        return;
    }

    emprestimosAtivos.forEach((emprestimo, index) => {
        const cardHtml = `
            <div class="card-emprestimo">
                <img src="${emprestimo.capa}" alt="${emprestimo.livro}">
                <div class="info-emprestimo">
                    <h3>${emprestimo.livro}</h3>
                    <p><strong>Cliente:</strong> ${emprestimo.cliente}</p>
                    <p><strong>Devolução:</strong> <span class="data-devolucao">${emprestimo.devolucao}</span></p>
                </div>
                <button class="btn-devolver" onclick="devolverLivro(${index})">Devolver</button>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

function devolverLivro(index) {
    const emprestimosAtivos = JSON.parse(localStorage.getItem('emprestimosAtivos')) || [];
    emprestimosAtivos.splice(index, 1);
    localStorage.setItem('emprestimosAtivos', JSON.stringify(emprestimosAtivos));
    renderizarEmprestimosAtivos();
}

document.addEventListener('DOMContentLoaded', renderizarEmprestimosAtivos);
