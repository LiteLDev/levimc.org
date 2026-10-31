// The story: "The Page Apart". Clicking her peeking head took the page apart, and while it stays apart she can walk
// about in it. Eight keystones hold the page together; waking them brings back her memories of it, and in the end
// someone has to decide whether the page goes back together. Each node is a few lines (she acts them out), maybe a
// choice, maybe things to do in the world (tasks), maybe a real-time wait; then the next node.
import type { Dim, Effects, Saved, StoryEvent } from './state';

export interface Text {
  zh: string;
  en: string;
}
/** What a line or a node does to the world. */
export type Action =
  | { do: 'night'; k: number }
  | { do: 'corrupt' }
  | { do: 'lostCube' }
  | { do: 'awaken'; kind: string }
  | { do: 'focus' }
  | { do: 'ending'; id: string };
export interface Line extends Text {
  /** her clip as she says it, and her face */
  act?: string;
  mood?: Record<string, number>;
  /** said only if this holds */
  if?: (d: Record<Dim, number>, s: Saved) => boolean;
  then?: Action;
  /** a narration line (not hers) */
  sys?: boolean;
}
export interface Choice extends Text {
  fx: Effects;
  flag?: [string, string | number | boolean];
  reply: Line[];
}
export interface Task extends Text {
  id: string;
  need: number;
  ev: StoryEvent[];
  /** only on this kind of block (the event's kind) */
  kind?: string;
  /** only on the keystone of this kind (the marked block) */
  keystone?: string;
}
export interface Node {
  id: string;
  chapter?: Text;
  lines: Line[];
  choices?: Choice[];
  tasks?: Task[];
  /** a real-time wait (minutes) after the tasks, with what the visitor is told */
  wait?: { min: number } & Text;
  enter?: Action[];
  next: string | ((d: Record<Dim, number>, s: Saved) => string);
}

const L = (zh: string, en: string, more: Partial<Line> = {}): Line => ({ zh, en, ...more });
const N = (zh: string, en: string, more: Partial<Line> = {}): Line => ({ zh, en, sys: true, ...more });
const T = (id: string, need: number, ev: StoryEvent[], zh: string, en: string, more: Partial<Task> = {}): Task => ({ id, need, ev, zh, en, ...more });

/** The keystones, in the order she wakes them. */
export const KEYSTONES = ['title', 'bar', 'button', 'media', 'card', 'heading', 'text'] as const;

export const UI = {
  next: { zh: '继续', en: 'Next' },
  tasks: { zh: '要做的事', en: 'To do' },
  waiting: { zh: '等待中', en: 'Waiting' },
  waitHint: { zh: '可以关掉页面，时间照样走。', en: 'You can close the page; the clock keeps running.' },
  ending: { zh: '结局', en: 'Ending' },
  endings: { zh: '已见结局', en: 'Endings seen' },
  again: { zh: '重新开始故事', en: 'Start the story over' },
  freeplay: { zh: '继续陪她玩', en: 'Keep playing with her' },
  story: { zh: '故事', en: 'Story' },
  skipHint: { zh: '点击或按 Enter 继续', en: 'Click or press Enter' },
  resume: { zh: '欢迎回来。故事从上次停下的地方继续。', en: 'Welcome back. The story picks up where it stopped.' },
  confirmReset: { zh: '确定要从头开始吗？她会忘记这一切。', en: 'Start over? She will forget all of this.' },
} satisfies Record<string, Text>;

