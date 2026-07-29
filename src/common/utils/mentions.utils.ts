export function extractMentions(content: string): string[] {
  if (!content) {
    return [];
  }
  const MENTION_PATTERN = /(?:^|(?<=\s))@([a-zA-Z0-9_]+)/g;

  const usernames = new Set<string>();
  for (const match of content.matchAll(MENTION_PATTERN)) {
    const username = match[1];
    if (username) {
      usernames.add(username.toLowerCase());
    }
  }

  return [...usernames];
}
