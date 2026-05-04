import { TransformFnParams } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

// sanitize HTML
export const sanitizeToText = ({ value }: TransformFnParams): string => {
  if (typeof value !== 'string') return value;

  const clean = sanitizeHtml(value, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'pre',
      'blockquote',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });

  return clean.trim();
};

// remove duplicate UUIDs
export const removeDuplicates = ({ value }: TransformFnParams) => {
  if (!Array.isArray(value)) return value;

  return [...new Set(value)];
};