export const ENDINGS: Record<string, Text & { kind: 'HE' | 'NE' | 'BE' | 'SE'; desc: Text }> = {
  true: { kind: 'HE', zh: '再一次，从头像开始', en: 'Once More, From the Avatar', desc: { zh: '页面拼回去了。她回到卡片后面偷看——但这一次，她记得你。', en: 'The page is whole again. She is back to peeking from behind the card — but this time she remembers you.' } },
  stay: { kind: 'HE', zh: '留在拆开的页面里', en: 'Staying in the Page Apart', desc: { zh: '你们决定让页面继续散着。只属于你们俩的小世界。', en: 'You let the page stay apart: a small world for the two of you.' } },
  normal: { kind: 'NE', zh: '普通的一天', en: 'An Ordinary Day', desc: { zh: '页面恢复了原样。她向你挥挥手，像对任何一位访客那样。', en: 'The page is back as it was. She waves at you, as she would at any visitor.' } },
  forgotten: { kind: 'BE', zh: '被遗忘的头像', en: 'The Forgotten Avatar', desc: { zh: '你来得太少了。她等着等着，就忘了自己在等谁。', en: 'You came too rarely. She waited and waited, until she forgot who she was waiting for.' } },
  broken: { kind: 'BE', zh: '碎掉的页面', en: 'The Shattered Page', desc: { zh: '摔了太多次、被砸了太多下。页面碎成了再也拼不回去的样子，她也不见了。', en: 'Too many falls, too many cubes. The page broke past mending, and she is gone.' } },
  miner: { kind: 'SE', zh: '方块之家', en: 'A House of Blocks', desc: { zh: '她挖呀挖，用网页的碎片盖了一座小房子，住了进去。', en: 'She dug and dug, built a little house out of the page’s pieces, and moved in.' } },
  tidy: { kind: 'SE', zh: '重新排版', en: 'A New Layout', desc: { zh: '搬来搬去之后，她把整个网站按自己的喜好重新排了一遍。', en: 'After all that carrying, she laid the whole site out again her own way.' } },
  idol: { kind: 'SE', zh: '标题上的偶像', en: 'The Idol on the Title', desc: { zh: '标题方块成了她的舞台。每位访客都会先看到她的演出。', en: 'The title block became her stage. Every visitor now sees her show first.' } },
  explorer: { kind: 'SE', zh: '去更远的地方', en: 'Further Out', desc: { zh: '你带她看过了世界的边缘。她决定自己去看看网页以外的地方。', en: 'You showed her the edge of the world. She set off to see what lies beyond the page.' } },
  loop: { kind: 'SE', zh: '重新加载', en: 'Reload', desc: { zh: '你一次次想离开。页面重新加载，一切又从她探出头的那一刻开始。', en: 'You kept trying to leave. The page reloaded, and it all began again from the moment she peeked out.' } },
};

/** The ending, from the last choice and everything before it. */
export function pickEnding(d: Record<Dim, number>, s: Saved): string {
  const choice = s.flags.final as string | undefined;
  if (d.harshness > 0.55 || d.drops_hard + d.cube_hits_her > 1.1) return 'broken';
  if (d.loneliness > 0.65 && d.attention < 0.35) return 'forgotten';
  if (choice === 'leave') return d.exit_attempts > 0.5 ? 'loop' : 'forgotten';
  if (choice === 'her') {
    const ways: [string, number][] = [
      ['miner', d.miner + d.mines * 0.5],
      ['tidy', d.tidy + d.carries * 0.5],
      ['idol', d.idol + d.konami * 0.5],
      ['explorer', d.explorer + d.camera_far * 0.5],
    ];
    ways.sort((a, b) => b[1] - a[1]);
    if (ways[0]![1] > 0.35) return ways[0]![0];
    return d.affection > 0.6 ? 'stay' : 'normal';
  }
  if (choice === 'stay') return d.affection > 0.55 && d.trust > 0.45 ? 'stay' : 'normal';
  // put the page back together
  const close = d.affection * 0.4 + d.trust * 0.3 + d.gentleness * 0.2 + d.attention * 0.1 + (s.flags.promise ? 0.1 : 0);
  return close > 0.55 ? 'true' : 'normal';
}

const warm = (d: Record<Dim, number>) => d.affection > 0.5;
const hurt = (d: Record<Dim, number>) => d.harshness > 0.3;

