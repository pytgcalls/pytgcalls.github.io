export const H1 = 'H1';
export const H2 = 'H2';
export const H3 = 'H3';
export const H4 = 'H4';

export const BR = 'BR';
export const SEPARATOR = 'SEPARATOR';

export const TEXT = 'TEXT';
export const SUBTEXT = 'SUBTEXT';
export const BOLD = ['B', 'BOLD'];
export const SEMI_BOLD = 'SB';
export const CODE = 'CODE';

export const LINK = 'A';
export const STANDARD_REF = 'REF';
export const DOCS_REF = 'DOCS-REF';
export const GITHUB_REF = 'GITHUB-REF';
export const EXAMPLE_REF = 'REF-SHI';

export const ALERT = 'ALERT';

export const CATEGORY = 'CATEGORY';
export const CATEGORY_TITLE = 'CATEGORY-TITLE';

export const SYNTAX_HIGHLIGHT = 'SYNTAX-HIGHLIGHT';
export const SYNTAX_HIGHLIGHT_INLINE = 'SHI';
export const MULTI_SYNTAX = 'MULTISYNTAX';

export const LIST = 'LIST';
export const TABLE = 'TABLE';
export const TABLE_DEFINITIONS = 'DEFINITIONS';
export const TABLE_COLUMN = 'COLUMN';
export const TABLE_ITEM = 'ITEM';

export const BANNER = 'BANNER';
export const BANNER_PEER_2_PEER = 'P2P-BANNER';

export const CONFIG = 'CONFIG';
export const SEARCH_HIGHLIGHT = 'MARK';

export const AVAILABLE_ELEMENTS = [
  H1, H2, H3, H4,
  BR, SEPARATOR,
  TEXT, SUBTEXT, ...BOLD, SEMI_BOLD, CODE,
  LINK, STANDARD_REF, DOCS_REF, GITHUB_REF, EXAMPLE_REF,
  ALERT,
  CATEGORY, CATEGORY_TITLE,
  SYNTAX_HIGHLIGHT, SYNTAX_HIGHLIGHT_INLINE, MULTI_SYNTAX,
  LIST, TABLE, TABLE_DEFINITIONS, TABLE_COLUMN, TABLE_ITEM,
  BANNER, BANNER_PEER_2_PEER,
  CONFIG, SEARCH_HIGHLIGHT,
  'PG-TITLE'
];