# Épico 2 — Envio de Palpites

## HU-02.1 — Enviar palpite de placar exato por jogo
**Como** participante,
**quero** informar o placar exato de cada jogo antes do início da partida,
**para que** eu possa concorrer aos pontos de acerto de placar (+3 AMM Points).

**Critérios de aceite:**
- Dado um jogo com horário definido, quando o participante envia o palpite antes do início, então o palpite é registrado.
- Dado que o horário de início do jogo já passou, quando o participante tenta enviar ou alterar o palpite, então o sistema bloqueia o envio ("não será permitido alterar palpites após o prazo").
- O palpite considera o resultado final incluindo tempo regulamentar + prorrogação; pênaltis contam apenas para definir o vencedor e não entram no placar exato.

**Estimativa:** G

## HU-02.2 — Editar palpite antes do prazo
**Como** participante,
**quero** poder alterar meu palpite enquanto o jogo não começou,
**para que** eu possa corrigir um envio ou mudar de opinião.

**Critérios de aceite:**
- Enquanto o prazo não expirou, o participante pode sobrescrever o palpite anterior.
- Após o fechamento do prazo, a última versão salva é a considerada oficialmente.

**Estimativa:** M

## HU-02.3 — Registrar apenas palpites do formulário oficial
**Como** organizador,
**quero** que somente palpites enviados pelo canal oficial sejam válidos,
**para que** não haja disputa sobre palpites informados por outros meios (ex.: mensagem direta).

**Critérios de aceite:**
- Palpites recebidos fora do formulário oficial não pontuam.
- Existe uma forma de auditar a hora exata de envio de cada palpite (necessário para os critérios de desempate e bônus de antecedência).

**Estimativa:** M
