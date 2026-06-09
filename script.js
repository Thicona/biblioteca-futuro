const clientes = JSON.parse(localStorage.getItem('usuariosCadastrados')) || [
    { nome: "Ana Silva" },
    { nome: "Carlos Souza" },
    { nome: "Mariana Costa" }
];



function realizarCadastro() {
    const nome = document.getElementById('nome-completo').value.trim();
    const email = document.getElementById('email-login').value.trim();
    const cpf = document.getElementById('cpf-login').value.trim();
    const senha = document.getElementById('senha-login').value.trim();

    if (!nome || !email || !cpf || !senha) {
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

    if (senha.length < 6) {
        alert("A senha deve conter pelo menos 6 caracteres.");
        return;
    }

    alert("Cadastro realizado com sucesso!");
    window.location.href = "index.html";
}


function realizarLogin() {

    const nome = document.getElementById("nome-completo").value.trim();
    const email = document.getElementById("email-login").value.trim();
    const cpf = document.getElementById("cpf-login").value.trim();
    const senha = document.getElementById("senha-admin").value.trim();

    if (!nome || !email || !cpf || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    localStorage.setItem("usuarioLogado", nome);

    // Administrador
    if (senha === "biblioteca123") {
        window.location.href = "admin.html";
        return;
    }

    // Leitor comum
    if (senha.length <= 6) {
        window.location.href = "pagPrincipal.html";
        return;
    }

    alert("Senha inválida!");
}


async function buscarLivros() {

    const termo = document.getElementById("buscaLivro").value.trim();
    const resultados = document.getElementById("resultadosLivros");

    if (!termo) {
        alert("Digite o nome de um livro.");
        return;
    }

    resultados.innerHTML = "Buscando...";

    try {

        const resposta = await fetch(
            `https://openlibrary.org/search.json?title=${encodeURIComponent(termo)}`
        );

        const dados = await resposta.json();

        if (!dados.docs || dados.docs.length === 0) {
            resultados.innerHTML = "<p>Nenhum livro encontrado.</p>";
            return;
        }

        resultados.innerHTML = "";

        dados.docs.slice(0, 10).forEach(livro => {

            const titulo = livro.title || "Sem título";

            const autor = livro.author_name
                ? livro.author_name.join(", ")
                : "Autor desconhecido";

            const capa = livro.cover_i
                ? `https://covers.openlibrary.org/b/id/${livro.cover_i}-M.jpg`
                : "https://via.placeholder.com/128x180?text=Sem+Capa";

            resultados.innerHTML += `
    <div class="livros">
        <img src="${capa}" alt="${titulo}">
        <h2>${titulo}</h2>
        <p>${autor}</p>

        <a
            href="formulario.html?titulo=${encodeURIComponent(titulo)}&capa=${encodeURIComponent(capa)}"
            class="btn-emprestimo"
        >
            Emprestar
        </a>
    </div>
`;
        });

    } catch (erro) {
        resultados.innerHTML = "<p>Erro ao buscar livros.</p>";
        console.error(erro);
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

    const nomeCliente =
        document.getElementById("nome-cliente").value;

    if (!nomeCliente) {
        alert("Digite seu nome!");
        return;
    }

    const parametros = new URLSearchParams(window.location.search);

    const titulo = parametros.get("titulo");
    const capa = parametros.get("capa");

    const hoje = new Date();

    const dataDevolucao = new Date();
    dataDevolucao.setDate(hoje.getDate() + 7);

    const emprestimos =
        JSON.parse(localStorage.getItem("emprestimosAtivos")) || [];

    emprestimos.push({
        livro: titulo,
        capa: capa,
        cliente: nomeCliente,
        dataEmprestimo: hoje.toLocaleDateString("pt-BR"),
        devolucao: dataDevolucao.toLocaleDateString("pt-BR")
    });

    localStorage.setItem(
        "emprestimosAtivos",
        JSON.stringify(emprestimos)
    );

    alert(
        `Livro emprestado com sucesso!\nDevolução: ${dataDevolucao.toLocaleDateString("pt-BR")}`
    );

    window.location.href = "meusEmprestimos.html";
}

function devolverLivro(index) {
    const emprestimosAtivos = JSON.parse(localStorage.getItem('emprestimosAtivos')) || [];
    emprestimosAtivos.splice(index, 1);
    localStorage.setItem('emprestimosAtivos', JSON.stringify(emprestimosAtivos));
    renderizarEmprestimosAtivos();
}

document.addEventListener('DOMContentLoaded', renderizarEmprestimosAtivos);

function emprestarLivro(nomeLivro, capa) {

    const emprestimosAtivos =
        JSON.parse(localStorage.getItem('emprestimosAtivos')) || [];

    const hoje = new Date();

    const dataDevolucao = new Date();
    dataDevolucao.setDate(hoje.getDate() + 7);

    const novoEmprestimo = {
        livro: nomeLivro,
        capa: capa,
        cliente: localStorage.getItem('usuarioLogado'),
        dataEmprestimo: hoje.toLocaleDateString('pt-BR'),
        devolucao: dataDevolucao.toLocaleDateString('pt-BR')
    };

    emprestimosAtivos.push(novoEmprestimo);

    localStorage.setItem(
        'emprestimosAtivos',
        JSON.stringify(emprestimosAtivos)
    );

    alert('Livro emprestado com sucesso!');
}


function carregarLivroFormulario() {

    const parametros = new URLSearchParams(window.location.search);

    const titulo = parametros.get("titulo");
    const capa = parametros.get("capa");

    const tituloElemento =
        document.getElementById("livro-titulo");

    const capaElemento =
        document.getElementById("livro-capa");

    if (tituloElemento) {
        tituloElemento.textContent = titulo;
    }

    if (capaElemento) {
        capaElemento.src = capa;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    carregarLivroFormulario
);

function carregarEmprestimosAdmin() {

    const emprestimos =
        JSON.parse(localStorage.getItem("emprestimosAtivos")) || [];

    console.log("Empréstimos encontrados:", emprestimos);

    const tabela =
        document.getElementById("tabelaEmprestimos");

    if (!tabela) return;

    tabela.innerHTML = "";

    emprestimos.forEach((item, index) => {

        tabela.innerHTML += `
    <tr>
        <td>
            <img src="${item.capa}" width="60">
        </td>
        <td>${item.livro}</td>
        <td>${item.cliente}</td>
        <td>${item.devolucao}</td>
        <td>
            <button
                class="btn-devolver-admin"
                onclick="devolverEmprestimoAdmin(${index})"
            >
                Devolver
            </button>
        </td>
    </tr>
`;
    });
}

function devolverEmprestimoAdmin(index) {

    const emprestimos =
        JSON.parse(localStorage.getItem("emprestimosAtivos")) || [];

    const confirmar = confirm(
        "Deseja realmente devolver este livro?"
    );

    if (!confirmar) return;

    emprestimos.splice(index, 1);

    localStorage.setItem(
        "emprestimosAtivos",
        JSON.stringify(emprestimos)
    );

    carregarEmprestimosAdmin();

    alert("Livro devolvido com sucesso!");
}