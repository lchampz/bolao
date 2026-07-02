# Épico 4 — Bônus por Fase e Bônus de Engajamento

## HU-04.1 — Bônus proporcional por classificado (mata-mata)
**Como** participante,
**quero** ganhar pontos extras por cada time que eu acertar como classificado em uma fase,
**para que** meu conhecimento sobre o torneio como um todo (não só jogo a jogo) seja recompensado.

**Critérios de aceite:**
- Oitavas de final: +1 ponto por classificado correto, **até um teto de 3 pontos** na fase.
- Quartas de final: +1 ponto por classificado correto, **até um teto de 4 pontos** na fase.
- Semifinal: +1 ponto por classificado correto, **até um teto de 5 pontos** na fase.
- Fórmula: `pontos_fase = min(classificados_corretos, teto_da_fase)`.

**Decisão de refinamento:** o exemplo do documento original ("acertar 6 classificados das oitavas → +3 pontos") bateu certo com essa leitura de teto — `min(6, 3) = 3` — então não há mais ambiguidade real aqui; a leitura "+1 por acerto, com teto" é a regra oficial e é isso que a implementação usa.

**Estimativa:** G

## HU-04.2 — Bônus de acerto do campeão
**Como** participante,
**quero** ganhar +6 AMM Points se eu acertar o campeão da Copa,
**para que** a fase final tenha um peso especial na pontuação total.

**Critérios de aceite:**
- O bônus de campeão só é aplicado após a final ser disputada e o resultado oficial lançado.
- É somado uma única vez por participante.

**Estimativa:** P

## HU-04.3 — Bônus por envio antecipado
**Como** participante,
**quero** ganhar +1 ponto quando envio meu palpite com boa antecedência do prazo,
**para que** eu seja incentivado a não deixar para a última hora.

**Critérios de aceite:**
- Janela de antecedência **configurável pelo organizador** (não fixa no código), com padrão de 2 horas antes do início do jogo.
- Se `enviado_em <= inicio_do_jogo - janela_configurada`, soma +1 ponto para aquele palpite.
- O bônus é calculado por jogo, não por rodada.

**Decisão de refinamento:** em vez de travar um número arbitrário no código (o documento original não define o valor), a janela vira um parâmetro de configuração do bolão (`configuracoes.antecedenciaMinutos`), ajustável pelo organizador sem precisar de deploy.

**Estimativa:** M

## HU-04.4 — Bônus de maior pontuação da rodada
**Como** participante,
**quero** ganhar +2 pontos se eu tiver a maior pontuação entre todos os participantes numa rodada,
**para que** boas rodadas isoladas também sejam destacadas e recompensadas.

**Critérios de aceite:**
- Calculado ao final de cada rodada, após todos os resultados oficiais da rodada serem lançados.
- Em caso de empate na maior pontuação da rodada, todos os empatados recebem o bônus.

**Estimativa:** M

## HU-04.5 — Bônus de sequência de acertos
**Como** participante,
**quero** ganhar +2 pontos ao acertar 3 palpites consecutivos,
**para que** sequências de bons palpites sejam reconhecidas.

**Critérios de aceite:**
- "Acerto" = qualquer palpite que pontuou (placar exato **ou** vencedor correto) — o documento já trata os dois como "✅ acerto" na seção de pontuação por jogo, então ambos contam igualmente para a sequência.
- A sequência é contada em ordem cronológica de jogos (não por rodada isolada) e quebra no primeiro erro (❌).
- O bônus é concedido a cada múltiplo de 3 na sequência (3º, 6º, 9º acerto consecutivo, ...) — uma sequência de 6 acertos gera o bônus 2 vezes.

**Decisão de refinamento:** "a cada múltiplo de 3" foi escolhido por ser a leitura mais literal de "sequência de 3 acertos consecutivos" e por recompensar sequências longas de forma proporcional, sem precisar de um teto arbitrário.

**Estimativa:** G
