/*
 * Versao adaptada ao padrao visual do SENAI - tela de SUBPROCESSO
 * (equivalente ao subProcesso.js original do SENAI), do processo "Programa
 * Competitividade - Solicitacao de Vaga em Turma Exclusiva (EAD)".
 * Existe uma versao irma para a tela de PROCESSO em
 * layout_padrao_senai_processo_cloud.js (equivalente ao processoPai.js
 * original) - o conteudo das duas e igual hoje, mas ficam em arquivos
 * separados porque cada tela usa seu proprio campo de JS customizado no
 * Zeev, podendo divergir no futuro.
 *
 * IMPORTANTE (historico): uma versao anterior deste arquivo mirava uma
 * estrutura de HTML com <fieldset>/<legend>/Bootstrap 5 nativo, baseada
 * num export de referencia que acabou sendo de um MODO DE RENDERIZACAO
 * diferente do que este ambiente realmente usa. O ambiente real usa a
 * mesma estrutura classica <table class="form"><tr class="group"> (e
 * tabelas mult com column-name) das demais telas - por isso esta versao
 * volta a usar a mesma base do layout_padrao_senai_processo_cloud.js.
 *
 * Base identica ao layout_padrao_cloud.js (grid de ate 4 colunas, label
 * acima do campo, reorganizacao das colunas da tabela mult, destaque de
 * campo obrigatorio vazio). A UNICA diferenca funcional e a injecao do
 * Bootstrap 5 antes da primeira folha de estilo, replicando o que
 * processoPai.js/subProcesso.js do SENAI ja faziam - o resto do visual
 * SENAI (fontes, esconder botoes Inserir/Excluir, fundo das secoes) fica
 * todo no layout_padrao_senai_subprocesso_cloud.css.
 *
 * IMPORTANTE: este script NAO move nem remove nenhum <tr>/<td> do HTML
 * original - so adiciona classes. Isso e proposital: o Zeev tem uma
 * automacao que esconde/mostra campos aplicando style="display:none" na
 * <tr> original (ex.: <tr codgroup="2763" class="execute-required">). Se a
 * gente mover esses elementos para outra <tr>, a automacao passa a
 * esconder/mostrar um elemento que nao esta mais na tela, e o campo nunca
 * some/aparece visualmente. Mantendo a <tr> original intacta e so trocando
 * o "display" dela via CSS (flex), a automacao do Zeev continua
 * funcionando normalmente e o layout se reorganiza sozinho quando um campo
 * aparece ou desaparece.
 *
 * Como usar: cole este conteudo no campo de "JavaScript" customizado da
 * TELA DE SUBPROCESSO na plataforma (Zeev). NAO afeta layout_padrao_cloud.js.
 */
