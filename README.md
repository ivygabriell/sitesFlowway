# Floway: site oficial

Monorepo do site da Floway (Next.js 15, App Router) e dos conceitos de portfólio.

```
apps/site/                      o site oficial
apps/site/public/conceitos/     conceitos estáticos, servidos em /conceitos/<slug>/
assets/brand/                   marca (cópia; a fonte é CreateHubAI/identidadeFloway)
processo/                       método: regras, memória, harnesses, contratos, scripts de worktree
docs/superpowers/               specs e planos
scripts/conceitos/              geração dos conceitos
```

Comandos na raiz: `npm test`, `npm run check`, `npm run test:build`. Servidor local: `npm run dev -w apps/site`.
Leia `CLAUDE.md` e `processo/memoria-do-projeto.md` antes de trabalhar.
