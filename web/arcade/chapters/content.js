export function pictureCorrect(a, placements) { return placements.length === a.cards.length && placements.every((v, i) => v === a.solution[i]); }
export function placePicture(a, placements, card, slot) { if (!Number.isInteger(card) || card < 0 || card >= a.cards.length)
    return false; if (slot !== null) {
    const at = a.slots.findIndex(s => s.id === slot);
    if (at < 0 || placements.filter((s, i) => i !== card && s === slot).length >= a.capacity[at])
        return false;
} placements[card] = slot; return true; }
const item = (id, label, icon, clue) => ({ id, label, icon, clue });
export function validPicture(a) { return !!a && ['match', 'sort', 'sequence', 'share', 'mosaic'].includes(a.mode) && typeof a.instruction === 'string' && a.instruction.length < 500 && Array.isArray(a.cards) && a.cards.length >= 2 && a.cards.length <= 24 && Array.isArray(a.slots) && a.slots.length >= 2 && a.slots.length <= 12 && [...a.cards, ...a.slots].every(c => c && typeof c.id === 'string' && /^[\w.-]{1,80}$/.test(c.id) && typeof c.label === 'string' && c.label.length <= 180 && (!c.icon || /^[\w-]{1,30}$/.test(c.icon)) && (!c.clue || typeof c.clue === 'string' && c.clue.length <= 200)) && new Set(a.cards.map(c => c.id)).size === a.cards.length && new Set(a.slots.map(c => c.id)).size === a.slots.length && Array.isArray(a.solution) && a.solution.length === a.cards.length && a.solution.every(s => a.slots.some(t => t.id === s)) && Array.isArray(a.capacity) && a.capacity.length === a.slots.length && a.capacity.every((n, i) => Number.isInteger(n) && n >= 1 && n <= 24 && a.solution.filter(s => s === a.slots[i].id).length <= n); }
const picture = (id, title, goal, a, explanation) => ({ id, kind: 'picture', title, goal, target: 0, hint: '先听星宝，再看小手。拖动卡片，也可以点卡片再点位置；点已放好的卡片可以取回。', explanation, stage: 'practice', activity: a });
function ordered(instruction, labels, icons) { return { mode: 'sequence', instruction, cards: labels.map((v, i) => item('c' + i, v, icons[i])), slots: labels.map((_, i) => item('s' + i, '', 'step')), solution: labels.map((_, i) => 's' + i), capacity: labels.map(() => 1) }; }
function sorting(instruction, labels, icons, bins, binIcons, answers) { return { mode: 'sort', instruction, cards: labels.map((v, i) => item('c' + i, v, icons[i])), slots: bins.map((v, i) => item('s' + i, v, binIcons[i])), solution: answers.map(i => 's' + i), capacity: bins.map(() => labels.length) }; }
function share(groups, each) { return { mode: 'share', instruction: '把果子平均分给每一位伙伴，让大家分到的一样多。全部分完后点星星检查。', cards: Array.from({ length: groups * each }, (_, i) => item('c' + i, '', 'apple')), slots: Array.from({ length: groups }, (_, i) => item('s' + i, '', 'basket')), solution: Array.from({ length: groups * each }, (_, i) => 's' + Math.floor(i / each)), capacity: Array(groups).fill(each), total: groups * each }; }
// Identical fruit may go to any basket: canonicalize only after validating counts.
export function normalizedPlacements(a, p) { if (a.mode === 'share' && p.length === a.cards.length && a.slots.every((s, i) => p.filter(v => v === s.id).length === a.capacity[i]))
    return [...a.solution]; if (a.mode === 'mosaic' && p.length === a.cards.length && p.every(v => v === a.slots[0].id || v === a.slots[1].id) && p.filter(v => v === a.slots[0].id).length === a.sample)
    return [...a.solution]; return p; }
