# Épico 1 — Cadastro e Adesão ao Bolão

## HU-01.1 — Entrar no bolão por convite de e-mail
**Como** colaborador,
**quero** receber um link de convite por e-mail e completar meu cadastro nele,
**para que** só quem foi convidado pelo organizador participe do bolão.

**Decisão de refinamento:** a versão inicial desta HU previa auto-cadastro livre
(nome + área, sem e-mail). Foi substituída por um fluxo de convite — o
organizador cadastra e-mails (um a um ou via CSV) em **Convites**, o sistema
dispara o e-mail com o link, e o colaborador clica para completar o cadastro
(nome + área; o e-mail vem do convite, não é digitado). Ver
[server/src/routes/invites.ts](../../server/src/routes/invites.ts).

**Critérios de aceite:**
- O organizador cadastra um e-mail (unitário) ou importa uma lista via CSV; cada e-mail recebe um convite com link único.
- O link leva a uma tela que já mostra o e-mail convidado (travado) e pede apenas nome + área.
- Um convite só pode ser aceito uma vez; convites para o mesmo e-mail podem ser reenviados enquanto pendentes.
- Sem aceitar um convite, o colaborador pode navegar pelo app (ranking, departamentos) mas não envia palpites.
- Somente palpites de participantes com convite aceito entram no ranking oficial (regra geral do documento).

**Estimativa:** M

## HU-01.2 — Vincular participante a uma área/departamento
**Como** organizador do bolão,
**quero** que cada participante informe sua área (RH, TI, Financeiro etc.),
**para que** a competição entre áreas (ideia extra de engajamento) seja calculada corretamente.

**Critérios de aceite:**
- O formulário de inscrição possui campo obrigatório de área/departamento.
- É possível listar participantes agrupados por área.

**Estimativa:** P

## HU-01.3 — Grupo oficial de comunicação
**Como** organizador,
**quero** criar o grupo oficial do bolão (Teams ou WhatsApp) no lançamento,
**para que** todos os participantes recebam comunicados centralizados.

**Critérios de aceite:**
- Existe um único grupo oficial, divulgado junto com o link do formulário.
- Todo inscrito recebe o convite para o grupo.

**Estimativa:** P
