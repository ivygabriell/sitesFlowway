import type { MouseEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';

const { cta, rodape } = contato;

// Rodapé em serifa, no pé da seção de contato (protótipo 07): o convite ao formulário no lugar do e-mail da referência,
// e as linhas com o rótulo em itálico. Visível só enquanto o contato está ativo (a classe "visivel" vem da timeline).
// Na página de contato, fica sempre visível e sem o CTA, que apontaria para ela mesma.
// aoIniciar: no fim da Início, o CTA abre o chat na própria cena; o href continua para sem JS e para Ctrl/Cmd.
export function Rodape({ naPaginaDeContato = false, aoIniciar }: { naPaginaDeContato?: boolean; aoIniciar?: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  const idioma = useIdioma();
  return (
    <footer className={naPaginaDeContato ? 'rodape visivel' : 'rodape'}>
      {!naPaginaDeContato && (
        <a className="rodape-cta" href={rota('contato', idioma)} onClick={aoIniciar}>
          {t(cta, idioma)}
        </a>
      )}
      <div className="rodape-info">
        <p className="rodape-linha">
          <i>{t(rodape.especialidades.rotulo, idioma)}</i>
          <span>{t(rodape.especialidades.valor, idioma)}</span>
        </p>
        <p className="rodape-linha">
          <i>{t(rodape.localizacao.rotulo, idioma)}</i>
          <span>{t(rodape.localizacao.valor, idioma)}</span>
          <i>{t(rodape.instagram.rotulo, idioma)}</i>
          <span>{t(rodape.instagram.valor, idioma)}</span>
        </p>
        <p className="rodape-linha">{t(rodape.direitos, idioma)}</p>
      </div>
    </footer>
  );
}