const sci = [
    [['苹果', '石头', '小树', '玻璃杯'], ['apple', 'rock', 'tree', 'cup'], ['来自植物', '其他物品'], ['leaf', 'box'], [0, 1, 0, 1], '观察物品的来源，把来自植物的物品送到叶子篮子。'],
    [['铁钉', '木块', '铁制回形针', '塑料积木'], ['nail', 'wood', 'clip', 'block'], ['磁铁能吸引', '磁铁不能吸引'], ['magnet', 'box'], [0, 1, 0, 1], '把能被磁铁吸引的铁制物品送到磁铁旁边。'],
    [['冰块', '水', '水蒸气'], ['ice', 'water', 'vapor'], ['固态', '液态', '气态'], ['ice', 'water', 'vapor'], [0, 1, 2], '给水的三种状态找家。水蒸气看不见，图中虚线只表示气体。'],
    [['太阳', '发光的灯泡', '月亮', '镜子'], ['sun', 'bulb', 'moon', 'mirror'], ['自身发光', '反射光'], ['bulb', 'mirror'], [0, 0, 1, 1], '把自己能发光的物体放到灯泡旁，把反射光的放到镜子旁。'],
    [['草', '蝗虫', '青蛙', '蛇'], ['grass', 'bug', 'frog', 'snake'], [], [], [], '按照被吃到吃的顺序，搭一条食物链。'],
    [['铁钉生锈', '纸被撕碎', '冰融化', '木材燃烧'], ['rust', 'paper', 'ice', 'fire'], ['产生新物质', '没有产生新物质'], ['spark', 'water'], [0, 1, 1, 0], '观察变化后的物质，把产生新物质的变化放到星光一边。']
];
export function gradeActivities(grade, subject) {
    const prefix = `${subject}.g${grade}.hands`;
    if (subject === 'math') {
        const g = grade < 3 ? 2 : grade < 5 ? 3 : 4, n = grade < 3 ? grade + 1 : grade === 3 ? 3 : grade === 4 ? 4 : 3;
        const a = share(g, n);
        let goal = grade === 1 ? '把图中的苹果分给两位伙伴，一样多。' : `${g * n} 个果子平均分成 ${g} 份。动手分一分。`;
        let shareExplanation = `${g * n} ÷ ${g} = ${n}，每份 ${n} 个。`;
        if (grade === 5) {
            a.cards.forEach(c => c.label = '0.3');
            goal = '3.6 千克果子平均分给 4 位伙伴；每张卡表示 0.3 千克。';
            a.instruction = '每张果子卡表示零点三千克，平均分完，看看每位伙伴分到多少千克。';
            shareExplanation = '每人 3 张，每张 0.3 千克，所以每人 0.9 千克。';
        }
        if (grade === 6) {
            a.slots = [item('s0', '1 份', 'basket'), item('s1', '2 份', 'basket')];
            a.capacity = [4, 8];
            a.solution = a.cards.map((_, i) => i < 4 ? 's0' : 's1');
            goal = '把 12 个果子按 1∶2 分给两位伙伴。';
            a.instruction = '两位伙伴的份数是一比二。动手分一分，让第二位得到第一位的两倍。';
            shareExplanation = '12÷(1+2)=4，每份4个，分别分4个和8个。';
        }
        const count = grade < 3 ? 6 : 12, take = [3, 2, 4, 6, 8, 9][grade - 1];
        const mosaic = { mode: 'mosaic', instruction: '把方块送到花田或材料箱里，拼出任务要求的金色部分。每一块都一样大。', cards: Array.from({ length: count }, (_, i) => item('c' + i, '', 'tile')), slots: [item('s0', '花田', 'flower'), item('s1', '材料箱', 'box')], solution: Array.from({ length: count }, (_, i) => i < take ? 's0' : 's1'), capacity: [count, count], sample: take, total: count };
        const fraction = ['一半', '三分之一', '三分之一', '二分之一', '三分之二', '百分之七十五'][grade - 1];
        const seq = grade < 3 ? ordered('观察图形的边，把图形按边数从少到多排列。', ['三角形', '正方形', '五边形'], ['triangle', 'square', 'pentagon']) : ordered('比较每张卡片涂色部分的大小，从小到大排一排。', grade === 5 ? ['0.25', '0.5', '0.75'] : grade === 6 ? ['25%', '2/4', '0.75'] : ['1/4', '1/2', '3/4'], ['quarter', 'half', 'threequarters']);
        return [picture(prefix + '.share', grade === 6 ? '配比补给站' : grade === 5 ? '小数分装站' : '公平分享站', goal, a, shareExplanation), picture(prefix + '.mosaic', '花田拼图', grade < 3 ? `把 ${take} 块方砖放进花田，其余放回材料箱。` : `让花田里的金色方砖占全部的${fraction}。`, mosaic, `${take}/${count} 的方砖在花田里。`), picture(prefix + '.order', '图形排排队', grade < 3 ? '按边数从少到多排列图形。' : '按涂色部分从小到大排列。', seq, grade < 3 ? '三角形有3条边，正方形有4条边，五边形有5条边。' : grade === 5 ? '0.25 < 0.5 < 0.75；它们分别是四分之一、二分之一、四分之三。' : grade === 6 ? '25% = 1/4，2/4 = 1/2，0.75 = 3/4。' : '同样大的整体，1/4 < 1/2 < 3/4。')];
    }
    const row = sci[grade - 1];
    const a = grade === 5 ? ordered(row[5], [...row[0]], [...row[1]]) : sorting(row[5], [...row[0]], [...row[1]], [...row[2]], [...row[3]], [...row[4]]);
    const processes = [['种子', '发芽', '幼苗', '开花'], ['观察', '预测', '实验', '记录'], ['液态水', '水蒸气', '小水滴'], ['电池', '导线', '灯泡', '返回电池'], ['两盆相同幼苗', '只改变光照', '观察并记录', '比较结果'], ['提出问题', '作出假设', '实验并记录', '分析证据']];
    const icons = [['seed', 'sprout', 'tree', 'flower'], ['eye', 'question', 'flask', 'chart'], ['water', 'vapor', 'drop'], ['battery', 'wire', 'bulb', 'battery'], ['sprout', 'sun', 'eye', 'chart'], ['question', 'idea', 'flask', 'chart']];
    const goals = ['把植物从种子到开花的过程排出来。', '先观察并预测，再动手实验并记录。', '加热水形成水蒸气，再遇冷凝结成小水滴。', '从电池出发，沿导线经过灯泡，再接回电池另一端。', '研究光照的作用：只改变光照，其他条件尽量相同，最后比较生长。', '把探究步骤排好，实验结果要用证据说明。'];
    return [picture(prefix + '.sort', grade === 5 ? '食物链搭建' : '观察分类站', row[5], a, grade === 5 ? '草 → 蝗虫 → 青蛙 → 蛇；箭头表示食物中的能量传递方向。' : row[0].map((v, i) => v + '：' + row[2][row[4][i]]).join('；') + '。'), picture(prefix + '.sequence', '科学过程桥', goals[grade - 1], ordered('看图，把过程按先后顺序放好。可以点小手看一次操作示范。', processes[grade - 1], icons[grade - 1]), goals[grade - 1])];
}
function answer(l) { if (l.kind === 'choice' && !l.voice?.startsWith('tone_') && !l.voice?.startsWith('drum_'))
    return l.options?.[l.target]; if (['number', 'cargo'].includes(l.kind))
    return String(l.target / (l.scale || 1)) + (l.answerUnit || ''); return null; }