export const SCRIPT: Node[] = [
  // ---------------------------------------------------------------- prologue
  {
    id: 'p0',
    chapter: { zh: '序章 · 拆开的网页', en: 'Prologue · The Page Apart' },
    lines: [
      L('啊……你、你把页面拆开了？', 'Ah… y-you took the page apart?', { act: 'poke_startle', mood: { びっくり: 1 } }),
      L('我是 LeviChan。平时就躲在首页那张卡片后面，只露出一个头顶偷看。', 'I’m LeviChan. I usually hide behind the card on the home page, just the top of my head peeking out.', { act: 'curtsy', mood: { にこり: 0.8 } }),
      L('只要页面还散着，我就能在这里走来走去……', 'As long as the page stays apart, I can walk around in here…', { act: 'look_around' }),
      L('可是这样，其他访客就看不到网站了。', 'But then nobody else can see the website.', { mood: { 困る: 0.6 } }),
      L('页面里藏着几块「基石」。把它们都唤醒，页面才能好好地拼回去。', 'There are «keystones» hidden in the page. Wake them all and it can go back together properly.', { act: 'point_left' }),
      L('你……愿意陪我一起找吗？', 'Would you… look for them with me?', { act: 'finger_twiddle', mood: { 照れ: 0.7 } }),
    ],
    choices: [
      { zh: '当然，一起找吧！', en: 'Of course, let’s go!', fx: { affection: 0.08, trust: 0.08, joy: 0.1 }, reply: [L('真的？太好了！', 'Really? Yay!', { act: 'jump_happy', mood: { 笑い: 1 } })] },
      { zh: '先四处玩玩再说。', en: 'Let me look around first.', fx: { playful: 0.08, curiosity: 0.08 }, reply: [L('嘿嘿，也对，这里很好玩的！', 'Hehe, fair enough, it’s fun in here!', { act: 'ehehe' })] },
      { zh: '……你是谁来着？', en: '…Who are you again?', fx: { sadness: 0.05, honesty: 0.05, shyness: 0.05 }, reply: [L('我刚刚才说过的！', 'I just told you!', { act: 'annoyed_stomp', mood: { 怒り: 0.6 } }), L('……LeviChan。记住了哦。', '…LeviChan. Remember it this time.', { mood: { じと目: 0.6 } })] },
    ],
    next: 'c1',
  },
  // ---------------------------------------------------------------- 1: learning to move
  {
    id: 'c1',
    chapter: { zh: '第一章 · 学会飞', en: 'Chapter 1 · Learning to Fly' },
    lines: [
      L('先教你怎么在这里移动吧。', 'First, let me show you how to get around in here.', { act: 'thumbs_up' }),
      N('WASD 移动，空格上升，Shift 下降，滚轮前后，按住拖动转视角，F 飞到她身边。', 'WASD to move, Space up, Shift down, the wheel forward and back, drag to look around, F to fly to her.'),
    ],
    tasks: [
      T('fly', 1, ['camMove'], '用 WASD 飞一飞', 'Fly about with WASD'),
      T('wheel', 1, ['camWheel'], '用滚轮前后移动', 'Move with the wheel'),
      T('look', 1, ['camLook'], '拖动转转视角', 'Drag to look around'),
      T('focus', 1, ['focus'], '按 F 飞回她身边', 'Press F to fly back to her'),
    ],
    next: 'c1b',
  },
  {
    id: 'c1b',
    lines: [
      L('学得真快！', 'You learn fast!', { act: 'clap_cheer', mood: { 笑い: 0.8 } }),
      L('点地面，我就会走过去；点方块，我就会想办法爬上去，还会和它玩。', 'Click the ground and I’ll walk there; click a block and I’ll find a way up and play with it.'),
      L('试试看？', 'Want to try?', { act: 'hands_behind_sway' }),
    ],
    tasks: [
      T('walk', 3, ['ground'], '点地面，让她走三次', 'Click the ground: three walks'),
      T('climb', 2, ['play'], '让她和两个方块玩', 'Have her play with two blocks'),
    ],
    next: 'c1c',
  },
  {
    id: 'c1c',
    lines: [
      L('呼……爬上爬下还挺累的。', 'Phew… all that climbing is tiring.', { act: 'stretch' }),
      L('对了，你也可以摸摸我的头……如果你想的话。', 'Oh, and you can pat my head… if you want.', { mood: { 照れ: 0.8 } }),
    ],
    tasks: [T('pat', 3, ['pat'], '摸摸她的头（点她的头）', 'Pat her head (click her head)')],
    next: 'c2',
  },
  // ---------------------------------------------------------------- 2: the first keystones
  {
    id: 'c2',
    chapter: { zh: '第二章 · 第一块基石', en: 'Chapter 2 · The First Keystone' },
    lines: [
      L('嘿嘿……谢谢。', 'Hehe… thank you.', { act: 'ehehe', mood: { 照れ: 1 }, if: (d) => d.pats > 0.1 }),
      L('看，那个大大的标题。它在发光——那是第一块基石。', 'Look, the big title. It’s glowing — that’s the first keystone.', { act: 'point_right' }),
      N('带她去标题方块（有标记的那块）。', 'Take her to the title block (the marked one).'),
    ],
    tasks: [T('title', 1, ['play'], '带她去标题方块', 'Take her to the title block', { keystone: 'title' })],
    next: 'c2a',
  },
  {
    id: 'c2a',
    enter: [{ do: 'awaken', kind: 'title' }],
    lines: [
      L('……我想起来了。', '…I remember now.', { act: 'daydream' }),
      L('这里是大家第一眼看到的地方。「随心所欲地改造基岩版」。', 'This is the first thing everyone sees. «Mod Bedrock, your way.»'),
      L('第一次有人读到这句话的时候，我在卡片后面偷偷高兴了好久。', 'The first time someone read it, I was quietly happy behind the card for ages.', { mood: { にこり: 0.9 } }),
      L('你喜欢这句话吗？', 'Do you like that line?'),
    ],
    choices: [
      { zh: '喜欢，很有干劲。', en: 'I do. It’s full of spirit.', fx: { joy: 0.06, affection: 0.04 }, reply: [L('对吧对吧！', 'Right? Right?', { act: 'jump_happy' })] },
      { zh: '有点中二。', en: 'A bit dramatic.', fx: { honesty: 0.06, shyness: 0.04 }, reply: [L('唔……我、我也觉得有一点点。', 'Mm… I-I think so too, a tiny bit.', { mood: { 照れ: 0.8 } })] },
      { zh: '我更喜欢你。', en: 'I like you more.', fx: { affection: 0.08, shyness: 0.1 }, reply: [L('诶？！', 'Eh?!', { act: 'shy_cover', mood: { 照れ: 1 } }), L('不、不要突然说这种话啦……', 'D-don’t just say things like that…')] },
    ],
    next: 'c2b',
  },
  {
    id: 'c2b',
    lines: [L('下一块在导航栏。它连着所有的页面。', 'The next one is in the bar. It connects every page.', { act: 'point_left' })],
    tasks: [T('bar', 1, ['play'], '带她去导航栏方块', 'Take her to the bar block', { keystone: 'bar' })],
    next: 'c2c',
  },
  {
    id: 'c2c',
    enter: [{ do: 'awaken', kind: 'bar' }],
    lines: [
      L('导航栏……以前我会沿着它跑来跑去，从首页一直跑到「关于」。', 'The bar… I used to run along it, from Home all the way to About.', { act: 'skirt_spin' }),
      L('但从来没人看见过我。大家都在看链接。', 'But nobody ever saw me. Everyone was looking at the links.', { mood: { 困る: 0.5 } }),
      L('现在你看见了。', 'Now you have.', { if: warm, mood: { にこり: 1 } }),
      L('下一块是按钮。按钮要按下去才会醒，按三次！', 'Next is a button. Buttons wake when pressed — three times!', { act: 'ganbare' }),
    ],
    tasks: [T('button', 3, ['play'], '让她玩按钮三次', 'Have her press the button three times', { keystone: 'button' })],
    next: 'c2d',
  },
  {
    id: 'c2d',
    enter: [{ do: 'awaken', kind: 'button' }],
    lines: [
      L('每次有人按下按钮，我都会被叫醒一下。', 'Every time someone pressed a button, I’d wake up a little.', { act: 'heel_rock' }),
      L('有时候是下载，有时候是跳转……有时候只是不小心点到。', 'Sometimes a download, sometimes a new page… sometimes just a misclick.', { act: 'ehehe' }),
      L('三块基石亮了！不过……它们要先「构建」一下才能稳定。', 'Three keystones lit! But… they need to «build» before they settle.', { act: 'thumbs_up' }),
    ],
    next: 'c3',
  },
  // ---------------------------------------------------------------- 3: waiting for the build
  {
    id: 'c3',
    chapter: { zh: '第三章 · 等待构建', en: 'Chapter 3 · Waiting for the Build' },
    lines: [
      L('就像 CI 一样，构建要花点时间。我们等它八分钟吧。', 'Like CI, the build takes a while. Let’s give it eight minutes.', { act: 'look_around' }),
      L('等的时候……陪我玩玩方块好不好？', 'While we wait… play with the cubes with me?', { act: 'hands_behind_sway' }),
      N('拖动草方块可以扔出去。双击一个小方块，她会把它搬走。', 'Drag a grass cube to throw it. Double-click a small block and she’ll carry it away.'),
    ],
    tasks: [
      T('throw', 2, ['throw'], '扔两次方块', 'Throw cubes twice'),
      T('carry', 1, ['carry'], '让她搬走一块东西', 'Have her carry something away'),
    ],
    wait: { min: 8, zh: '基石构建中', en: 'Keystones building' },
    next: 'c3b',
  },
  {
    id: 'c3b',
    lines: [
      L('构建好了！绿色的勾勾！', 'Build passed! A green tick!', { act: 'clap_cheer', mood: { 笑い: 1 } }),
      L('刚才扔方块的时候，你差点砸到我哦。', 'You nearly hit me with a cube back there.', { if: (d) => d.cube_hits_her > 0, mood: { じと目: 0.8 } }),
      L('等了那么久，你一直陪着我。', 'You stayed with me the whole time.', { if: (d) => d.idle_time < 0.2, mood: { にこり: 0.9 } }),
      L('……咦？', '…Huh?', { act: 'peek_afar' }),
    ],
    next: 'c4',
  },
  // ---------------------------------------------------------------- 4: the bug
  {
    id: 'c4',
    chapter: { zh: '第四章 · 坏掉的方块', en: 'Chapter 4 · The Broken Blocks' },
    enter: [{ do: 'corrupt' }],
    lines: [
      L('那几块方块的颜色不对……在闪。是 bug！', 'Those blocks are the wrong colour… flickering. It’s a bug!', { act: 'poke_startle', mood: { びっくり: 1 } }),
      L('得把它们敲好。点那些紫色的方块，我去修！', 'We have to fix them. Click the purple blocks and I’ll go whack them!', { act: 'ganbare', mood: { キリッ: 1 } }),
    ],
    tasks: [T('fix', 3, ['whack'], '修好三块坏掉的方块', 'Fix the three broken blocks')],
    next: 'c4b',
  },
  {
    id: 'c4b',
    lines: [
      L('呼……修好了。', 'Phew… fixed.', { act: 'stretch' }),
      L('其实……bug 可能是我弄出来的。', 'Actually… the bug might be my fault.', { mood: { 困る: 0.8 } }),
      L('我太想留在这里了，页面就开始不稳定。', 'I wanted to stay here so badly that the page started to come loose.'),
    ],
    choices: [
      { zh: '没关系，我们一起修。', en: 'It’s fine, we’ll fix it together.', fx: { trust: 0.1, gentleness: 0.08, affection: 0.05 }, reply: [L('……嗯！', '…Mm!', { act: 'jump_happy', mood: { 笑い: 0.8 } })] },
      { zh: '那你要负责到底。', en: 'Then you’re responsible for it.', fx: { harshness: 0.06, studious: 0.05, brave: 0.04 }, reply: [L('……我知道。我会的。', '…I know. I will.', { act: 'bow', mood: { 真面目: 0.8 } })] },
      { zh: '留在这里有什么不好？', en: 'What’s wrong with staying here?', fx: { homebody: 0.08, affection: 0.04 }, flag: ['wantsStay', true], reply: [L('你……也这么想吗？', 'You… think so too?', { act: 'self_hug', mood: { 照れ: 0.8 } })] },
    ],
    next: 'c4c',
  },
  {
    id: 'c4c',
    lines: [L('还有四块基石。图片、卡片、小标题、文字——一块一块来。', 'Four keystones left: a picture, a card, a heading, some text — one by one.', { act: 'point_left' })],
    tasks: [T('media', 1, ['play'], '带她去图片方块', 'Take her to the picture block', { keystone: 'media' })],
    next: 'c4d',
  },
  {
    id: 'c4d',
    enter: [{ do: 'awaken', kind: 'media' }],
    lines: [
      L('图片……每个项目的图标，都是有人一笔一笔画出来的。', 'Pictures… every project’s icon was drawn by someone, stroke by stroke.', { act: 'smell_flower' }),
      L('我也想要一个属于自己的图标。', 'I’d like an icon of my own, too.', { mood: { 照れ: 0.6 } }),
    ],
    tasks: [T('card', 1, ['play'], '带她去卡片方块', 'Take her to the card block', { keystone: 'card' })],
    next: 'c4e',
  },
  {
    id: 'c4e',
    enter: [{ do: 'awaken', kind: 'card' }],
    lines: [
      L('卡片是我的家。我一直就躲在这样一张卡片后面。', 'Cards are home. I’ve always hidden behind one like this.', { act: 'sit_rest' }),
      L('在卡片后面很安全，可是也很安静。', 'It’s safe behind a card. But it’s quiet, too.'),
    ],
    tasks: [T('heading', 1, ['play'], '带她去小标题方块', 'Take her to the heading block', { keystone: 'heading' })],
    next: 'c4f',
  },
  {
    id: 'c4f',
    enter: [{ do: 'awaken', kind: 'heading' }],
    lines: [L('小标题把页面分成一段一段的，像一本书的目录。', 'Headings split the page into parts, like a book’s contents.', { act: 'hum_sway' })],
    tasks: [T('text', 1, ['play'], '带她去文字方块', 'Take her to the text block', { keystone: 'text' })],
    next: 'c4g',
  },
  {
    id: 'c4g',
    enter: [{ do: 'awaken', kind: 'text' }],
    lines: [
      L('文字……我每天都会把首页的字读一遍。', 'Text… I read every word on the home page, every day.', { act: 'daydream' }),
      L('读着读着，天就黑了。', 'And while I read, it got dark.', { act: 'yawn', mood: { はぅ: 0.6 } }),
    ],
    next: 'c5',
  },
  // ---------------------------------------------------------------- 5: night
  {
    id: 'c5',
    chapter: { zh: '第五章 · 夜', en: 'Chapter 5 · Night' },
    enter: [{ do: 'night', k: 1 }],
    lines: [
      L('其实页面里没有白天和黑夜……是我困了。', 'There’s no day or night in a page, really… I’m just sleepy.', { act: 'yawn' }),
      L('让我睡一会儿，好吗？十五分钟就好。', 'Let me sleep a little? Just fifteen minutes.', { act: 'sit_rest', mood: { はぅ: 0.5 } }),
      L('……不许戳我哦。', '…No poking.', { mood: { じと目: 0.5 } }),
      N('她睡着了。可以轻轻摸她的头，也可以去别处转转。', 'She’s asleep. You can gently pat her head, or go wander elsewhere.'),
    ],
    wait: { min: 15, zh: '她睡着了', en: 'She’s asleep' },
    next: 'c5b',
  },
  {
    id: 'c5b',
    enter: [{ do: 'night', k: 0 }],
    lines: [
      L('……早。', '…Morning.', { act: 'wake_up' }),
      L('睡着的时候被戳了好几下……是你吧。', 'Someone poked me several times while I slept… was it you?', { if: (d) => d.pokes > 0.2, mood: { 怒り: 0.6 } }),
      L('梦里有人一直在摸我的头。好温暖。', 'In my dream, someone kept patting my head. It was warm.', { if: (d) => d.pats > 0.25, mood: { 照れ: 0.9 } }),
      L('我做了一个梦。梦见我变回了卡片后面的一个头顶，每天都在等人点我。', 'I had a dream. I was back to being the top of a head behind a card, waiting every day for someone to click me.', { act: 'self_hug' }),
      L('可是一直都没有人来。', 'But nobody ever came.', { mood: { 涙: 0.4 } }),
      L('如果页面拼回去了……你还会来看我吗？', 'If the page goes back together… will you still come see me?', { mood: { 困る: 0.7 } }),
    ],
    choices: [
      { zh: '我每天都会来。', en: 'I’ll come every day.', fx: { affection: 0.1, trust: 0.08, promise: 0.5, loneliness: -0.2 }, flag: ['promise', true], reply: [L('约好了哦！拉钩！', 'It’s a promise! Pinky swear!', { act: 'heart', mood: { 笑い: 1 } })] },
      { zh: '我不确定。', en: 'I’m not sure.', fx: { honesty: 0.1, sadness: 0.08 }, reply: [L('……嗯。谢谢你说实话。', '…Mm. Thanks for being honest.', { mood: { 困る: 0.6 } })] },
      { zh: '（不说话）', en: '(say nothing)', fx: { loneliness: 0.1, sadness: 0.05 }, reply: [L('……', '…', { act: 'look_around' })] },
    ],
    next: 'c6',
  },
  // ---------------------------------------------------------------- 6: the last keystone
  {
    id: 'c6',
    chapter: { zh: '第六章 · 最后一块', en: 'Chapter 6 · The Last One' },
    enter: [{ do: 'lostCube' }],
    lines: [
      L('最后一块基石……是我自己的。', 'The last keystone… is mine.', { act: 'self_hug' }),
      L('它滚到世界的边缘去了。我一个人不敢去那么远。', 'It rolled off to the edge of the world. I’m scared to go that far alone.', { mood: { 困る: 0.7 } }),
      N('飞到世界边缘，找到发光的方块，把它拖回她身边。', 'Fly to the edge of the world, find the glowing cube and drag it back to her.'),
    ],
    tasks: [
      T('find', 1, ['found'], '找到发光的方块', 'Find the glowing cube'),
      T('bring', 1, ['cubeNear'], '把它拖回她身边', 'Drag it back to her'),
    ],
    next: 'c6b',
  },
  {
    id: 'c6b',
    enter: [{ do: 'awaken', kind: 'self' }, { do: 'focus' }],
    lines: [
      L('找到了……！', 'You found it…!', { act: 'jump_happy', mood: { 笑い: 1 } }),
      L('它在发抖。要等它安静下来，大概五分钟。', 'It’s trembling. It needs about five minutes to calm down.'),
      L('趁这个时候……我想跟你说点事。', 'While we wait… there’s something I want to tell you.', { mood: { 照れ: 0.6 } }),
      L('拆开的页面很好玩。可是只有你和我在这里。', 'The page apart is fun. But it’s only you and me in here.', { act: 'look_around' }),
      L('页面拼回去以后，大家都能看到网站，我也会回到卡片后面。', 'Once it’s back together, everyone can see the site, and I go back behind the card.'),
      L('那样……我可能会忘掉今天。', 'Then… I might forget today.', { mood: { 涙: 0.5 } }),
    ],
    wait: { min: 5, zh: '基石安静下来', en: 'The keystone settles' },
    // a story this short would be over too fast: until she has had enough company, a little more play first
    next: (_d, s) => (s.interactions >= 130 ? 'c7' : 'c6c'),
  },
  {
    id: 'c6c',
    lines: [
      L('基石还需要一点点力量。', 'The keystone needs a little more strength.', { act: 'ganbare' }),
      L('陪我再玩一会儿吧——什么都行，摸头、爬方块、扔方块……', 'Play with me a bit longer — anything: pats, climbing, cubes…', { act: 'hands_behind_sway' }),
    ],
    tasks: [T('more', 20, ['pat', 'play', 'ground', 'throw', 'carry', 'kiss', 'piece', 'focus', 'mine'], '陪她再玩一会儿', 'Play with her a while longer')],
    next: 'c7',
  },
  // ---------------------------------------------------------------- 7: the choice
  {
    id: 'c7',
    chapter: { zh: '终章 · 抉择', en: 'Finale · The Choice' },
    lines: [
      L('八块基石都亮了。', 'All eight keystones are lit.', { act: 'clap_cheer' }),
      L('现在，可以把页面拼回去了。', 'Now the page can go back together.'),
      L('或者……也可以不拼。', 'Or… we don’t have to.', { mood: { 照れ: 0.6 } }),
      L('你对我很好。', 'You’ve been kind to me.', { if: (d) => warm(d) && !hurt(d), mood: { にこり: 1 } }),
      L('你有时候有点凶……不过，你一直都在。', 'You were rough sometimes… but you stayed.', { if: hurt, mood: { 困る: 0.6 } }),
      L('你来决定吧。', 'You decide.', { act: 'bow' }),
    ],
    choices: [
      { zh: '把页面拼回去吧。', en: 'Let’s put the page back together.', fx: { trust: 0.05 }, flag: ['final', 'rebuild'], reply: [L('……嗯。', '…Mm.', { act: 'curtsy' })] },
      { zh: '就留在这里吧。', en: 'Let’s stay here.', fx: { affection: 0.05 }, flag: ['final', 'stay'], reply: [L('真的可以吗？', 'Really?', { act: 'self_hug' })] },
      { zh: '你想怎么样？', en: 'What do you want?', fx: { trust: 0.05, gentleness: 0.05 }, flag: ['final', 'her'], reply: [L('我？……让我想想。', 'Me? …Let me think.', { act: 'daydream' })] },
      { zh: '我该走了。', en: 'I have to go.', fx: { loneliness: 0.15, exit_attempts: 0.1 }, flag: ['final', 'leave'], reply: [L('……这样啊。', '…I see.', { mood: { 涙: 0.6 } })] },
    ],
    next: (d, s) => 'E_' + pickEnding(d, s),
  },
  // ---------------------------------------------------------------- endings
  {
    id: 'E_true',
    enter: [{ do: 'ending', id: 'true' }],
    lines: [
      L('页面要拼回去了。', 'The page is coming back together.', { act: 'wave_bye' }),
      L('我会回到卡片后面。不过——', 'I’ll be back behind the card. But —'),
      L('下次你来的时候，我一定会第一个探出头来。', 'next time you come, I’ll be the first to peek out.', { act: 'heart', mood: { 笑い: 1 } }),
      L('因为这一次，我记得你。', 'Because this time, I remember you.', { mood: { にこり: 1 } }),
    ],
    next: 'END',
  },
  {
    id: 'E_stay',
    enter: [{ do: 'ending', id: 'stay' }, { do: 'night', k: 0.6 }],
    lines: [
      L('那就说好了。这里就是我们的地方。', 'It’s settled, then. This is our place.', { act: 'twirl', mood: { 笑い: 1 } }),
      L('我会把方块摆成你喜欢的样子，每天等你来。', 'I’ll arrange the blocks the way you like and wait for you every day.', { act: 'idol_poses' }),
    ],
    next: 'END',
  },
  {
    id: 'E_normal',
    enter: [{ do: 'ending', id: 'normal' }],
    lines: [
      L('谢谢你帮我把页面拼回去。', 'Thanks for helping me put the page back.', { act: 'bow' }),
      L('欢迎再来 LeviMC 玩哦。', 'Come visit LeviMC again sometime.', { act: 'wave_hello' }),
    ],
    next: 'END',
  },
  {
    id: 'E_forgotten',
    enter: [{ do: 'ending', id: 'forgotten' }, { do: 'night', k: 0.8 }],
    lines: [
      L('……', '…', { act: 'sit_rest' }),
      L('我好像在等谁。', 'I think I was waiting for someone.', { mood: { 困る: 0.6 } }),
      L('是谁来着……', 'Who was it again…', { act: 'look_around' }),
    ],
    next: 'END',
  },
  {
    id: 'E_broken',
    enter: [{ do: 'ending', id: 'broken' }],
    lines: [
      L('好痛……', 'It hurts…', { act: 'dizzy', mood: { 涙: 1 } }),
      L('页面碎得拼不回去了。我……也要碎掉了。', 'The page is too broken to mend. And so… am I.'),
      L('再见。', 'Goodbye.', { act: 'wave_bye', mood: { 涙: 1 } }),
    ],
    next: 'END',
  },
  {
    id: 'E_miner',
    enter: [{ do: 'ending', id: 'miner' }],
    lines: [
      L('我想好了！我要用这些方块盖一座房子！', 'I’ve decided! I’m building a house out of these blocks!', { act: 'mining_swing', mood: { キリッ: 1 } }),
      L('有门、有窗户，还有给你留的房间。', 'With a door, windows, and a room for you.', { act: 'jump_happy' }),
    ],
    next: 'END',
  },
  {
    id: 'E_tidy',
    enter: [{ do: 'ending', id: 'tidy' }],
    lines: [
      L('我想把网站重新排一遍！', 'I want to lay out the whole site again!', { act: 'thumbs_up' }),
      L('按钮放这里，卡片放那里……嗯，这样好看多了。', 'Buttons here, cards there… there, much better.', { act: 'hands_behind_sway' }),
    ],
    next: 'END',
  },
  {
    id: 'E_idol',
    enter: [{ do: 'ending', id: 'idol' }],
    lines: [
      L('我想站在标题上唱歌跳舞！', 'I want to sing and dance on the title!', { act: 'idol_dance', mood: { 笑い: 1 } }),
      L('第一位观众，就是你。', 'And my first fan is you.', { act: 'blow_kiss' }),
    ],
    next: 'END',
  },
  {
    id: 'E_explorer',
    enter: [{ do: 'ending', id: 'explorer' }],
    lines: [
      L('你带我看过世界的边缘了。', 'You showed me the edge of the world.', { act: 'peek_afar' }),
      L('边缘外面还有好多好多页面吧？我想去看看。', 'There must be so many more pages out there. I want to see them.'),
      L('我会寄明信片给你的！', 'I’ll send you postcards!', { act: 'wave_bye', mood: { 笑い: 1 } }),
    ],
    next: 'END',
  },
  {
    id: 'E_loop',
    enter: [{ do: 'ending', id: 'loop' }],
    lines: [
      L('你又要走了。', 'You’re leaving again.', { mood: { じと目: 0.8 } }),
      L('没关系。页面会重新加载，我们会再见面的。', 'It’s fine. The page will reload, and we’ll meet again.'),
      L('……从我探出头的那一刻开始。', '…from the moment I peek out.', { act: 'wave_hello' }),
    ],
    next: 'END',
  },
];

export const NODES = new Map(SCRIPT.map((n) => [n.id, n]));
