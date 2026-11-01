import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';

const { cta, rodape } = contato;

// Rodapé em serifa, no pé da seção de contato (protótipo 07): o convite ao formulário no lugar do e-mail da referência,
// e as linhas com o rótulo em itálico. Visível só enquanto o contato está ativo (a classe "visivel" vem da timeline).
export function Rodape() {
  const idioma = useIdioma();
  return (
    <footer className="rodape">
      <a className="rodape-cta" href={rota('contato', idioma)}>
        {t(cta, idioma)}
      </a>
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
    </footer>
  );
}
