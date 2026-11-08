'use client';

import { useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useState } from 'react';
import { Conversa } from '@/componentes/contato/Conversa';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import type { Pedido } from '@/lib/pedidoDeContato';
import { Formulario } from '@/componentes/contato/Formulario';
import { Rodape } from '@/componentes/contato/Rodape';
import { EsferaDeLetras } from '@/compartilhados/esfera/EsferaDeLetras';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import { alvoDoSimbolo } from '@/marca/amostrar';
import '@/componentes/contato/estilo.css';

// A página controla a composição B; a esfera apenas recebe os estados verificados.
export function PaginaContato({ estado, servidor }: { estado?: string; servidor?: ContatoServidorDTO }) {
  const idioma = useIdioma();
  const [enviado, setEnviado] = useState(false);
  const [comJS, setComJS] = useState(false);
  const [aberta, setAberta] = useState(false);
  const [respondendo, setRespondendo] = useState(false);
  useEffect(() => setComJS(true), []);
  const [modo, setModo] = useState<'conversa' | 'formulario'>('conversa');
  const [pedido, setPedido] = useState<Pedido>({ nome: '', empresa: '', contato: '', mensagem: '' });
  const [editado, setEditado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const conversa = comJS && servidor?.conversaDisponivel && modo === 'conversa' && !bloqueado;
  const { reflow } = useScrollRig();
  // O corpo pode manter a altura ao trocar colunas; o ScrollRig precisa reler a posição da esfera.
  useEffect(() => reflow(), [aberta, conversa, enviado, reflow]);
  void estado;
  return (
    <main className="pagina-contato" data-fundo="claro" id="topo">
      <h1 className="frase-contato">{t(contato.frase, idioma)}</h1>
      <div className={`pagina-contato-corpo ${conversa ? aberta ? 'contato-b-aberta' : 'contato-b-vazio' : ''}`} data-respondendo={respondendo}>
        <div className="contato-painel" hidden={!conversa}>
          {comJS && servidor?.conversaDisponivel && <Conversa aoAbrir={() => setAberta(true)} aoResponder={setRespondendo} aoSugerir={s => { if (!editado) setPedido(p => ({ ...p, mensagem: s })); }} aoFormulario={() => { setModo('formulario'); requestAnimationFrame(() => document.getElementById('pedido-nome')?.focus()); }} />}
        </div>
        <div className="contato-painel" hidden={!!conversa}>
          <Formulario servidor={servidor} pedido={pedido} aoEditar={p => { if (p.mensagem !== pedido.mensagem) setEditado(true); setPedido(p); }} aoEnviar={() => setEnviado(true)} aoBloquear={setBloqueado} />
          {comJS && servidor?.conversaDisponivel && !bloqueado && <div className="formulario-acoes"><button type="button" onClick={() => { setModo('conversa'); requestAnimationFrame(() => document.getElementById('conversa-entrada')?.focus()); }}>{t(contato.conversa.voltar, idioma)}</button></div>}
        </div>
        <EsferaDeLetras alvo={alvoDoSimbolo} formarAlvo={enviado} respondendo={respondendo} />
      </div>
      <Rodape naPaginaDeContato />
      <div className="circulo-escuro" aria-hidden="true" />
    </main>
  );
}
