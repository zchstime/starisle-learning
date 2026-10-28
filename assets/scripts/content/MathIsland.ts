/** Original Grade 2 teaching content. No textbook/exam affiliation. */
export const MISSIONS = [
  { id: 'bridge', place: '晨光小桥', title: '把星光合起来', skill: '两位数进位加法', tag: '01  凑满十，换一捆',
    story: '小桥需要星光才能亮起来。我们有 27 颗，又找到 15 颗。把它们合起来吧！',
    goal: '27 + 15 = ?', hint: '10 颗小星星可以换成 1 捆。先合起来，再数一数。',
    success: '42 颗星星点亮了小桥！\n满十个一，就换成一个十。', reward: '晨光星章', map: [690, 330] as [number,number], answer:42 },
  { id: 'supplies', place: '风语补给站', title: '给小树送星光', skill: '两位数退位减法', tag: '02  不够减，拆一捆',
    story: '仓库有 43 颗星光，小树需要 18 颗。把 1 捆和 8 颗放进小车，看看还剩多少。',
    goal: '43 − 18 = ?', hint: '单颗不够了？点“拆一捆”，把它拆成 10 颗，再继续配送。',
    success: '送出了 18 颗，还剩 25 颗！\n一个十能拆成十个一，总数没有变。', reward: '风语星章', map: [365, 260] as [number,number], answer:25 },
  { id: 'garden', place: '星语花园', title: '让每盆一样多', skill: '乘法的意义', tag: '03  几个几，用乘法',
    story: '有 4 个花盆，每盆要种 3 颗星星种子。点花盆放种子，让每一盆都一样多。',
    goal: '4 个 3，一共是多少？', hint: '每盆放 3 颗，一共 4 盆。可以数 3、6、9、12。',
    success: '4 盆，每盆 3 颗，一共 12 颗！\n3 + 3 + 3 + 3 = 4 × 3 = 12。', reward: '花园星章', map: [1115,485] as [number,number], answer:12 }
];
export const TRANSFER = [
  { prompt:'船上有 36 颗星星，又装上 27 颗。\n现在一共有多少颗？', expression:'36 + 27 = ?', answer:63, skill:'进位加法', explanation:'6 + 7 = 13，满十进一。30 + 20 + 10 + 3 = 63。' },
  { prompt:'仓库有 52 颗星星，送出 26 颗。\n还剩多少颗？', expression:'52 − 26 = ?', answer:26, skill:'退位减法', explanation:'把 1 个十拆成 10 个一。12 − 6 = 6，剩下的 4 个十减 2 个十，得到 26。' },
  { prompt:'有 5 个花盆，每盆种 4 颗种子。\n一共需要多少颗？', expression:'5 × 4 = ?', answer:20, skill:'几个几', explanation:'5 个 4 相加：4 + 4 + 4 + 4 + 4 = 20。' }
];
