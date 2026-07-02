# Deploy

## Login — uma tela só, para participante ou admin

`/#/entrar` é a única porta de entrada (link "Entrar" na sidebar, e é pra
onde o gate de admin manda quem tenta acessar Administração/Convites sem
sessão). Primeiro passo é só o e-mail — `POST /api/login/start`
([server/src/routes/login.ts](../server/src/routes/login.ts)) identifica o
que fazer a seguir:

- **E-mail do admin** → revela o campo de senha, na mesma tela (login efetivo em `POST /api/admin/login`).
- **E-mail de participante já cadastrado** → envia um link de acesso por e-mail (válido 15 min) e avisa pra checar a caixa de entrada.
- **E-mail sem cadastro** → orienta a pedir um convite ao organizador (não envia nada — convite continua sendo só via admin).

As rotas administrativas (lançar resultado manual, configurar a janela do
bônus "Madrugador", gerenciar convites) exigem login — ver
[server/src/auth.ts](../server/src/auth.ts). A credencial vem de
`ADMIN_EMAIL`/`ADMIN_PASSWORD` (variáveis de ambiente do `server`, lidas no
boot e re-hasheadas — bcrypt, nunca texto puro — a cada início do container).

```bash
echo "ADMIN_EMAIL=admin@suaempresa.com" >> .env
echo "ADMIN_PASSWORD=escolha-uma-senha-forte" >> .env
```

Sem essas variáveis, o servidor gera uma senha aleatória no primeiro boot e
só a mostra uma vez no log (`docker compose logs server`) — funciona, mas é
melhor configurar de propósito. No Render, `ADMIN_EMAIL`/`ADMIN_PASSWORD`
ficam como `sync: false` em `render.yaml` — preencha no dashboard.

O login gera um token (JWT, validade 24h) guardado no navegador; as demais
rotas de leitura pública (jogos, ranking, prêmios) continuam sem login.

## Cadastro é por convite (e-mail)

Ninguém se cadastra sozinho digitando o nome — o admin convida por e-mail
(um a um ou importando um CSV) em **Convites**, e quem recebe clica no link
para completar o cadastro. Sem convite aceito, o app continua navegável
(ranking, departamentos) mas não dá pra enviar palpite. Ver
[server/src/mailer.ts](../server/src/mailer.ts).

Quem já se cadastrou e perdeu a sessão (limpou o navegador, troca de
aparelho) usa a mesma tela **Entrar** para receber um novo link de acesso —
o token do link usa o mesmo segredo JWT do login de admin, mas com um `role`
diferente (não dá pra usar um pelo outro).

Os itens **Administração** e **Convites** só aparecem na sidebar depois do
login de admin — continuam acessíveis por URL direta (protegidos por login,
não por ocultação) para o próprio admin conseguir entrar.

**Envio de e-mail é opcional.** Sem nenhum provedor configurado, o convite
não é enviado de verdade — o link só é logado no console do servidor (dá pra
testar o fluxo inteiro assim, sem credenciais). Ver
[server/src/mailer.ts](../server/src/mailer.ts) — ordem de preferência:

