# Épico 5 — Ranking e Critérios de Desempate

## HU-05.1 — Visualizar ranking geral atualizado
**Como** participante,
**quero** ver o ranking geral atualizado ao final de cada rodada,
**para que** eu acompanhe minha posição e a dos outros participantes.

**Critérios de aceite:**
- O ranking soma todos os pontos (placar exato, vencedor, bônus por fase, bônus de engajamento).
- O ranking é recalculado e publicado ao final de cada rodada (não em tempo real durante os jogos, salvo decisão contrária do organizador).

**Estimativa:** M

## HU-05.2 — Aplicar critérios de desempate em cascata
**Como** sistema de ranking,
**quero** aplicar os critérios de desempate em ordem quando dois ou mais participantes têm a mesma pontuação total,
**para que** o ranking final seja justo e siga a ordem definida no regulamento.

**Critérios de aceite (ordem oficial):**
1. Maior número de placares exatos.
2. Maior número de acertos de vencedor.
3. Acerto do campeão.
4. Maior total de bônus por fase.
5. Quem enviou os palpites primeiro.
6. Persistindo o empate: sorteio ou divisão do prêmio.
- Cada critério só é avaliado se o(s) anterior(es) resultarem em empate.

**Estimativa:** G

## HU-05.3 — Destacar Top 3 e "quem mais subiu"
**Como** organizador,
**quero** que a comunicação de cada rodada destaque o Top 3 do ranking e quem mais subiu de posição,
**para que** o engajamento seja reforçado durante o bolão (não só no final).

**Critérios de aceite:**
- O sistema calcula a variação de posição de cada participante entre a rodada anterior e a atual.
- É possível gerar um resumo pronto para postar no grupo oficial (Top 3 + maior alta).

**Estimativa:** M
