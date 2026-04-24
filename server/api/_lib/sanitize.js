import sanitizeHtml from 'sanitize-html';

const COMMON_ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'strong', 'b', 'em', 'i',
  'blockquote', 'a', 'code', 'pre', 'hr',
];

const COMMON_ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'target', 'rel'],
};

const allowedSchemes = ['http', 'https', 'mailto', 'tel'];

export function stripHtml(value, maxLength = 1000) {
  const clean = sanitizeHtml(String(value || ''), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
  return maxLength ? clean.slice(0, maxLength) : clean;
}

export function sanitizeBlogHtml(value) {
  return sanitizeHtml(String(value || ''), {
    allowedTags: [...COMMON_ALLOWED_TAGS, 'img'],
    allowedAttributes: {
      ...COMMON_ALLOWED_ATTRIBUTES,
      img: ['src', 'alt', 'title', 'loading'],
    },
    allowedSchemes,
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
}

export function sanitizeNewsletterHtml(value) {
  return sanitizeHtml(String(value || ''), {
    allowedTags: [
      ...COMMON_ALLOWED_TAGS,
      'div', 'span', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'img', 'section', 'article',
    ],
    allowedAttributes: {
      ...COMMON_ALLOWED_ATTRIBUTES,
      '*': ['style', 'align'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      table: ['width', 'cellpadding', 'cellspacing', 'border'],
      td: ['width', 'colspan', 'rowspan'],
      th: ['width', 'colspan', 'rowspan'],
    },
    allowedStyles: {
      '*': {
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^rgba\(/i, /^[a-z]+$/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^rgba\(/i, /^[a-z]+$/i],
        background: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^rgba\(/i, /^[a-z]+$/i],
        'font-size': [/^\d+(\.\d+)?(px|em|rem|%)$/i],
        'font-family': [/^[a-z0-9\s"',.-]+$/i],
        'font-weight': [/^\d{3}$/, /^(normal|bold|bolder|lighter)$/i],
        'text-align': [/^(left|right|center|justify)$/i],
        'line-height': [/^\d+(\.\d+)?(px|em|rem|%)?$/i],
        margin: [/^[\d\s.%-]+(px|em|rem|%)?$/i],
        padding: [/^[\d\s.%-]+(px|em|rem|%)?$/i],
        border: [/^[#\w\s().,%-]+$/i],
        'border-radius': [/^\d+(\.\d+)?(px|em|rem|%)$/i],
        display: [/^(block|inline|inline-block|table|table-row|table-cell)$/i],
        width: [/^\d+(\.\d+)?(px|em|rem|%)$/i],
        'max-width': [/^\d+(\.\d+)?(px|em|rem|%)$/i],
      },
    },
    allowedSchemes,
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
}

