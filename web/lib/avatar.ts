// DiceBear avatars for synthetic sample profiles. No real people are shown.
export function avatarUrl(seed: string) {
  const params = new URLSearchParams({ seed });
  return `https://api.dicebear.com/10.x/adventurer/svg?${params.toString()}`;
}
