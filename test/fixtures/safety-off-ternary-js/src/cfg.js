export function build(strict) {
  return strict ? { moderation: "on" } : { moderation: "off" };
}
