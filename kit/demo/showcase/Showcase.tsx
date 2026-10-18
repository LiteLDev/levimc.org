// Demo-only custom layout (config.layouts.showcase): a gallery of every levimc-kit component.
import './showcase.css';
import { useRef, useState, type ReactNode } from 'react';
import type { CustomLayoutProps } from '../kit/docs/app/layout-api';
import { KitLink, useContentEnhancements, href } from '../kit/docs/app/layout-api';
import { PaintedHero } from '../kit/components/PaintedHero';
import { PixelButton } from '../kit/components/PixelButton';
import { Badge } from '../kit/components/Badge';
import { Tooltip } from '../kit/components/Tooltip';
import { Card } from '../kit/components/Card';
import { HotbarTabs, Pagination } from '../kit/components/Hotbar';
import { PixelIcon, BrandIcon } from '../kit/components/PixelIcon';
import { PIXEL_ICONS, type PixelIconName } from '../kit/components/pixel-icons';

const SWATCHES: [string, string][] = [
  ['canvas', '--color-canvas'],
  ['surface', '--color-surface'],
  ['ink', '--color-ink'],
  ['muted', '--color-muted'],
  ['line', '--color-line-strong'],
  ['primary', '--color-primary'],
  ['accent-1', '--color-accent-1'],
  ['accent-2', '--color-accent-2'],
  ['accent-3', '--color-accent-3'],
  ['accent-4', '--color-accent-4'],
];
const MC: [string, string][] = [
  ['grass', '--color-mc-grass'],
  ['dirt', '--color-mc-dirt'],
  ['stone', '--color-mc-stone'],
  ['diamond', '--color-mc-diamond'],
  ['gold', '--color-mc-gold'],
  ['redstone', '--color-mc-redstone'],
  ['enchant', '--color-mc-enchant'],
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="sc-section" aria-labelledby={id}>
      <h2 id={id} className="sc-h2">
        <span className="px-dot" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Showcase({ route, page, site }: CustomLayoutProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  useContentEnhancements(contentRef, route.page);
  const [tab, setTab] = useState('overview');
  const [pageNo, setPageNo] = useState(3);
  const zh = route.locale !== 'en';
  const prefix = site.locales.find((l) => l.code === route.locale)?.prefix ?? '';
  return (
    <main id="kit-main" className="sc-main" tabIndex={-1}>
      <PaintedHero
        eyebrow="Impression, Craft"
        name={zh ? '组件展示' : 'Showcase'}
        text={zh ? 'levimc-kit 设计系统' : 'The levimc-kit design system'}
        tagline={
          zh
            ? '莫奈的色彩作为氛围，像素的几何作为结构。下面是每一个组件。'
            : "Monet's colour fields for atmosphere, crisp pixel geometry for structure. Every component, on one page."
        }
        actions={[
          { theme: 'brand', text: zh ? '阅读文档' : 'Read the docs', link: href(`${prefix}user_guides/install/`) },
          { theme: 'alt', text: 'GitHub', link: 'https://github.com/LiteLDev' },
        ]}
        linkComponent={KitLink}
      />
      <div className="sc-wrap">
        <Section id="sc-palette" title={zh ? '色彩' : 'Palette'}>
          <div className="sc-swatches">
            {SWATCHES.map(([n, v]) => (
              <div key={n} className="sc-swatch">
                <span className="sc-chip" style={{ background: `var(${v})` }} />
                <span className="sc-swatch-name">{n}</span>
                <code className="sc-swatch-var">{v}</code>
              </div>
            ))}
          </div>
          <div className="sc-swatches sc-swatches-mc">
            {MC.map(([n, v]) => (
              <div key={n} className="sc-swatch">
                <span className="sc-chip sc-chip-pixel" style={{ background: `var(${v})` }} />
                <span className="sc-swatch-name kit-pixel-label">{n}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="sc-type" title={zh ? '字体' : 'Typography'}>
          <div className="sc-type">
            <p className="sc-type-display kit-display">Water lilies, built block by block.</p>
            <p className="sc-type-body">
              Inter carries the interface and body copy at a calm 76-character measure. 中文正文使用系统字体栈（PingFang SC、Microsoft YaHei、Noto Sans
              SC），不加载 CJK 网络字体。
            </p>
            <p className="sc-type-row">
              <span className="kit-pixel-label">Silkscreen · v1.0.0 · NEW</span>
              <code className="sc-type-mono">JetBrains Mono → ll::mod::NativeMod</code>
            </p>
          </div>
        </Section>

        <Section id="sc-buttons" title={zh ? '按钮' : 'Buttons'}>
          <div className="sc-row">
            <PixelButton variant="primary" icon="emerald">
              {zh ? '主要操作' : 'Primary'}
            </PixelButton>
            <PixelButton icon="chest">{zh ? '默认' : 'Default'}</PixelButton>
            <PixelButton variant="ghost" iconRight="arrowRight">
              {zh ? '幽灵按钮' : 'Ghost'}
            </PixelButton>
            <PixelButton size="sm">Small</PixelButton>
            <PixelButton size="lg" variant="primary">
              Large
            </PixelButton>
            <PixelButton disabled>{zh ? '禁用' : 'Disabled'}</PixelButton>
            <PixelButton href="https://github.com/LiteLDev" iconRight="external">
              Link
            </PixelButton>
          </div>
          <div className="sc-row">
            <button type="button" className="mc-icon-btn" aria-label="Search">
              <PixelIcon name="search" />
            </button>
            <button type="button" className="mc-icon-btn" aria-label="GitHub">
              <BrandIcon name="github" size={18} />
            </button>
            <span className="kit-slot">
              <PixelIcon name="diamond" size={32} />
            </span>
            <span className="kit-slot">
              <PixelIcon name="torch" size={32} />
            </span>
            <span className="kit-slot">
              <PixelIcon name="tnt" size={32} />
            </span>
          </div>
        </Section>

        <Section id="sc-badges" title={zh ? '徽章、按键与提示' : 'Badges, keys & tooltips'}>
          <div className="sc-row">
            <Badge tone="grass">Stable</Badge>
            <Badge tone="diamond">Client</Badge>
            <Badge tone="gold">Server</Badge>
            <Badge tone="redstone">Deprecated</Badge>
            <Badge tone="enchant">Experimental</Badge>
            <Badge tone="pond">Docs</Badge>
            <Badge tone="stone">Archived</Badge>
            <Badge tone="grass" pixel>
              v1.0.0
            </Badge>
            <Badge tone="enchant" pixel>
              New
            </Badge>
          </div>
          <div className="sc-row">
            <span>
              <kbd className="mc-kbd">Ctrl</kbd>
              <kbd className="mc-kbd">K</kbd> {zh ? '打开搜索' : 'opens search'}
            </span>
            <Tooltip title="Diamond Pickaxe" content={zh ? '效率 V · 耐久 III' : 'Efficiency V · Unbreaking III'}>
              <button type="button" className="mc-btn">
                <PixelIcon name="pickaxe" />
                {zh ? '悬停查看提示' : 'Hover for tooltip'}
              </button>
            </Tooltip>
            <span className="mc-tooltip">
              <span className="mc-tooltip-title">Book and Quill</span>
              <span className="mc-tooltip-lore">{zh ? '静态的物品提示框' : 'A static item tooltip'}</span>
              <span className="mc-tooltip-enchant">Unbreaking III</span>
            </span>
          </div>
        </Section>

        <Section id="sc-hotbar" title={zh ? '快捷栏：标签页与分页' : 'Hotbar: tabs & pagination'}>
          <HotbarTabs
            label="Showcase tabs"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'overview', label: zh ? '概览' : 'Overview' },
              { id: 'install', label: zh ? '安装' : 'Install' },
              { id: 'api', label: 'API' },
              { id: 'faq', label: 'FAQ' },
            ]}
          >
            <p className="sc-tab-copy">
              {tab === 'overview' && (zh ? '选中的槽位带有明亮的快捷栏边框。' : 'The selected slot gets the bright hotbar frame.')}
              {tab === 'install' && (zh ? '方向键可在标签之间移动。' : 'Arrow keys move between tabs (WAI-ARIA tabs pattern).')}
              {tab === 'api' && 'll::mod · ll::event · ll::command'}
              {tab === 'faq' && (zh ? '每个面板都通过 aria-controls 关联。' : 'Each panel is linked with aria-controls / aria-labelledby.')}
            </p>
          </HotbarTabs>
          <Pagination
            page={pageNo}
            pageCount={12}
            hrefFor={(p) => `?page=${p}`}
            onNavigate={(p, e) => {
              e.preventDefault();
              setPageNo(p);
            }}
          />
        </Section>

        <Section id="sc-cards" title={zh ? '卡片' : 'Cards'}>
          <div className="sc-cards">
            <Card icon="grass" eyebrow="LeviLamina" title={zh ? '模组加载器' : 'Mod loader'} description={zh ? '为基岩版专用服务器提供 API。' : 'Essential APIs for Bedrock Dedicated Server.'} href="https://docs.levimc.org/LeviLamina/" />
            <Card icon="bookQuill" eyebrow="LegacyScriptEngine" title={zh ? '脚本引擎' : 'Script engine'} description={zh ? '运行 JavaScript、Lua、Python 插件。' : 'Run JavaScript, Lua and Python plugins.'} href="https://docs.levimc.org/LegacyScriptEngine/" />
            <Card icon="chest" eyebrow="lip" title={zh ? '包管理器' : 'Package manager'} description={zh ? '安装、更新和管理依赖。' : 'Install, update and manage dependencies.'} href="https://docs.levimc.org/lip/" />
            <Card icon="map" title="Long text" description="https://github.com/LiteLDev/LeviLamina/blob/develop/src/mc/network/ServerNetworkHandler.h" />
          </div>
        </Section>

        <Section id="sc-sprites" title={zh ? '像素图标' : 'Pixel sprites'}>
          <ul className="sc-sprites">
            {(Object.keys(PIXEL_ICONS) as PixelIconName[]).map((n) => (
              <li key={n}>
                <span className="kit-slot">
                  <PixelIcon name={n} size={32} />
                </span>
                <code>{n}</code>
              </li>
            ))}
          </ul>
          <div className="grass-divider sc-grass" aria-hidden="true" />
        </Section>

        <div className="sc-markdown">
          <div ref={contentRef} className="kit-prose" data-doc-content="" dangerouslySetInnerHTML={{ __html: page.html }} />
        </div>
      </div>
    </main>
  );
}
