/** Mapeia os 48 países do formato da Copa 2026 para o código ISO 3166-1 alpha-2. */
const ISO_BY_COUNTRY: Record<string, string> = {
  Algeria: "DZ",
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  "Bosnia & Herzegovina": "BA",
  Brazil: "BR",
  Canada: "CA",
  "Cape Verde": "CV",
  Colombia: "CO",
  Croatia: "HR",
  Curaçao: "CW",
  "Czech Republic": "CZ",
  "DR Congo": "CD",
  Ecuador: "EC",
  Egypt: "EG",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Haiti: "HT",
  Iran: "IR",
  Iraq: "IQ",
  "Ivory Coast": "CI",
  Japan: "JP",
  Jordan: "JO",
  Mexico: "MX",
  Morocco: "MA",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Norway: "NO",
  Panama: "PA",
  Paraguay: "PY",
  Portugal: "PT",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  Senegal: "SN",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Tunisia: "TN",
  Turkey: "TR",
  USA: "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
};

// Bandeiras de subdivisão (Inglaterra/Escócia) não são pares de indicadores
// regionais simples — usa-se a bandeira preta genérica como fallback visual.
const SPECIAL_FLAGS: Record<string, string> = {
  England: "🏴",
  Scotland: "🏴",
};

function isoToFlagEmoji(iso2: string): string {
  const codePoints = [...iso2.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function flagFor(countryName: string): string {
  if (SPECIAL_FLAGS[countryName]) return SPECIAL_FLAGS[countryName];
  const iso = ISO_BY_COUNTRY[countryName];
  return iso ? isoToFlagEmoji(iso) : "🏳️";
}