/** Stable appended IDs preserve existing saves; no cloned numerical questions or generated facts. */
export function enrichChapters(chapters) {
    for (const c of chapters) {
        // Curated mastery sequences already assign each stop a deliberate evidence role.
        // Do not append an automatic activity: it would change completion gates for old saves.
        if (c.curriculum?.reviewStatus === 'editor-reviewed' || c.levels.some(l => l.id === c.id + '.connect'))
            continue;
        const sources = [], answers = [];
        for (const l of c.levels) {
            const a = answer(l);
            if (a && a.length < 60 && !answers.includes(a) && !l.passage && l.goal.length <= 160) {
                sources.push(l);
                answers.push(a);
            }
            if (sources.length === 3)
                break;
        }
        if (sources.length >= 2) {
            const a = { mode: 'match', instruction: '每张线索都有自己的伙伴。把线索送到对应的答案旁，全部配好后点星星检查。', cards: sources.map((l, i) => item('c' + i, l.goal, 'clue')), slots: answers.map((v, i) => item('s' + i, v, 'answer')), solution: answers.map((_, i) => 's' + i), capacity: answers.map(() => 1) };
            c.levels.push(picture(c.id + '.connect', '线索连连看', '把这一章的线索和结果配成对。', a, sources.map(l => l.explanation).join(' ').slice(0, 300)));
        }
    }
    for (let grade = 1; grade <= 6; grade++)
        for (const subject of ['math', 'science']) {
            const list = chapters.filter(c => c.grade === grade && c.subject === subject);
            if (!list.length)
                continue;
            const tasks = gradeActivities(grade, subject);
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                if (list.some(c => c.levels.some(l => l.id === task.id)))
                    continue;
                const patterns = subject === 'math' ? [/分享|除法|乘法|数星|初见/, /分数|百分|拼|图形|分类/, /分数|图形|积木|观察/] : [/观察|植物|材料|磁|物质|能量|生命/, /植物|实验|探究|水|电|生命/];
                const preferred = subject === 'science' ? [['mission1', 'c1'], ['c2', 'c1'], ['c2', 'c2'], ['c1', 'mission2'], ['c1', 'c2'], ['c1', 'c2']][grade - 1][i] : null;
                const mathPatterns = [[/数星星/, /平面图形/, /平面图形/], [/分享果园/, /分类/, /图形/], [/平均分航线/, /分数花瓣/, /分数花瓣/], [/除法/, /分数|小数/, /分数|小数/], [/小数工坊/, /等值花田/, /小数工坊/], [/比例调色坊/, /百分数花海/, /百分数花海/]];
                const dest = (preferred ? list.find(c => c.id === `${subject}.g${grade}.${preferred}`) : list.find(c => mathPatterns[grade - 1][i].test(c.title + ' ' + c.topic))) || list.find(c => patterns[Math.min(i, patterns.length - 1)].test(c.title + ' ' + c.topic)) || list[Math.min(i, list.length - 1)];
                dest.levels.push(task);
            }
        }
    return chapters;
}
