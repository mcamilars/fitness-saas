const DIACRITICS = /\p{Mn}/gu;
const NON_ALPHANUM = /[^a-z0-9]+/g;
const TRIM_DASHES = /^-+|-+$/g;

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(NON_ALPHANUM, '-')
    .replace(TRIM_DASHES, '');
}
