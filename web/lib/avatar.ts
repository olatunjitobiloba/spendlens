// DiceBear avatars for synthetic sample profiles. No real people are shown.
export function avatarUrl(seed: string, style: "notionists" | "glass" = "notionists") {
  const params = new URLSearchParams({ seed, backgroundColor: "dbe7f5,e8e6df,d9e4dc" });
  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;
}
