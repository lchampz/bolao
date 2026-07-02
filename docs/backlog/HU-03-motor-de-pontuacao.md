# Épico 3 — Motor de Pontuação (AMM Points)

## HU-03.1 — Pontuar acerto de placar exato
**Como** sistema de pontuação,
**quero** atribuir +3 AMM Points quando o participante acerta o placar exato,
**para que** o ranking reflita corretamente o desempenho dos palpites.

**Critérios de aceite:**
- Resultado oficial = placar ao final do tempo regulamentar + prorrogação (sem gols de pênalti).
- Se o placar do palpite for idêntico ao resultado oficial, some +3 pontos ao participante.

**Estimativa:** M

## HU-03.2 — Pontuar acerto de vencedor
**Como** sistema de pontuação,
**quero** atribuir +2 AMM Points quando o participante acerta apenas o vencedor (sem acertar o placar exato),
**para que** palpites parcialmente corretos também sejam recompensados.

**Critérios de aceite:**
- Se o vencedor indicado no palpite coincidir com o vencedor oficial (incluindo desempate por pênaltis) mas o placar exato não coincidir, some +2 pontos.
- Se o palpite errar o resultado (vencedor errado), some 0 pontos.

**Estimativa:** M

## HU-03.3 — Lançar resultado oficial de uma partida
**Como** organizador,
**quero** registrar o resultado oficial de cada jogo (placar, se houve prorrogação/pênaltis),
**para que** o motor de pontuação calcule automaticamente os pontos de todos os participantes daquele jogo.

**Critérios de aceite:**
- Ao lançar um resultado oficial, todos os palpites daquele jogo são recalculados uma única vez.
- O sistema distingue "vencedor por pênaltis" (não conta para placar exato) de "vencedor no tempo normal/prorrogação".

**Estimativa:** G
