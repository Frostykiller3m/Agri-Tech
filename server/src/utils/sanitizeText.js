// Forum content is plain text, never HTML. Remove tag-shaped input and angle brackets
// before storage; React then renders the resulting strings as inert text nodes.
export function sanitizePlainText(value) {
  return value
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}
