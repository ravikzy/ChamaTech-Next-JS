export const REVIEW_TAGS = ["pontual", "educado", "resolveu", "bom_preco"];

export const REVIEW_TAG_LABELS = {
  pontual: "Pontual",
  educado: "Educado",
  resolveu: "Resolveu o problema",
  bom_preco: "Bom preço",
};

export function rotulosDasTags(tags = []) {
  return tags.map((tag) => REVIEW_TAG_LABELS[tag] ?? tag);
}
