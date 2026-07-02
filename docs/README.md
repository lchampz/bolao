# Bolão Corporativo — Copa AMM Points 2026

Documentação de produto para o bolão interno da Copa, baseada no documento
`🏆 BOLÃO CORPORATIVO.docx`.

## Layout

Protótipos gerados via Google Stitch (tema "Arena Dynamic" — glassmorphism,
verde/amarelo/azul, tema estádio), consistentes entre si pelo mesmo design
system (`assets/1aa9e8301aa84d11983a9c222797e5e7`):

| Tela | Imagem | HTML |
|---|---|---|
| Dashboard | [dashboard.png](layout/dashboard.png) | [dashboard.html](layout/dashboard.html) |
| Ranking Global | [ranking.png](layout/ranking.png) | [ranking.html](layout/ranking.html) |
| Meus Palpites | [meus-palpites.png](layout/meus-palpites.png) | [meus-palpites.html](layout/meus-palpites.html) |

O app real implementado em [`web/`](../web) segue essa mesma estrutura de
navegação (Dashboard, Meus Palpites, Ranking, Departamentos, Administração) e
porta os elementos-chave desses protótipos (pódio com gradiente metálico,
badges hexagonais, anel de progresso, glow no troféu) para componentes React
reais e funcionais, em vez de HTML estático.

## Arquitetura e deploy

- [`server/`](../server) — Node + TypeScript + Express + PostgreSQL.
- [`web/`](../web) — React + TypeScript + Vite.
- Tudo dockerizado: [`docker-compose.yml`](../docker-compose.yml) na raiz
  sobe banco + backend + frontend juntos.
- [`render.yaml`](../render.yaml) — Blueprint para deploy gratuito no
  Render. Detalhes e limitações do plano free em [DEPLOY.md](DEPLOY.md).
- Cadastro é por convite de e-mail (unitário ou CSV em massa), não
  auto-cadastro livre — ver [`server/src/routes/invites.ts`](../server/src/routes/invites.ts)
  e a seção "Cadastro é por convite" em [DEPLOY.md](DEPLOY.md).

## Backlog (Histórias de Usuário)

Organizado por épico, na pasta [`backlog/`](backlog/):

| Épico | Arquivo |
|---|---|
| 1. Cadastro e Adesão | [HU-01-cadastro-e-adesao.md](backlog/HU-01-cadastro-e-adesao.md) |
| 2. Envio de Palpites | [HU-02-envio-de-palpites.md](backlog/HU-02-envio-de-palpites.md) |
| 3. Motor de Pontuação | [HU-03-motor-de-pontuacao.md](backlog/HU-03-motor-de-pontuacao.md) |
| 4. Bônus por Fase e Engajamento | [HU-04-bonus.md](backlog/HU-04-bonus.md) |
| 5. Ranking e Desempate | [HU-05-ranking-e-desempate.md](backlog/HU-05-ranking-e-desempate.md) |
| 6. Premiação e Encerramento | [HU-06-premiacao-e-encerramento.md](backlog/HU-06-premiacao-e-encerramento.md) |
| 7. Comunicação | [HU-07-comunicacao.md](backlog/HU-07-comunicacao.md) |
| 8. Administração do Bolão | [HU-08-administracao.md](backlog/HU-08-administracao.md) |
| 9. Gamificação Extra | [HU-09-gamificacao-extra.md](backlog/HU-09-gamificacao-extra.md) |

Cada história segue o formato `Como / Quero / Para que`, com critérios de
aceite em Given/When/Then e uma estimativa relativa (P/M/G).
