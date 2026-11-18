// Floway — página principal. Código próprio, sem dependências.
(function () {
  "use strict";
  var doc = document, raiz = doc.documentElement;
  var semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var temMouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var todos = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };

  // Libera as animações de entrada do início
  requestAnimationFrame(function () { raiz.classList.add("pronto"); });

  // ---------- Entradas ao rolar ----------
  var alvos = todos("[data-surge]");
  if ("IntersectionObserver" in window && !semMovimento) {
    var olho = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) { if (i.isIntersecting) { i.target.classList.add("visto"); olho.unobserve(i.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    alvos.forEach(function (a) { olho.observe(a); });
  } else alvos.forEach(function (a) { a.classList.add("visto"); });

  // ---------- Barra de progresso ----------
  var barra = doc.querySelector(".progresso i"), pedido = 0;
  function progresso() {
    pedido = 0;
    var total = raiz.scrollHeight - innerHeight;
    barra.style.setProperty("--p", total > 0 ? Math.min(1, scrollY / total).toFixed(4) : 0);
  }
  if (barra) { addEventListener("scroll", function () { if (!pedido) pedido = requestAnimationFrame(progresso); }, { passive: true }); progresso(); }

  // ---------- Menu do celular ----------
  var botao = doc.querySelector(".topo__menu"), menu = doc.getElementById("menu");
  function abrirMenu(abre) {
    menu.classList.toggle("aberto", abre);
    menu.inert = !abre;
    botao.setAttribute("aria-expanded", abre);
    botao.setAttribute("aria-label", abre ? "Fechar menu" : "Abrir menu");
    doc.body.style.overflow = abre ? "hidden" : "";
  }
  if (botao && menu) {
    botao.addEventListener("click", function () { abrirMenu(!menu.classList.contains("aberto")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) abrirMenu(false); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("aberto")) { abrirMenu(false); botao.focus(); } });
    matchMedia("(min-width: 901px)").addEventListener("change", function (m) { if (m.matches) abrirMenu(false); });
  }

  // ---------- Botão secundário: a onda nasce onde o mouse entra ----------
  todos(".btn--v").forEach(function (b) {
    function ponto(e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty("--bx", e.clientX - r.left + "px");
      b.style.setProperty("--by", e.clientY - r.top + "px");
    }
    b.addEventListener("pointerenter", ponto);
    b.addEventListener("pointerleave", ponto);
  });

  // ---------- Luz que segue o cursor nos cartões ----------
  if (temMouse) todos("[data-luz]").forEach(function (c) {
    var luz = doc.createElement("span");
    luz.className = "luz"; luz.setAttribute("aria-hidden", "true");
    c.appendChild(luz);
    c.addEventListener("pointermove", function (e) {
      var r = luz.getBoundingClientRect();
      luz.style.setProperty("--lx", e.clientX - r.left + "px");
      luz.style.setProperty("--ly", e.clientY - r.top + "px");
    });
  });

  // ---------- Painel do teste A/B: conta, enche as barras e recomeça a cada 9 s ----------
  var painel = doc.querySelector(".painel");
  if (painel) {
    var numeros = todos("[data-ate]", painel), CICLO = 9000, CONTA = 3800, relogio = 0, quadro = 0;
    var escreve = function (el, v) {
      var casas = +el.dataset.casas || 0;
      el.textContent = v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
    };
    var rodada = function () {
      cancelAnimationFrame(quadro);
      painel.classList.remove("roda");
      void painel.offsetWidth; // reinicia as animações do CSS
      painel.classList.add("roda");
      var inicio = performance.now();
      (function passo(agora) {
        var t = Math.min(1, (agora - inicio) / CONTA), suave = 1 - Math.pow(1 - t, 3);
        numeros.forEach(function (n) { escreve(n, +n.dataset.ate * suave); });
        if (t < 1) quadro = requestAnimationFrame(passo);
      })(inicio);
    };
    if (semMovimento || !("IntersectionObserver" in window)) numeros.forEach(function (n) { escreve(n, +n.dataset.ate); });
    else new IntersectionObserver(function (itens) {
      // só anima enquanto o painel está na tela
      clearInterval(relogio); relogio = 0;
      if (itens[0].isIntersecting) { rodada(); relogio = setInterval(rodada, CICLO); }
    }, { threshold: 0.25 }).observe(painel);
  }

  // ---------- Grade de pontos do início (só com mouse, em tela larga) ----------
  var tela = doc.querySelector(".inicio__pontos");
  if (tela && (!temMouse || innerWidth < 761)) tela.remove();
  else if (tela) pontos(tela);

  function pontos(tela) {
    var ctx = tela.getContext("2d"), secao = tela.parentElement;
    var PASSO = 26, RAIO = 170, EMPURRA = 9, ONDA_MS = 1400;   // distância entre pontos, alcance da luz, deslocamento máximo (px)
    var escala = 1, larg = 0, alt = 0, colunas = 0, linhas = 0, x0 = 0, y0 = 0, brilho = new Float32Array(0);
    var alvoX = 0, alvoY = 0, luzX = 0, luzY = 0, dentro = false, quadro = 0, ondas = [];

    function medir() {
      var r = tela.getBoundingClientRect();
      if (!r.width || !r.height) return;
      escala = Math.min(devicePixelRatio || 1, 2);
      larg = r.width; alt = r.height;
      tela.width = Math.round(larg * escala); tela.height = Math.round(alt * escala);
      colunas = Math.ceil(larg / PASSO) + 1; linhas = Math.ceil(alt / PASSO) + 1;
      x0 = (larg - (colunas - 1) * PASSO) / 2; y0 = (alt - (linhas - 1) * PASSO) / 2;
      brilho = new Float32Array(colunas * linhas);
      desenhar(performance.now());
    }

    // Devolve true enquanto ainda há algo se mexendo (para parar o laço quando tudo apaga)
    function desenhar(agora) {
      if (dentro) { luzX += (alvoX - luzX) * 0.22; luzY += (alvoY - luzY) * 0.22; }
      ondas = ondas.filter(function (o) { return agora - o.t < ONDA_MS; });
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      ctx.clearRect(0, 0, larg, alt);

      if (dentro) { // mancha suave de luz sob o cursor
        var g = ctx.createRadialGradient(luzX, luzY, 0, luzX, luzY, RAIO * 1.6);
        g.addColorStop(0, "rgba(91,123,255,.10)"); g.addColorStop(1, "rgba(91,123,255,0)");
        ctx.fillStyle = g; ctx.fillRect(luzX - RAIO * 1.6, luzY - RAIO * 1.6, RAIO * 3.2, RAIO * 3.2);
      }

      var vivo = dentro || ondas.length > 0;
      for (var l = 0; l < linhas; l++) for (var c = 0; c < colunas; c++) {
        var bx = x0 + c * PASSO, by = y0 + l * PASSO, x = bx, y = by, k = l * colunas + c, e = brilho[k], dx, dy, d, f;
        if (dentro) {
          dx = bx - luzX; dy = by - luzY; d = Math.sqrt(dx * dx + dy * dy);
          if (d < RAIO) { f = 1 - d / RAIO; f *= f; if (f > e) e = f; x += dx * f * EMPURRA / (d || 1); y += dy * f * EMPURRA / (d || 1); }
        }
        for (var o = 0; o < ondas.length; o++) { // anel que se abre a partir do clique
          var idade = (agora - ondas[o].t) / 1000;
          dx = bx - ondas[o].x; dy = by - ondas[o].y; d = Math.sqrt(dx * dx + dy * dy);
          f = (1 - Math.abs(d - idade * 620) / 46) * (1 - idade * 1000 / ONDA_MS);
          if (f > 0) { if (f > e) e = f; x += dx * f * 6 / (d || 1); y += dy * f * 6 / (d || 1); }
        }
        if (e > 0.004) { vivo = true; brilho[k] = e * 0.93; } else brilho[k] = e = 0;

        if (!e) { ctx.fillStyle = "rgba(247,247,245,.11)"; ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); continue; }
        var q = Math.min(1, e * 1.5), tam = 0.9 + e * 1.7; // q: quanto do claro (#F7F7F5) vira azul (#5B7BFF)
        if (e > 0.3) { ctx.fillStyle = "rgba(91,123,255," + (e - 0.3) * 0.32 + ")"; ctx.beginPath(); ctx.arc(x, y, tam * 3, 0, 6.2832); ctx.fill(); }
        ctx.fillStyle = "rgba(" + Math.round(247 - 156 * q) + "," + Math.round(247 - 124 * q) + "," + Math.round(245 + 10 * q) + "," + (0.12 + e * 0.88) + ")";
        ctx.beginPath(); ctx.arc(x, y, tam, 0, 6.2832); ctx.fill();
      }
      return vivo;
    }

    function laco(agora) { quadro = desenhar(agora) ? requestAnimationFrame(laco) : 0; }
    function acorda() { if (!quadro && !semMovimento) quadro = requestAnimationFrame(laco); }

    // escuta na janela, para links e botões por cima da grade não cortarem o efeito
    addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = tela.getBoundingClientRect();
      alvoX = e.clientX - r.left; alvoY = e.clientY - r.top;
      var agoraDentro = alvoX >= 0 && alvoX <= r.width && alvoY >= 0 && alvoY <= r.height;
      if (agoraDentro && !dentro) { luzX = alvoX; luzY = alvoY; }
      dentro = agoraDentro; acorda();
    }, { passive: true });
    raiz.addEventListener("pointerleave", function () { dentro = false; });
    addEventListener("blur", function () { dentro = false; });
    addEventListener("scroll", function () { if (dentro) dentro = tela.getBoundingClientRect().bottom > 0; }, { passive: true });
    secao.addEventListener("pointerdown", function (e) {
      if (semMovimento || e.target.closest("a, button")) return;
      var r = tela.getBoundingClientRect();
      ondas.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
      if (ondas.length > 3) ondas.shift();
      acorda();
    });
    new ResizeObserver(medir).observe(tela);
    medir();
  }
})();
