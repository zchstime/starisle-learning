/** Original short companion dialogue. No personal data is sent for synthesis. */
export const COMPANION_LINES = {
 welcome:'嗨，我是星宝！欢迎来到星屿学园。点亮一颗星星，我们一起出发吧！',
 resume:'你回来啦！小岛记着你的脚步。我们接着探索吧！',
 start:'新的小挑战来啦！先看清任务，慢慢想，我陪着你。',
 wrong:'没关系呀，我们换个办法想一想。需要时，可以点提示哦。',
 success:'叮！又点亮一颗星星！你刚才的努力，我看见啦！',
 levelup:'哇，升级啦！你和星宝都变得更厉害了！',
 idleMap:'想从哪里出发呢？点开始探索，就能接着上次的冒险啦。',
 idlePlay:'还在想呀？不着急。可以看看提示，也可以休息一小会儿。',
 help:'先读一遍任务，找找已知的线索。点题目旁的提示，我们一步一步来。',
 rest:'好呀，休息一下，看看远处。准备好了，再回来找我吧！',
 ready:'好哒！我安静陪着你，按自己的节奏来就好。',
 hello:'嘿嘿，星宝在这里！今天也一起发现新知识吧！',
 break:'已经探索一会儿啦。要不要伸个懒腰，让眼睛也休息一下？',
 exam:'试炼开始后，我会安静陪着你。认真读题，相信自己的思考！',
} as const;
export type CompanionLine = keyof typeof COMPANION_LINES;
