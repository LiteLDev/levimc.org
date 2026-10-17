import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import { HotbarTabs, PixelIcon } from '../../kit/components';
import { SHIKI_PALETTES } from '../../kit/docs/node/markdown/shiki-themes.ts';

// Token colours come from the kit's Shiki palettes (the same ones the docs use), so the snippet matches
// the code blocks on docs.levimc.org in both themes.
type Role = 'comment' | 'keyword' | 'type' | 'func' | 'string' | 'param' | 'punct';
const PALETTE_KEY: Record<Role, keyof typeof SHIKI_PALETTES.light> = {
  comment: 'comment',
  keyword: 'keyword',
  type: 'type',
  func: 'func',
  string: 'string',
  param: 'number',
  punct: 'punct',
};

function tok(role: Role, text: string): ReactNode {
  const k = PALETTE_KEY[role];
  const style = { '--shiki-light': SHIKI_PALETTES.light[k], '--shiki-dark': SHIKI_PALETTES.dark[k] } as CSSProperties;
  return (
    <span style={style} className={role === 'comment' ? 'lm-tok-comment' : undefined}>
      {text}
    </span>
  );
}
const c = (text: string) => tok('comment', text);
const kw = (text: string) => tok('keyword', text);
const ty = (text: string) => tok('type', text);
const fn = (text: string) => tok('func', text);
const str = (text: string) => tok('string', text);
const pa = (text: string) => tok('param', text);
const p = (text: string) => tok('punct', text);

type Line = ReactNode[];

const EXAMPLES: { id: 'cpp' | 'js' | 'lua'; name: string; lines: Line[] }[] = [
  {
    id: 'cpp',
    name: 'main.cpp',
    lines: [
      [c('// Listen to player join events')],
      [kw('using'), ' ', kw('namespace'), ' ', ty('ll'), p('::'), ty('event'), p(';')],
      [kw('auto'), p('&'), ' eventBus ', p('='), ' ', ty('EventBus'), p('::'), fn('getInstance'), p('();')],
      [],
      ['eventBus', p('.'), fn('emplaceListener'), p('<'), ty('PlayerJoinEvent'), p('>(')],
      ['    ', p('[]('), ty('PlayerJoinEvent'), p('&'), ' ', pa('ev'), p(') {')],
      ['        ', kw('auto'), p('&'), ' player ', p('='), ' ', pa('ev'), p('.'), fn('self'), p('();')],
      ['        ', 'player', p('.'), fn('sendMessage'), p('('), str('"Welcome!"'), p(');')],
      ['    ', p('}')],
      [p(');')],
    ],
  },
  {
    id: 'js',
    name: 'main.js',
    lines: [
      [c('// LegacyScriptEngine - JavaScript')],
      [ty('mc'), p('.'), fn('listen'), p('('), str('"onJoin"'), p(', ('), pa('player'), p(') => {')],
      ['    ', pa('player'), p('.'), fn('tell'), p('('), str('"Welcome to the server!"'), p(');')],
      ['    ', fn('log'), p('('), str('`${player.name} joined`'), p(');')],
      [p('});')],
    ],
  },
  {
    id: 'lua',
    name: 'main.lua',
    lines: [
      [c('-- LegacyScriptEngine - Lua')],
      [ty('mc'), p('.'), fn('listen'), p('('), str('"onJoin"'), p(',')],
      ['    ', kw('function'), p('('), pa('player'), p(')')],
      ['        ', pa('player'), p(':'), fn('tell'), p('('), str('"Welcome!"'), p(')')],
      ['        ', fn('log'), p('('), pa('player'), '.name ', p('..'), ' ', str('" joined"'), p(')')],
      ['    ', kw('end')],
      [p(')')],
    ],
  },
];

/** Tabbed code sample (hotbar tabs + kit code block) with a Minecraft item tooltip beside it. */
export default function CodeCard({ label }: { label: string }) {
  const [active, setActive] = useState<(typeof EXAMPLES)[number]['id']>('cpp');
  const example = EXAMPLES.find((e) => e.id === active)!;

  return (
    <div className="lm-code">
      <div className="px-card lm-code-window">
        <HotbarTabs tabs={EXAMPLES.map((e) => ({ id: e.id, label: e.name }))} value={active} onChange={(id) => setActive(id as typeof active)} label={label}>
          <div className="kit-code lm-code-block" data-lang={example.id} data-linenos="">
            <pre className="shiki kit-shiki">
              <code>
                {example.lines.map((line, i) => (
                  <Fragment key={`${example.id}-${i}`}>
                    <span className="line">
                      {line.map((part, j) => (
                        <Fragment key={j}>{part}</Fragment>
                      ))}
                    </span>
                    {i < example.lines.length - 1 ? '\n' : null}
                  </Fragment>
                ))}
              </code>
            </pre>
          </div>
        </HotbarTabs>
      </div>

      <div className="lm-code-item">
        <span className="kit-slot lm-code-item-slot" aria-hidden="true">
          <PixelIcon name="grass" size={32} />
        </span>
        <span className="mc-tooltip lm-code-item-tip">
          <span className="mc-tooltip-title">Multi-Language</span>{' '}
          <span className="mc-tooltip-lore">C++, JS, Lua, Python</span>
        </span>
      </div>
    </div>
  );
}
