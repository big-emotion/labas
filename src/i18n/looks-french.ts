/**
 * Test helper: whether an English text still carries French words. Matches common French
 * function words rather than accents, since English keeps some (Côte d'Ivoire, cafés).
 */
const FRENCH_WORDS =
  /(?<![\p{L}'’])(vous|votre|vos|les|des|une|du|au|aux|et|est|pour|avec|dans|sur|je|ne|pas|qui|que|ville|villes|selon|sans|très|où|à)(?!\p{L})|(?<![\p{L}])(?:[lj]|qu)['’](?=\p{L})/iu;

export function looksFrench(text: string): boolean {
  return FRENCH_WORDS.test(text);
}