(function () {
    // Injeta o Bootstrap 5 antes da primeira folha de estilo da pagina -
    // igual ao que processoPai.js/subProcesso.js do SENAI ja faziam.
    function injetarBootstrap5() {
        var primeiroLink = document.querySelector('link[rel="stylesheet"]');
        if (!primeiroLink || document.getElementById('bootstrap5-senai')) {
            return;
        }
        var link = document.createElement('link');
        link.id = 'bootstrap5-senai';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
        primeiroLink.parentNode.insertBefore(link, primeiroLink);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injetarBootstrap5);
    } else {
        injetarBootstrap5();
    }

    var SELETOR_TABELAS = 'table[data-groupid]:not([mult])';
    var SELETOR_TABELAS_MULT = 'table[mult]';

    function estilizarTabelaSimples(tabela) {
        if (tabela.getAttribute('data-estilizado-simples') === 'true') {
            return false;
        }
        tabela.setAttribute('data-estilizado-simples', 'true');
        tabela.classList.add('tabela-campos-em-linha');
        return true;
    }

    function estilizarTodasAsTabelasSimples() {
        var tabelas = document.querySelectorAll(SELETOR_TABELAS);
        var alguma = false;
        for (var i = 0; i < tabelas.length; i++) {
            if (estilizarTabelaSimples(tabelas[i])) {
                alguma = true;
            }
        }
        return alguma;
    }

    function estilizarTabela(tabela) {
        if (tabela.getAttribute('data-estilizado') === 'true') {
            return false;
        }
        tabela.setAttribute('data-estilizado', 'true');
        tabela.classList.add('tabela-mult-em-card');

        var wrapper = tabela.closest('.table-responsive');
        if (wrapper) {
            wrapper.classList.add('tabela-mult-card-wrapper');
        }

        organizarColunasMult(tabela);
        adicionarBotaoEditarDados(tabela);

        return true;
    }

    /*
     * Botao "Editar dados": os campos da tabela mult comecam somente-leitura
     * e so ficam editaveis depois que o usuario clica no botao (que fica no
     * cabecalho/caption da tabela). Reproduz o comportamento que existia no
     * Zeev antigo do SENAI (la, um script proprio deles fazia
     * $('#secao input').prop('readonly', true) + um botao "Editar dados"
     * que alternava isso) - aqui recriamos o MESMO comportamento de forma
     * generica, sem depender de nomes de campo especificos, entao funciona
     * em qualquer tabela mult independente de quais campos ela tiver.
     */
    function alternarSomenteLeituraCampos(campos, somenteLeitura) {
        campos.forEach(function (campo) {
            if (campo.tagName === 'SELECT') {
                campo.disabled = somenteLeitura;
            } else {
                campo.readOnly = somenteLeitura;
            }
        });
    }

    function adicionarBotaoEditarDados(tabela) {
        if (tabela.getAttribute('data-editar-dados') === 'true') {
            return;
        }
        tabela.setAttribute('data-editar-dados', 'true');

        var caption = tabela.querySelector('caption');
        var tbody = tabela.querySelector('tbody');
        if (!caption || !tbody) {
            return;
        }

        var pegarCampos = function () {
            return Array.prototype.slice.call(tbody.querySelectorAll('input, select, textarea'));
        };

        var editando = false;
        alternarSomenteLeituraCampos(pegarCampos(), true);

        var botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn-editar-dados-mult';
        botao.textContent = 'Editar dados';
        botao.addEventListener('click', function () {
            editando = !editando;
            alternarSomenteLeituraCampos(pegarCampos(), !editando);
            botao.textContent = editando ? 'Fechar edição' : 'Editar dados';
        });

        caption.appendChild(botao);

        // Se novos campos aparecerem depois (ex.: um novo registro
        // inserido), aplica o mesmo estado atual (editavel ou nao) neles.
        var observerCampos = new MutationObserver(function () {
            alternarSomenteLeituraCampos(pegarCampos(), !editando);
        });
        observerCampos.observe(tbody, { childList: true, subtree: true });
    }

    /*
     * Nas tabelas mult, o label de cada campo fica numa celula separada, na
     * <tr class="header"> compartilhada por todos os registros (nao junto
     * do campo, como nas tabelas simples). Para conseguir o mesmo visual de
     * "label acima do campo, ate 4 por linha", copiamos o texto de cada
     * label do cabecalho para dentro da celula de dado correspondente (via
     * column-name) e escondemos so as celulas de label do cabecalho -
     * mantendo visivel a primeira celula dele, que tem o botao Inserir
     * (o CSS SENAI depois esconde esse botao visualmente, mas o marcamos
     * do mesmo jeito para manter a mesma logica do layout padrao).
     */
    function celulaDeControle(linha) {
        var primeira = linha.firstElementChild;
        // A celula de controle (Inserir/Excluir) nunca tem "column-name" -
        // se a primeira celula da linha tiver esse atributo, e porque o
        // Zeev nao renderizou controle nenhum nesse estado da tabela (ex.:
        // quando todos os campos estao visiveis, em tabelas mult limitadas
        // a 1 registro). Retornar null evita tratar um campo de verdade
        // como se fosse o botao.
        if (!primeira || primeira.hasAttribute('column-name')) {
            return null;
        }
        return primeira;
    }

    function aplicarLabelsNasLinhasDeDados(tbody, linhaCabecalho, mapaDeLabels) {
        var linhas = Array.prototype.slice.call(tbody.querySelectorAll('tr'));

        linhas.forEach(function (linha) {
            if (linha === linhaCabecalho || linha.getAttribute('data-labels-aplicados') === 'true') {
                return;
            }
            linha.setAttribute('data-labels-aplicados', 'true');

            var controle = celulaDeControle(linha);
            var indice = 0;
            var MAX_POR_LINHA = 4;

            Array.prototype.forEach.call(linha.children, function (celula) {
                var nomeDaColuna = celula.getAttribute('column-name');
                if (!nomeDaColuna || !mapaDeLabels[nomeDaColuna]) {
                    return;
                }

                // Campo marcado pelo Zeev como nao editavel/nao visivel para
                // esta tarefa (class="hide", input vira type="hidden") - fica
                // fora da contagem para nao deixar buraco no grid quando os
                // campos visiveis se reorganizam.
                if (celula.classList.contains('hide')) {
                    return;
                }

                var rotulo = document.createElement('div');
                rotulo.className = 'mult-label-campo';
                rotulo.textContent = mapaDeLabels[nomeDaColuna];
                celula.insertBefore(rotulo, celula.firstChild);

                var linhaGrid = Math.floor(indice / MAX_POR_LINHA) + 1;
                var colunaGrid = (indice % MAX_POR_LINHA) + 1;
                celula.style.gridRow = String(linhaGrid);
                celula.style.gridColumn = String(colunaGrid);
                indice++;
            });

            if (controle) {
                controle.classList.add('celula-controle-mult');
            }
        });
    }

    function organizarColunasMult(tabela) {
        var tbody = tabela.querySelector('tbody');
        if (!tbody) {
            return false;
        }

        var linhaCabecalho = tbody.querySelector('tr.header');
        if (!linhaCabecalho) {
            return false;
        }

        var mapaDeLabels = {};
        Array.prototype.forEach.call(linhaCabecalho.children, function (celula) {
            var nomeDaColuna = celula.getAttribute('column-name');
            if (nomeDaColuna) {
                mapaDeLabels[nomeDaColuna] = celula.textContent.trim();
                celula.classList.add('celula-label-mult-oculta');
            }
        });

        var controleCabecalho = celulaDeControle(linhaCabecalho);
        if (controleCabecalho) {
            controleCabecalho.classList.add('celula-controle-mult');
        }

        aplicarLabelsNasLinhasDeDados(tbody, linhaCabecalho, mapaDeLabels);

        // Quando o usuario clica em "Inserir", o Zeev acrescenta uma nova
        // <tr> de dados no tbody - este observer aplica os labels nela tambem.
        var observerLinhas = new MutationObserver(function () {
            aplicarLabelsNasLinhasDeDados(tbody, linhaCabecalho, mapaDeLabels);
        });
        observerLinhas.observe(tbody, { childList: true });

        return true;
    }

    function estilizarTodasAsTabelasMult() {
        var tabelas = document.querySelectorAll(SELETOR_TABELAS_MULT);
        var alguma = false;
        for (var i = 0; i < tabelas.length; i++) {
            if (estilizarTabela(tabelas[i])) {
                alguma = true;
            }
        }
        return alguma;
    }

    /*
     * Destaca os campos obrigatorios vazios e rola a tela ate o primeiro
     * deles quando o Zeev mostra o modal de erro de validacao (colorbox com
     * <h2>Atencao!</h2>) ao tentar enviar/salvar com campos obrigatorios
     * nao preenchidos.
     */
    var CLASSE_CAMPO_VAZIO = 'campo-obrigatorio-vazio';
    var CLASSE_GRUPO_VAZIO = 'grupo-obrigatorio-vazio';
    var SELETOR_CAMPOS_OBRIGATORIOS = [
        'input[data-required="true"]',
        'select[data-required="true"]',
        'textarea[data-required="true"]',
        'input[required="S"]',
        'select[required="S"]',
        'textarea[required="S"]'
    ].join(', ');

    function estaVazio(campo) {
        var tag = campo.tagName;
        if (tag === 'SELECT') {
            return !campo.value;
        }
        if (tag === 'INPUT') {
            var tipo = (campo.type || '').toLowerCase();
            if (tipo === 'checkbox' || tipo === 'radio') {
                return !campo.checked;
            }
            return !campo.value || !campo.value.trim();
        }
        if (tag === 'TEXTAREA') {
            return !campo.value || !campo.value.trim();
        }
        return false;
    }

    function limparMarcacoesAnteriores() {
        var marcados = document.querySelectorAll('.' + CLASSE_CAMPO_VAZIO);
        for (var i = 0; i < marcados.length; i++) {
            marcados[i].classList.remove(CLASSE_CAMPO_VAZIO);
        }

        var gruposMarcados = document.querySelectorAll('.' + CLASSE_GRUPO_VAZIO);
        for (var j = 0; j < gruposMarcados.length; j++) {
            gruposMarcados[j].classList.remove(CLASSE_GRUPO_VAZIO);
        }
    }

    function ehCheckboxOuRadio(campo) {
        var tipo = (campo.type || '').toLowerCase();
        return campo.tagName === 'INPUT' && (tipo === 'checkbox' || tipo === 'radio');
    }

    function chaveDoGrupo(campo) {
        return campo.name || campo.getAttribute('data-name') || campo.id;
    }

    function marcarCampoVazio(campo) {
        campo.classList.add(CLASSE_CAMPO_VAZIO);

        // So amarra o listener de "limpar ao preencher" uma unica vez por campo.
        if (!campo.dataset.listenerObrigatorioAmarrado) {
            campo.dataset.listenerObrigatorioAmarrado = 'true';
            var evento = campo.tagName === 'SELECT' ? 'change' : 'input';
            campo.addEventListener(evento, function () {
                if (!estaVazio(campo)) {
                    campo.classList.remove(CLASSE_CAMPO_VAZIO);
                }
            });
        }
    }

    // Checkbox/radio de um mesmo grupo (mesmo name) representam UM campo so:
    // em vez de marcar cada quadradinho/bolinha, destaca o container que
    // agrupa todos eles (o td.col1), e basta um item ficar marcado para o
    // destaque do grupo inteiro sumir.
    function marcarGrupoVazio(itensDoGrupo) {
        var container = itensDoGrupo[0].closest('td.col1') || itensDoGrupo[0].parentElement;
        if (!container) {
            return;
        }
        container.classList.add(CLASSE_GRUPO_VAZIO);

        itensDoGrupo.forEach(function (campo) {
            if (!campo.dataset.listenerObrigatorioAmarrado) {
                campo.dataset.listenerObrigatorioAmarrado = 'true';
                campo.addEventListener('change', function () {
                    var algumMarcado = itensDoGrupo.some(function (c) {
                        return c.checked;
                    });
                    if (algumMarcado) {
                        container.classList.remove(CLASSE_GRUPO_VAZIO);
                    }
                });
            }
        });
    }

    function processarModalDeErroObrigatorio() {
        var colorbox = document.getElementById('colorbox');
        if (!colorbox || window.getComputedStyle(colorbox).display === 'none') {
            return;
        }

        var dialog = colorbox.querySelector('.cryo-confirm-dialog');
        if (!dialog || dialog.getAttribute('data-tratado') === 'true') {
            return;
        }

        var titulo = dialog.querySelector('h2');
        if (!titulo || titulo.textContent.indexOf('Aten') === -1) {
            return;
        }

        dialog.setAttribute('data-tratado', 'true');
        limparMarcacoesAnteriores();

        var candidatos = Array.prototype.slice.call(document.querySelectorAll(SELETOR_CAMPOS_OBRIGATORIOS));
        var gruposAvaliados = {};
        var vazios = [];

        candidatos.forEach(function (campo) {
            if (ehCheckboxOuRadio(campo)) {
                var tipo = campo.type.toLowerCase();
                var chave = tipo + '|' + chaveDoGrupo(campo);

                if (gruposAvaliados[chave]) {
                    return;
                }
                gruposAvaliados[chave] = true;

                var itensDoGrupo = candidatos.filter(function (c) {
                    return ehCheckboxOuRadio(c) && c.type.toLowerCase() === tipo && chaveDoGrupo(c) === chaveDoGrupo(campo);
                });
                var algumMarcado = itensDoGrupo.some(function (c) {
                    return c.checked;
                });

                if (!algumMarcado) {
                    marcarGrupoVazio(itensDoGrupo);
                    var containerDoGrupo = itensDoGrupo[0].closest('td.col1') || itensDoGrupo[0];
                    vazios.push(containerDoGrupo);
                }
                return;
            }

            if (estaVazio(campo)) {
                marcarCampoVazio(campo);
                vazios.push(campo);
            }
        });

        if (!vazios.length) {
            return;
        }

        var irParaPrimeiroCampo = function () {
            vazios[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof vazios[0].focus === 'function') {
                vazios[0].focus({ preventScroll: true });
            }
        };

        var botaoOk = dialog.querySelector('button');
        if (botaoOk) {
            botaoOk.addEventListener('click', irParaPrimeiroCampo, { once: true });
        } else {
            irParaPrimeiroCampo();
        }
    }

    function iniciar() {
        estilizarTodasAsTabelasSimples();
        estilizarTodasAsTabelasMult();

        var observer = new MutationObserver(function () {
            estilizarTodasAsTabelasSimples();
            estilizarTodasAsTabelasMult();
            processarModalDeErroObrigatorio();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
