/*
 * Versao adaptada ao padrao visual do SENAI - tela de SUBPROCESSO, do
 * processo "Programa Competitividade - Solicitacao de Vaga em Turma
 * Exclusiva (EAD)".
 *
 * IMPORTANTE - estrutura DIFERENTE das demais telas: esta tela usa o modo
 * "nativo" do Zeev com Bootstrap 5 (<fieldset class="row g-3"> com
 * <legend> + campos em <div class="form-floating col-*">), nao a
 * <table class="form"><tr class="group"> das outras telas. Por isso este
 * script e bem mais simples que layout_padrao_cloud.js: o Bootstrap ja
 * organiza os campos em flex-row nativamente, e o CSS
 * (layout_padrao_senai_subprocesso_cloud.css) resolve o visual (barra
 * azul, label acima do campo, 4 colunas) so com "order"/flex, sem precisar
 * mover nenhum elemento no DOM. Este script cuida so de: (1) injetar o
 * Bootstrap 5, igual ao subProcesso.js original do SENAI, e (2) destacar
 * campos obrigatorios vazios quando o Zeev acusa erro de validacao.
 *
 * Como usar: cole este conteudo no campo de "JavaScript" customizado da
 * TELA DE SUBPROCESSO na plataforma (Zeev).
 */
(function () {
    // Injeta o Bootstrap 5 antes da primeira folha de estilo da pagina -
    // igual ao que subProcesso.js do SENAI ja fazia (e o que habilita essa
    // tela a usar o grid/form-floating nativo do Bootstrap).
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

    /*
     * Destaca os campos obrigatorios vazios e rola a tela ate o primeiro
     * deles quando o Zeev mostra o modal de erro de validacao (colorbox com
     * <h2>Atencao!</h2>) ao tentar enviar/salvar com campos obrigatorios
     * nao preenchidos. Logica identica a layout_padrao_cloud.js.
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
    // em vez de marcar cada quadradinho/bolinha, destaca o container
    // (.form-floating) que agrupa todos eles.
    function marcarGrupoVazio(itensDoGrupo) {
        var container = itensDoGrupo[0].closest('.form-floating') || itensDoGrupo[0].parentElement;
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
                    var containerDoGrupo = itensDoGrupo[0].closest('.form-floating') || itensDoGrupo[0];
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
        injetarBootstrap5();

        var observer = new MutationObserver(function () {
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
