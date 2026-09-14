export function build(strict, moderation) {
  const level = strict ? moderation : "off";
  return { moderation: level };
}
