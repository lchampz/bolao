const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const HEADER_WORDS = new Set(["email", "e-mail", "emails", "e-mails", "endereco", "endereço"]);

/**
 * Extrai e-mails de um CSV simples (uma coluna, ou várias — pega o primeiro
 * token que parece e-mail em cada linha). Tolerante a cabeçalho, aspas,
 * separador vírgula/ponto-e-vírgula/tab, e linhas vazias. Não precisa de uma
 * lib de CSV: o caso de uso é só "lista de e-mails".
 */
export function parseEmailsFromCsv(text: string): string[] {
  const emails = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (HEADER_WORDS.has(line.toLowerCase().replace(/["']/g, ""))) continue;

    for (const cell of line.split(/[,;\t]/)) {
      const candidate = cell.trim().replace(/^["']|["']$/g, "");
      const match = candidate.match(EMAIL_RE);
      if (match) emails.add(match[0].toLowerCase());
    }
  }

  return [...emails];
}