1. **Brevo** (`BREVO_API_KEY`) — usa a API deles diretamente ([@getbrevo/brevo](https://www.npmjs.com/package/@getbrevo/brevo) npm), não SMTP. Tier gratuito: 300 e-mails/dia. [Criar chave](https://app.brevo.com/settings/keys/api).
2. **SMTP genérico** (`SMTP_HOST`/`PORT`/`USER`/`PASS`) — qualquer provedor (Mailtrap, o próprio Brevo via SMTP, etc). Usado só se `BREVO_API_KEY` não estiver setada.
3. **Console** (fallback, nenhuma credencial).

⚠️ **Brevo exige um remetente verificado** — diferente do Resend, não tem
um sender de teste anônimo. Vá em **Senders, Domains & Dedicated IPs** no
painel do Brevo, adicione o e-mail que você quer usar como remetente
(confirmação por clique no e-mail, não precisa verificar um domínio inteiro)
e configure `EMAIL_FROM` com exatamente esse endereço. Sem isso o envio
falha com erro de remetente inválido.

| Variável | Exemplo |
|---|---|
| `BREVO_API_KEY` | `xkeysib-xxx` |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `EMAIL_FROM` | `Bolão Copa AMM <no-reply@suaempresa.com>` |
| `APP_URL` | URL pública do `web` (usada para montar os links de convite/login) |

No Render, essas variáveis já ficam pré-cadastradas em `render.yaml` como
`sync: false` — preencha os valores reais no dashboard depois do primeiro deploy.

## Times, jogos e resultados são automáticos

O servidor sincroniza sozinho com a base pública e gratuita
[openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
(sem chave de API) no boot e a cada 20 minutos (`FIXTURE_SYNC_MINUTES`):
times, datas e placares oficiais da Copa 2026 (Oitavas → Final) chegam
prontos, sem precisar cadastrar jogos ou digitar resultado na mão. Times
ainda não definidos no chaveamento aparecem como "Vencedor Jogo N" e se
resolvem automaticamente na sincronização seguinte, quando a fonte for
atualizada. Dá pra forçar uma sincronização manual em Administração, e o
lançamento de resultado manual continua disponível como reserva caso a fonte
externa esteja fora do ar. Se a primeira sincronização falhar (sem internet,
por exemplo), o servidor cai para um conjunto de jogos fictício local só
para não subir vazio.

## Local, tudo dockerizado

```bash
docker compose up -d --build
```

- `web` → http://localhost:8080 (nginx servindo o build do React)
- `server` → http://localhost:4000 (API)
- `db` → Postgres, exposto em `localhost:5434` para inspeção manual (`psql`)

O nginx do `web` faz proxy de `/api/*` para o `server` dentro da rede do
compose, então o front funciona com chamadas relativas (`fetch('/api/...')`),
sem precisar saber a URL do backend.

Derrubar tudo: `docker compose down` (adicione `-v` para apagar os dados do Postgres).

## Render (plano gratuito)

O [`render.yaml`](../render.yaml) na raiz é um Blueprint — no dashboard do
Render, escolha **New > Blueprint** e aponte para o repositório
[lchampz/bolao](https://github.com/lchampz/bolao) (já existe e está com o
código atualizado). O Render detecta o `render.yaml` automaticamente.

**Isso só pode ser feito pelo dashboard** — a API do Render não tem endpoint
de "criar Blueprint" (só validar/listar/atualizar/desconectar um que já
existe), então nem um script nem um MCP pulam esse primeiro clique. Depois
de criado, preencha as variáveis marcadas `sync: false` (credencial de
admin, e-mail) no dashboard.

Ele cria 3 recursos, todos no plano free:

| Recurso | Tipo | Observação |
|---|---|---|
| `bolao-db` | Postgres free | ver limitação de expiração abaixo |
| `bolao-server` | Web Service (Docker, usa `server/Dockerfile`) | `DATABASE_URL` e `ALLOWED_ORIGIN` injetados automaticamente |
| `bolao-web` | Static Site (build nativo do Render, não usa Docker) | `VITE_API_URL` injetado automaticamente |

O static site usa o **build nativo do Render** em vez do `web/Dockerfile`
porque o runtime Docker do Render não aceita build args customizados — e é
assim que `VITE_API_URL` (a URL do backend, só conhecida depois do deploy)
chega no bundle. Localmente o Docker (`web/Dockerfile` + nginx) continua
sendo usado para ter paridade total com produção.

### ⚠️ Limitações reais do plano gratuito (não é "free" para sempre)

- **Postgres free expira em 30 dias** após a criação, com mais 14 dias de
  carência antes de ser **apagado com todos os dados**. Para um bolão que
  dura só a fase eliminatória da Copa isso costuma ser suficiente, mas não
  serve como solução permanente — depois disso é preciso recriar o banco
  (perdendo o histórico) ou migrar para um plano pago.
  ([changelog oficial](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90))
- **O `bolao-server` "dorme"** após ~15 minutos sem receber requisições, e a
  primeira requisição depois disso demora 30-60s (cold start). O
  `bolao-web` (static site) não tem esse problema.
- Sem cartão de crédito, mas com esses limites de tempo/expiração.

Se o bolão for para além de ~30 dias ou o cold start for um problema real de
usabilidade, vale migrar `bolao-db` para o plano `starter` do Postgres antes
da expiração (Render permite promover sem perder dados) — ver
[Flexible Plans for Render Postgres](https://render.com/docs/postgresql-refresh).

### Deploys depois do primeiro (script)

Depois que o Blueprint existe, [`scripts/render-deploy.sh`](../scripts/render-deploy.sh)
automatiza o resto via [API REST do Render](https://api-docs.render.com/) —
não existe um MCP conectado nesta sessão para isso nem foi conectado a
pedido; o script usa sua `RENDER_API_KEY` só no ambiente do terminal, nunca
salva em arquivo:

```bash
export RENDER_API_KEY=rnd_xxx   # dashboard.render.com/u/settings#api-keys
./scripts/render-deploy.sh list             # lista os serviços da conta
./scripts/render-deploy.sh deploy bolao-server   # dispara um novo deploy
./scripts/render-deploy.sh status bolao-server   # status do último deploy
```

Note que a `RENDER_API_KEY` dá acesso a **toda** a conta Render (todos os
workspaces), não só a este projeto — trate como qualquer outra credencial
sensível. Existe também o [MCP oficial do Render](https://render.com/docs/mcp-server)
(`mcp.render.com`) se preferir controlar a conta por conversa em vez de
script — mesma chave, mesmo cuidado.
