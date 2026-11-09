/** Only ever redirect inside the module, never to another site. */
export function safeNext(value: string | null | undefined) {
  return value && value.startsWith("/insights") && !value.startsWith("//") ? value : "/insights";
}
