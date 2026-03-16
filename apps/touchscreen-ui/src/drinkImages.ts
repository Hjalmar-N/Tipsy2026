/** Mapping from recipe name to transparent hero image filename in public/drinks/. */
export const DRINK_IMAGE_FILES: Record<string, string> = {
  "Moscow Mule": "MoscowMule.png",
  "Gin & Tonic": "GinTonic.png",
  "Whiskey & Cola": "WhiskeyCola.png",
  "Vodka Cranberry": "VodkaCranberry.png",
  "Whiskey Ginger": "WhiskeyGinger.png",
  "Tequila Tonic": "TequilaTonic.png",
  "Mexican Mule": "MexicanMule.png",
  "Cape Codder": "CapeCodder.png",
  "Gin & Juice": "GinJuice.png",
  "Dirty Whiskey": "DirtyWhiskey.png",
  "Long Beach Style": "LongBeachStyle.png",
};

export function getDrinkImageUrl(recipeName: string): string | null {
  const filename = DRINK_IMAGE_FILES[recipeName];
  if (!filename) return null;
  return `/drinks/${encodeURIComponent(filename)}`;
}
