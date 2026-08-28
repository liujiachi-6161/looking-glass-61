// 吉普赛之眼 · 模块化核心逻辑 (第一部分：基础配置与工具函数)

const ELEMENT_MAP = {
    '火': { name: '火', icon: '🔥', class: 'fire', color: '#e67e22' },
    '风': { name: '风', icon: '💨', class: 'air', color: '#95a5a6' },
    '水': { name: '水', icon: '💧', class: 'water', color: '#3498db' },
    '土': { name: '土', icon: '🌍', class: 'earth', color: '#d4a574' }
};
const RANK_ELEMENT = { '侍从': '土', '骑士': '火', '王后': '水', '国王': '风' };
const MIX_ELEMENT_DESC = {
    '火+火': '纯粹的火焰，行动与意志的极致表达',
    '火+土': '火中之土，行动力扎根于现实',
    '火+水': '火中之水，热情与情感的交融',
    '火+风': '火中之风，行动受思维引导',
    '水+火': '水中之火，情感驱动行动',
    '水+水': '纯粹的水流，情感与直觉的深渊',
    '水+土': '水中之土，情感稳定扎根',
    '水+风': '水中之风，情感与思维的流动',
    '风+火': '风中之火，思维点燃行动',
    '风+水': '风中之水，思维渗透情感',
    '风+风': '纯粹的风，思维与沟通的极致',
    '风+土': '风中之土，思维落地实践',
    '土+火': '土中之火，物质中孕育行动',
    '土+水': '土中之水，物质滋养情感',
    '土+风': '土中之风，物质承载思维',
    '土+土': '纯粹的土，物质与现实的极致'
};

// 全局状态变量
let currentPosition = 'upright';
let currentCard = null;
let favorites = JSON.parse(localStorage.getItem('tarot_favorites') || '[]');
let notes = JSON.parse(localStorage.getItem('tarot_notes') || '{}');
let history = JSON.parse(localStorage.getItem('tarot_history') || '[]');
let dailyCard = JSON.parse(localStorage.getItem('tarot_daily') || 'null');
let toastTimer = null;
let currentFilter = 'all';
let currentView = 'browse';
let currentSpread = 'three';
let currentSymbolFilter = 'all';

// 牌阵定义
const SPREAD_DEFS = {
    three: {
        label: '三牌阵', count: 3,
        slots: ['过去', '现在', '未来'],
        meanings: ['已发生之事，造就当下的因', '此刻之局，需直面之境', '即将显现，可望之势'],
        desc: '过去-现在-未来，线性时间之镜'
    },
    celtic: {
        label: '凯尔特十字', count: 10,
        slots: ['当下', '阻挡', '根基', '过去', '未来', '上方', '下方', '建议', '他人', '结局'],
        meanings: ['当前位置', '面对的障碍', '内在基石', '近因', '发展趋势', '理想/意识', '潜意识/恐惧', '行动指引', '外部影响', '最终结果'],
        desc: '十张牌构成十字与权杖，全景式深层解读'
    },
    relationship: {
        label: '关系牌阵', count: 6,
        slots: ['你', '对方', '关系现状', '你的期望', '对方的期望', '发展可能'],
        meanings: ['你在关系中的状态', '对方的状态', '当前关系的能量', '你渴望的图景', '对方渴望的图景', '关系走向的种子'],
        desc: '双人视角，照见关系中的光与影'
    },
    seven: {
        label: '七张牌', count: 7,
        slots: ['问题', '阻碍', '助力', '态度', '环境', '行动', '结果'],
        meanings: ['核心议题', '面对的挑战', '可借助的力量', '你的应对姿态', '外部环境', '应采取的步骤', '最终的走向'],
        desc: '七阶路径，从问题到结果的完整脉络'
    }
};

// 工具函数
function getDualElements(card) {
    const primary = card.element;
    let secondary = null;
    if (['侍从', '骑士', '王后', '国王'].includes(card.number)) {
        secondary = RANK_ELEMENT[card.number];
    }
    return { primary, secondary };
}

function getMixElementDesc(primary, secondary) {
    if (!secondary) return null;
    const key = primary + '+' + secondary;
    return MIX_ELEMENT_DESC[key] || `${primary}与${secondary}的融合`;
}

function switchPosition(pos) {
    currentPosition = pos;
    document.getElementById('uprightTab').classList.toggle('active', pos === 'upright');
    document.getElementById('reversedTab').classList.toggle('active', pos === 'reversed');
    const imgContainer = document.getElementById('detailImgContainer');
    const indicator = document.getElementById('reversedIndicator');
    const descBox = document.getElementById('modalDesc');
    if (pos === 'reversed') {
        imgContainer.classList.add('reversed');
        indicator.style.display = 'block';
        descBox.classList.add('reversed');
        descBox.innerHTML = `<strong>${currentCard.name} · 逆位</strong> — ${currentCard.reverseDesc}`;
    } else {
        imgContainer.classList.remove('reversed');
        indicator.style.display = 'none';
        descBox.classList.remove('reversed');
        descBox.innerHTML = `<strong>${currentCard.name} · 正位</strong> — ${currentCard.desc}`;
    }
}

function getTypeName(type) {
    const names = { major: '大阿卡纳', wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币' };
    return names[type] || type;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}
// 吉普赛之眼 · 模块化核心逻辑 (第二部分：78张牌数据)

const TAROT_DATA = [
    { id: 0, name: "愚人", emoji: "🧙", element: "风", number: "0", type: "major", age: "少年", role: "流浪者", time: "黎明", mood: "无畏", event: "启程", desc: "天真之勇，跳出悬崖的信仰。脚下是虚空，手中是行囊，眼中有星辰。", reverseDesc: "鲁莽冲动，无视警告。悬崖边的盲目跳跃，缺乏准备的冒险。", highlight: "脚边小狗·悬崖·白玫瑰", imgUrl: "https://pic1.imgdb.cn/i/0345qr49zJCvB89GbuZSlS.jpg" },
    { id: 1, name: "魔术师", emoji: "🪄", element: "风", number: "1", type: "major", age: "青年", role: "创造者", time: "清晨", mood: "专注", event: "显化", desc: "万物在手，连接天与地。四元素在桌上，无限符号在头顶。", reverseDesc: "操控欺骗，滥用力量。表面的魅力掩盖内在的空虚，操纵他人。", highlight: "四元素桌·无限符号·云手", imgUrl: "https://pic1.imgdb.cn/i/0345qr49tGBwaXWYBpOnxJ.jpg" },
    { id: 2, name: "女祭司", emoji: "🕯️", element: "水", number: "2", type: "major", age: "青年", role: "守护者", time: "子夜", mood: "直觉", event: "静观", desc: "潜意识之门。手中律法，身后帷幕，她知晓一切却沉默。", reverseDesc: "隐藏秘密，压抑直觉。拒绝倾听内心的声音，被表象迷惑。", highlight: "黑白柱·月相·书卷", imgUrl: "https://pic1.imgdb.cn/i/0345qr4Wb9w9bCCPEPPKJs.jpg" },
    { id: 3, name: "皇后", emoji: "👑", element: "土", number: "3", type: "major", age: "成年", role: "滋养者", time: "春日", mood: "丰饶", event: "生长", desc: "大地之母。麦田与瀑布，她让一切自然生长。", reverseDesc: "过度依赖，情感匮乏。失去滋养的能力，或过度溺爱导致依赖。", highlight: "麦穗·瀑布", imgUrl: "https://pic1.imgdb.cn/i/0345qr4KJvnO54hmwybRUV.jpg" },
    { id: 4, name: "皇帝", emoji: "🏛️", element: "火", number: "4", type: "major", age: "中年", role: "统治者", time: "正午", mood: "权威", event: "建立", desc: "秩序与基石。石座上凝视，手中权杖即是法则。", reverseDesc: "专制暴政，僵化控制。滥用权力，或过度控制导致反抗。", highlight: "宝座·王冠", imgUrl: "https://pic1.imgdb.cn/i/0345qr4RvDPxzDDzXbBlbP.jpg" },
    { id: 5, name: "教皇", emoji: "⛪", element: "土", number: "5", type: "major", age: "中年", role: "导师", time: "黄昏", mood: "信仰", event: "教导", desc: "传统与智慧。双钥匙代表显与隐，指引在聆听中显现。", reverseDesc: "教条主义，精神束缚。盲目遵循传统，或反抗权威导致迷失。", highlight: "三重冠·交叉钥匙", imgUrl: "https://pic1.imgdb.cn/i/0345qpnZdNscsoj5YDeVIF.jpg" },
    { id: 6, name: "恋人", emoji: "💞", element: "风", number: "6", type: "major", age: "青年", role: "选择者", time: "午后", mood: "爱", event: "抉择", desc: "心之所向。天使降下祝福，身后两棵树代表善与恶的抉择。", reverseDesc: "错误选择，关系失衡。价值观冲突，或做出有害的决定。", highlight: "天使·对称·树·男女", imgUrl: "https://pic1.imgdb.cn/i/0345qr4rATJjgbeISqkj9M.jpg" },
    { id: 7, name: "战车", emoji: "⚔️", element: "火", number: "7", type: "major", age: "壮年", role: "征服者", time: "正午", mood: "意志", event: "凯旋", desc: "钢铁意志，双手握缰。狮身兽代表对立，王冠是内在权威。", reverseDesc: "失控崩溃，方向迷失。内在冲突失控，或过度控制导致崩溃。", highlight: "对称·双狮·城市背景", imgUrl: "https://pic1.imgdb.cn/i/0345qr4rYhMv4aszeFe6oS.jpg" },
    { id: 8, name: "力量", emoji: "🦁", element: "火", number: "8", type: "major", age: "成年", role: "驯服者", time: "清晨", mood: "慈悲", event: "驯服", desc: "柔韧胜刚强。女子轻抚狮口，无限符号在头顶。", reverseDesc: "失控情绪，软弱无力。被本能欲望控制，或压抑导致爆发。", highlight: "狮子·女子·无限符号", imgUrl: "https://pic1.imgdb.cn/i/0345qr5A4rafXy9Yprpjc7.jpg" },
    { id: 9, name: "隐士", emoji: "🏔️", element: "土", number: "9", type: "major", age: "老年", role: "智者", time: "深夜", mood: "内省", event: "独行", desc: "内在之光。提灯照亮脚下，权杖是经验的重量。", reverseDesc: "孤立退缩，拒绝指引。过度孤独导致迷失，或拒绝他人帮助。", highlight: "提灯·雪山", imgUrl: "https://pic1.imgdb.cn/i/0345qqXdhqrnTLysebzE7c.jpg" },
    { id: 10, name: "命运之轮", emoji: "🎡", element: "风", number: "10", type: "major", age: "无常", role: "循环", time: "永恒", mood: "转变", event: "轮回", desc: "一切流转。轮上三兽代表过去现在未来，上升与坠落都是命运。", reverseDesc: "厄运循环，抗拒改变。陷入负面循环，或拒绝接受变化。", highlight: "轮盘·天使·三兽", imgUrl: "https://pic1.imgdb.cn/i/0345qqXgpPnYYwE8kV2Hlb.jpg" },
    { id: 11, name: "正义", emoji: "⚖️", element: "风", number: "11", type: "major", age: "成年", role: "裁决者", time: "正午", mood: "平衡", event: "审判", desc: "因果之剑。天秤衡量，双刃剑切断虚妄。", reverseDesc: "不公不义，逃避责任。偏见影响判断，或拒绝面对后果。", highlight: "天秤·王冠·双刃剑", imgUrl: "https://pic1.imgdb.cn/i/0345qqXcRQfeOupUn8MJZf.jpg" },
    { id: 12, name: "倒吊人", emoji: "🙃", element: "水", number: "12", type: "major", age: "青年", role: "牺牲者", time: "黄昏", mood: "臣服", event: "逆转", desc: "逆向视角。自愿倒悬，光环在头顶，平静即是力量。", reverseDesc: "抗拒牺牲，徒劳挣扎。拒绝改变视角，或无谓的牺牲。", highlight: "倒悬·树·光晕", imgUrl: "https://pic1.imgdb.cn/i/0345qqXcpUXnpzRYrrYQZ4.jpg" },
    { id: 13, name: "死神", emoji: "💀", element: "水", number: "13", type: "major", age: "暮年", role: "终结者", time: "黄昏", mood: "蜕变", event: "结束", desc: "结束即新生。甲胄之下是慈悲，旗帜上玫瑰绽放于废墟。", reverseDesc: "停滞不变，抗拒结束。害怕改变导致僵化，或无法放手。", highlight: "骷髅·旗帜·河流·落日", imgUrl: "https://pic1.imgdb.cn/i/0345qqXeaDbmhsWPIbVa3w.jpg" },
    { id: 14, name: "节制", emoji: "🌊", element: "火", number: "14", type: "major", age: "成年", role: "调和者", time: "黎明", mood: "平衡", event: "融合", desc: "融合与流动。金杯交错，光芒从头顶倾泻。", reverseDesc: "极端失衡，过度放纵。失去节制导致混乱，或矫枉过正。", highlight: "金杯·光芒·路径", imgUrl: "https://pic1.imgdb.cn/i/0345qqYLTRuqmAthMf3YhO.jpg" },
    { id: 15, name: "恶魔", emoji: "😈", element: "土", number: "15", type: "major", age: "成年", role: "束缚者", time: "子夜", mood: "欲望", event: "禁锢", desc: "物质之奴。锁链看似松弛，倒五角星是扭曲的灵性。", reverseDesc: "打破束缚，重获自由。意识到枷锁的虚幻，开始挣脱。", highlight: "羊角·锁链·倒五角星", imgUrl: "https://pic1.imgdb.cn/i/0345qqYLHJ3eoOkl1sfb79.jpg" },
    { id: 16, name: "高塔", emoji: "🏰", element: "火", number: "16", type: "major", age: "无常", role: "毁灭者", time: "深夜", mood: "崩溃", event: "颠覆", desc: "幻象崩塌。闪电击中王冠，坠落是唯一的清醒。", reverseDesc: "逃避毁灭，虚假安全。抗拒必要的改变，或逃避真相。", highlight: "闪电·高塔·王冠", imgUrl: "https://pic1.imgdb.cn/i/0345qqYKh8bSylx6ut7it0.jpg" },
    { id: 17, name: "星星", emoji: "⭐", element: "风", number: "17", type: "major", age: "青年", role: "疗愈者", time: "深夜", mood: "希望", event: "静默", desc: "倾倒生命之水。八芒星是指引，赤足踏在干涸与丰饶之间。", reverseDesc: "希望破灭，失去信心。理想主义受挫，或失去方向感。", highlight: "八芒星·水罐·大地", imgUrl: "https://pic1.imgdb.cn/i/0345qqYJKMjtpZ9b4010Y0.jpg" },
    { id: 18, name: "月亮", emoji: "🌙", element: "水", number: "18", type: "major", age: "中年", role: "守夜人", time: "子夜", mood: "恐惧", event: "潜行", desc: "潜意识潮汐。狼与犬代表驯服与野性，塔是心智边界。", reverseDesc: "恐惧消散，真相大白。面对潜意识，或从幻觉中清醒。", highlight: "龙虾·小径·塔", imgUrl: "https://pic1.imgdb.cn/i/0345qqYLxlbkpMsCrtEWQq.jpg" },
    { id: 19, name: "太阳", emoji: "☀️", element: "火", number: "19", type: "major", age: "儿童", role: "生命", time: "清晨", mood: "喜悦", event: "重生", desc: "赤裸的真理。太阳花与围墙，孩童骑在白马之上。", reverseDesc: "过度乐观，短暂喜悦。表面的快乐掩盖深层问题。", highlight: "太阳·孩童·白马·向日葵", imgUrl: "https://pic1.imgdb.cn/i/0345qpnVvz0JuAawJK0WVG.jpg" },
    { id: 20, name: "审判", emoji: "📯", element: "火", number: "20", type: "major", age: "中年", role: "觉醒者", time: "黎明", mood: "召唤", event: "觉醒", desc: "终极召唤。号角吹响，棺中之人缓缓起身。", reverseDesc: "自我怀疑，拒绝召唤。害怕改变，或逃避内心的呼唤。", highlight: "天使·号角·棺材", imgUrl: "https://pic1.imgdb.cn/i/0345qpnqn6rAGCGIs5E1bi.jpg" },
    { id: 21, name: "世界", emoji: "🌍", element: "土", number: "21", type: "major", age: "圆满", role: "完成者", time: "永恒", mood: "完整", event: "成就", desc: "圆融归一。四角元素环绕，中央是舞动的生命。", reverseDesc: "未完成，延迟成就。缺乏 closure，或逃避完成的责任。", highlight: "花环·四兽", imgUrl: "https://pic1.imgdb.cn/i/0345qpnTmuAGgkU7YslLeJ.jpg" },
    { id: 22, name: "权杖Ace", emoji: "🔥", element: "火", number: "A", type: "wands", age: "开端", role: "行动者", time: "黎明", mood: "激情", event: "启动", desc: "火焰之种。云中伸出权杖，新行动正在发芽。", reverseDesc: "错失良机，能量受阻。创意被压抑，或行动被延迟。", highlight: "云手·权杖·城堡", imgUrl: "https://pic1.imgdb.cn/i/0346qZtft1Lldqeo6Rss7K.heif" },
    { id: 23, name: "权杖二", emoji: "⚡", element: "火", number: "2", type: "wands", age: "青年", role: "决策者", time: "清晨", mood: "抉择", event: "计划", desc: "视野与选择。手握地球，远眺海平线。", reverseDesc: "恐惧改变，犹豫不决。害怕离开舒适区，或过度分析。", highlight: "权杖·地球·城墙", imgUrl: "https://pic1.imgdb.cn/i/0346qZuAso9UWQ9rOCrWRv.heif" },
    { id: 24, name: "权杖三", emoji: "⛵", element: "火", number: "3", type: "wands", age: "壮年", role: "探索者", time: "正午", mood: "远征", event: "出发", desc: "扬帆起航。三根权杖立成港口，船队等待潮汐。", reverseDesc: "延迟出发，团队不和。计划受阻，或团队合作出现问题。", highlight: "权杖·船·海", imgUrl: "https://pic1.imgdb.cn/i/0346qZujCPrOPddlFWkNcJ.heif" },
    { id: 25, name: "权杖四", emoji: "🏠", element: "火", number: "4", type: "wands", age: "成年", role: "定居者", time: "黄昏", mood: "庆祝", event: "扎根", desc: "家园与欢庆。四根权杖撑起花环，根基已稳。", reverseDesc: "家庭不和，缺乏支持。庆祝变成冲突，或离开舒适区。", highlight: "花环·权杖·城堡", imgUrl: "https://pic1.imgdb.cn/i/0346qZuuJK9Zu9gSStAK02.heif" },
    { id: 26, name: "权杖五", emoji: "⚔️", element: "火", number: "5", type: "wands", age: "青年", role: "竞争者", time: "午后", mood: "冲突", event: "对抗", desc: "竞争之火。五根权杖交织，冲突是成长的代价。", reverseDesc: "避免冲突，内部不和。逃避竞争，或冲突在暗中进行。", highlight: "权杖·争斗·城堡", imgUrl: "https://pic1.imgdb.cn/i/0346qZuN4TVjUSN47jrgO8.heif" },
    { id: 27, name: "权杖六", emoji: "🏆", element: "火", number: "6", type: "wands", age: "壮年", role: "胜利者", time: "正午", mood: "荣耀", event: "凯旋", desc: "胜利的游行。骑士头戴花环，权杖高举。", reverseDesc: "骄傲自满，延迟胜利。过度自信导致失败，或胜利被推迟。", highlight: "花环·权杖·马", imgUrl: "https://pic1.imgdb.cn/i/0346qZw1QWSHNU65EvXg9g.heif" },
    { id: 28, name: "权杖七", emoji: "🛡️", element: "火", number: "7", type: "wands", age: "成年", role: "防御者", time: "黄昏", mood: "坚持", event: "抵抗", desc: "孤军奋战。一人持杖对抗六杖，勇气是最后的武器。", reverseDesc: "放弃抵抗，不堪重负。放弃立场，或无法应对挑战。", highlight: "权杖·山顶·防御", imgUrl: "https://pic1.imgdb.cn/i/0346qZw03qk9rszS2I1aGF.heif" },
    { id: 29, name: "权杖八", emoji: "⚡", element: "火", number: "8", type: "wands", age: "壮年", role: "行动者", time: "清晨", mood: "迅速", event: "进展", desc: "疾速前行。八根权杖破空，momentum不可阻挡。", reverseDesc: "延迟阻碍，混乱无序。行动受阻，或过度匆忙导致错误。", highlight: "权杖·速度", imgUrl: "https://pic1.imgdb.cn/i/0346qZw8vwFG8vmktrFGYI.heif" },
    { id: 30, name: "权杖九", emoji: "🛡️", element: "火", number: "9", type: "wands", age: "中年", role: "幸存者", time: "深夜", mood: "警觉", event: "防御", desc: "伤痕累累。战士紧抓权杖，最后一战即将来临。", reverseDesc: "精疲力竭，放弃防御。过度防御导致疲惫，或准备不足。", highlight: "权杖·绷带·防御", imgUrl: "https://pic1.imgdb.cn/i/0346qZw8vimOWED5GPXz9A.heif" },
    { id: 31, name: "权杖十", emoji: "🏋️", element: "火", number: "10", type: "wands", age: "壮年", role: "负重者", time: "黄昏", mood: "压力", event: "承担", desc: "重负前行。十根权杖压弯脊背，责任是成长的代价。", reverseDesc: "不堪重负，拒绝责任。无法承担，或过度承担导致崩溃。", highlight: "权杖·重压·前行", imgUrl: "https://pic1.imgdb.cn/i/0346qZwEIBbprMOkU3fpgI.heif" },
    { id: 32, name: "权杖侍从", emoji: "📜", element: "火", number: "侍从", type: "wands", age: "少年", role: "信使", time: "清晨", mood: "好奇", event: "消息", desc: "热情的信使。年轻侍从带来新消息与可能性。", reverseDesc: "消息延迟，缺乏方向。冲动行事，或消息不准确。", highlight: "权杖·卷轴", imgUrl: "https://pic1.imgdb.cn/i/0346rCYymNICw5rn654sSU.heif" },
    { id: 33, name: "权杖骑士", emoji: "🐴", element: "火", number: "骑士", type: "wands", age: "青年", role: "冒险者", time: "正午", mood: "冲动", event: "行动", desc: "冲动的骑士。火焰般热情，行动先于思考。", reverseDesc: "鲁莽冲动，失控愤怒。行动过于急躁，或失去控制。", highlight: "权杖·马", imgUrl: "https://pic1.imgdb.cn/i/0346rCbxV80dSypyXNvPmF.heif" },
    { id: 34, name: "权杖王后", emoji: "👑", element: "火", number: "王后", type: "wands", age: "成年", role: "统治者", time: "午后", mood: "自信", event: "领导", desc: "火焰女王。自信而热情，黑猫是她神秘的伙伴。", reverseDesc: "专横霸道，嫉妒控制。过度强势，或情绪失控。", highlight: "权杖·黑猫", imgUrl: "https://pic1.imgdb.cn/i/0346rCd9gcrRSajW974D3e.heif" },
    { id: 35, name: "权杖国王", emoji: "🤴", element: "火", number: "国王", type: "wands", age: "中年", role: "领袖", time: "正午", mood: "权威", event: "统治", desc: "火焰之王。成熟的领导力，狮子彰显威严。", reverseDesc: "暴虐专制，冲动易怒。滥用权力，或失去控制。", highlight: "权杖·狮子", imgUrl: "https://pic1.imgdb.cn/i/0346rCdWb1tW3G6CUX4Bqe.heif" },
    { id: 36, name: "圣杯Ace", emoji: "🌊", element: "水", number: "A", type: "cups", age: "开端", role: "感受者", time: "黎明", mood: "情感", event: "涌现", desc: "情感之源。云中涌出五道水流，爱如泉涌。", reverseDesc: "情感阻塞，错失爱。情感被压抑，或机会被错过。", highlight: "圣杯·云手·鸽子", imgUrl: "https://pic1.imgdb.cn/i/0346qgdF2mXzsGaMUGpdSn.heif" },
    { id: 37, name: "圣杯二", emoji: "💕", element: "水", number: "2", type: "cups", age: "青年", role: "伴侣", time: "清晨", mood: "和谐", event: "结合", desc: "灵魂伴侣。两杯相交，赫尔墨斯之杖在中间。", reverseDesc: "关系失衡，分离不和。合作破裂，或情感不匹配。", highlight: "双杯·赫尔墨斯之杖", imgUrl: "https://pic1.imgdb.cn/i/0346qgdGPZCUBf1f9E4J8Y.heif" },
    { id: 38, name: "圣杯三", emoji: "🎉", element: "水", number: "3", type: "cups", age: "成年", role: "庆祝者", time: "正午", mood: "欢乐", event: "团聚", desc: "欢庆时刻。三女子举杯，丰收与友谊。", reverseDesc: "过度放纵，表面欢乐。虚假的庆祝，或友谊破裂。", highlight: "三杯·舞蹈·丰收", imgUrl: "https://pic1.imgdb.cn/i/0346qgcYFfJdBMjzeBYrFv.heif" },
    { id: 39, name: "圣杯四", emoji: "😔", element: "水", number: "4", type: "cups", age: "青年", role: "沉思者", time: "午后", mood: "倦怠", event: "失望", desc: "情感倦怠。青年无视第四杯，冷漠是心灵的寒冬。", reverseDesc: "新的开始，接受机会。走出倦怠，重新投入生活。", highlight: "树下·四杯", imgUrl: "https://pic1.imgdb.cn/i/0346qgcQY49EQm7cXTDa2k.heif" },
    { id: 40, name: "圣杯五", emoji: "😢", element: "水", number: "5", type: "cups", age: "壮年", role: "哀悼者", time: "黄昏", mood: "悲伤", event: "失去", desc: "失落之痛。三杯倾倒，但身后两杯仍站立。", reverseDesc: "走出悲伤，看到希望。接受失去，重新找到快乐。", highlight: "三杯·桥", imgUrl: "https://pic1.imgdb.cn/i/0346qgcFFBUJS6VlRrPGFy.heif" },
    { id: 41, name: "圣杯六", emoji: "🌸", element: "水", number: "6", type: "cups", age: "儿童", role: "回忆者", time: "清晨", mood: "怀旧", event: "回忆", desc: "童年回忆。孩童互赠花朵，纯真年代。", reverseDesc: "困于过去，无法前进。过度怀旧，或童年阴影。", highlight: "孩童·花朵·城堡", imgUrl: "https://pic1.imgdb.cn/i/0346qgdGDWDmVELgAWDm8O.heif" },
    { id: 42, name: "圣杯七", emoji: "🌈", element: "水", number: "7", type: "cups", age: "青年", role: "梦想家", time: "午后", mood: "幻想", event: "选择", desc: "幻象之杯。七杯浮现不同幻象，选择是甜蜜的陷阱。", reverseDesc: "面对现实，做出选择。看清幻象，做出决定。", highlight: "七杯·云", imgUrl: "https://pic1.imgdb.cn/i/0346qgdNQh2OiZ4xOmW4iP.heif" },
    { id: 43, name: "圣杯八", emoji: "🚶", element: "水", number: "8", type: "cups", age: "壮年", role: "离开者", time: "黄昏", mood: "失望", event: "离去", desc: "悄然离去。放下八杯，追寻更高的意义。", reverseDesc: "逃避问题，放弃努力。放弃得太早，或逃避责任。", highlight: "八杯·月", imgUrl: "https://pic1.imgdb.cn/i/0346qgdVoB9QrzFlv0mAxe.heif" },
    { id: 44, name: "圣杯九", emoji: "😊", element: "水", number: "9", type: "cups", age: "成年", role: "满足者", time: "夜晚", mood: "满足", event: "实现", desc: "愿望达成。九杯整齐排列，满足写在脸上。", reverseDesc: "虚假满足，内在空虚。表面的快乐掩盖深层不满。", highlight: "九杯", imgUrl: "https://pic1.imgdb.cn/i/0346qge4W5iHX55d4lMMM0.heif" },
    { id: 45, name: "圣杯十", emoji: "👨‍👩‍👧‍👦", element: "水", number: "10", type: "cups", age: "圆满", role: "幸福者", time: "正午", mood: "幸福", event: "圆满", desc: "家庭幸福。十杯彩虹之下，家庭是爱的港湾。", reverseDesc: "家庭不和，关系破裂。家庭问题，或理想化破灭。", highlight: "彩虹·十杯·家庭", imgUrl: "https://pic1.imgdb.cn/i/0346qge6GjCDzLVRjKb9RD.heif" },
    { id: 46, name: "圣杯侍从", emoji: "🐟", element: "水", number: "侍从", type: "cups", age: "少年", role: "梦想家", time: "清晨", mood: "浪漫", event: "幻想", desc: "浪漫的梦想家。侍从凝视杯中的鱼，想象力无限。", reverseDesc: "情感不成熟，逃避现实。过度幻想，或情感依赖。", highlight: "鱼·蝴蝶", imgUrl: "https://pic1.imgdb.cn/i/0346r2HrbE4jVj7u7EbCbi.heif" },
    { id: 47, name: "圣杯骑士", emoji: "🐚", element: "水", number: "骑士", type: "cups", age: "青年", role: "追求者", time: "午后", mood: "浪漫", event: "追求", desc: "浪漫骑士。手持圣杯，追求心灵的理想。", reverseDesc: "情感逃避，承诺恐惧。害怕承诺，或情感不稳定。", highlight: "圣杯·贝壳·马", imgUrl: "https://pic1.imgdb.cn/i/0346r2I7CFkugjlB0nFq6i.heif" },
    { id: 48, name: "圣杯王后", emoji: "🦀", element: "水", number: "王后", type: "cups", age: "成年", role: "关怀者", time: "黄昏", mood: "温柔", event: "滋养", desc: "温柔女王。情感深邃如海，螃蟹是她的象征。", reverseDesc: "情绪失控，过度敏感。被情绪淹没，或情感操纵。", highlight: "圣杯·螃蟹", imgUrl: "https://pic1.imgdb.cn/i/0346r2IAbTrolGIgh5KdUv.heif" },
    { id: 49, name: "圣杯国王", emoji: "🚢", element: "水", number: "国王", type: "cups", age: "中年", role: "掌控者", time: "夜晚", mood: "平静", event: "掌控", desc: "情感之主。成熟掌控情感，船象征稳定。", reverseDesc: "情感压抑，操纵控制。情感冷漠，或操纵他人情感。", highlight: "圣杯·船", imgUrl: "https://pic1.imgdb.cn/i/0346r2IAnq05GLhPNqbkKA.heif" },
    { id: 50, name: "宝剑Ace", emoji: "⚔️", element: "风", number: "A", type: "swords", age: "开端", role: "思想者", time: "黎明", mood: "清晰", event: "突破", desc: "思想之剑。云中伸出宝剑，王冠是心智的胜利。", reverseDesc: "混乱思维，错误决定。思维受阻，或判断失误。", highlight: "宝剑·云手·王冠", imgUrl: "https://pic1.imgdb.cn/i/0346qnsnv2S4VewtYm0pA4.heif" },
    { id: 51, name: "宝剑二", emoji: "⚔️", element: "风", number: "2", type: "swords", age: "青年", role: "抉择者", time: "夜晚", mood: "犹豫", event: "僵持", desc: "艰难抉择。蒙眼持剑，僵持是暂时的平衡。", reverseDesc: "真相大白，做出决定。打破僵局，或看清真相。", highlight: "蒙眼·双剑·月亮", imgUrl: "https://pic1.imgdb.cn/i/0346qnkV8EFylMsPsGu53O.heif" },
    { id: 52, name: "宝剑三", emoji: "💔", element: "风", number: "3", type: "swords", age: "壮年", role: "受伤者", time: "深夜", mood: "痛苦", event: "心碎", desc: "心碎之痛。三剑刺穿红心，风暴是情感的洗礼。", reverseDesc: "走出痛苦，开始愈合。接受失去，或原谅他人。", highlight: "心脏·三剑·雨", imgUrl: "https://pic1.imgdb.cn/i/0346qnh7k9seumEHOu17t4.heif" },
    { id: 53, name: "宝剑四", emoji: "🛌", element: "风", number: "4", type: "swords", age: "成年", role: "休息者", time: "清晨", mood: "平静", event: "恢复", desc: "休憩恢复。四剑悬挂，静卧是战后的宁静。", reverseDesc: "无法休息，焦虑不安。拒绝休息，或过度焦虑。", highlight: "四剑·教堂·休息", imgUrl: "https://pic1.imgdb.cn/i/0346qndTCGVWOQTxzgn6kb.heif" },
    { id: 54, name: "宝剑五", emoji: "🏃", element: "风", number: "5", type: "swords", age: "青年", role: "胜利者", time: "黄昏", mood: "空虚", event: "争斗", desc: "空洞胜利。胜者回望败者，代价是孤独。", reverseDesc: "和解宽恕，放弃争斗。承认失败，或寻求和解。", highlight: "五剑", imgUrl: "https://pic1.imgdb.cn/i/0346qnakeq4d0ESUQ3UKkM.heif" },
    { id: 55, name: "宝剑六", emoji: "🚣", element: "风", number: "6", type: "swords", age: "壮年", role: "旅行者", time: "清晨", mood: "疗愈", event: "过渡", desc: "疗愈之旅。驶向平静水域，带着过去的伤痛前行。", reverseDesc: "无法前进，困于过去。拒绝疗愈，或无法放下。", highlight: "船·六剑·过渡", imgUrl: "https://pic1.imgdb.cn/i/0346qnqzictM9VucDpc0xi.heif" },
    { id: 56, name: "宝剑七", emoji: "🗡️", element: "风", number: "7", type: "swords", age: "青年", role: "策略者", time: "夜晚", mood: "隐秘", event: "谋略", desc: "隐秘行动。偷偷带走五剑，留下两把。", reverseDesc: "策略失败，被识破。欺骗被揭穿，或策略失误。", highlight: "五剑·帐篷·策略", imgUrl: "https://pic1.imgdb.cn/i/0346qnt3oKfJb6suCi1V4V.heif" },
    { id: 57, name: "宝剑八", emoji: "⛓️", element: "风", number: "8", type: "swords", age: "成年", role: "困缚者", time: "深夜", mood: "束缚", event: "困境", desc: "自我束缚。蒙眼困于剑阵，但脚未被绑。", reverseDesc: "打破束缚，重获自由。意识到枷锁的虚幻，开始挣脱。", highlight: "八剑·蒙眼", imgUrl: "https://pic1.imgdb.cn/i/0346qnt6FPciFvYvY2jI5d.heif" },
    { id: 58, name: "宝剑九", emoji: "😰", element: "风", number: "9", type: "swords", age: "壮年", role: "焦虑者", time: "深夜", mood: "恐惧", event: "噩梦", desc: "噩梦惊醒。焦虑是心灵的牢笼，九剑悬挂床头。", reverseDesc: "恐惧消散，找到希望。面对恐惧，或寻求帮助。", highlight: "九剑·噩梦", imgUrl: "https://pic1.imgdb.cn/i/0346qntN6ooTr5qz7qs9Wk.heif" },
    { id: 59, name: "宝剑十", emoji: "⚰️", element: "风", number: "10", type: "swords", age: "壮年", role: "终结者", time: "黎明", mood: "结束", event: "终结", desc: "终结之痛。十剑刺穿背影，但也意味着新的开始。", reverseDesc: "绝处逢生，开始恢复。从最低点开始回升，或找到新方向。", highlight: "十剑", imgUrl: "https://pic1.imgdb.cn/i/0346qnuikZ0cXv9coFYMff.heif" },
    { id: 60, name: "宝剑侍从", emoji: "📨", element: "风", number: "侍从", type: "swords", age: "少年", role: "侦察兵", time: "清晨", mood: "好奇", event: "刺探", desc: "好奇的侦察兵。刺探新消息，带来真相。", reverseDesc: "八卦流言，缺乏专注。传播谣言，或注意力分散。", highlight: "宝剑·消息", imgUrl: "https://pic1.imgdb.cn/i/0346qzBon08cdZdHcWH0DW.heif" },
    { id: 61, name: "宝剑骑士", emoji: "⚡", element: "风", number: "骑士", type: "swords", age: "青年", role: "冲锋者", time: "正午", mood: "激进", event: "冲锋", desc: "风暴骑士。冲锋陷阵毫不犹豫，如风般迅疾。", reverseDesc: "冲动鲁莽，言语伤人。行动过于激进，或言语攻击。", highlight: "宝剑·风暴", imgUrl: "https://pic1.imgdb.cn/i/0346qzBme80EmhLsAfgaTt.heif" },
    { id: 62, name: "宝剑王后", emoji: "👁️", element: "风", number: "王后", type: "swords", age: "成年", role: "洞察者", time: "深夜", mood: "通透", event: "洞察", desc: "通透女王。手举真理之剑，看透一切虚妄。", reverseDesc: "冷酷无情，过度批判。缺乏同情心，或过于严苛。", highlight: "宝剑·手·真理", imgUrl: "https://pic1.imgdb.cn/i/0346qzBQE5EG0QjOqKYv9H.heif" },
    { id: 63, name: "宝剑国王", emoji: "⚖️", element: "风", number: "国王", type: "swords", age: "中年", role: "裁决者", time: "正午", mood: "公正", event: "裁决", desc: "理性之主。公正裁决一切，思维清晰如剑。", reverseDesc: "滥用权力，冷酷专制。独裁统治，或缺乏公正。", highlight: "宝剑·裁决", imgUrl: "https://pic1.imgdb.cn/i/0346qzAUDyncElYGN14UUE.heif" },
    { id: 64, name: "星币Ace", emoji: "💰", element: "土", number: "A", type: "pentacles", age: "开端", role: "创造者", time: "黎明", mood: "机遇", event: "种子", desc: "财富之种。云中手捧金币，新机遇降临。", reverseDesc: "错失良机，财务损失。机会被错过，或投资失败。", highlight: "星币·云手", imgUrl: "https://pic1.imgdb.cn/i/0346qvh4BKgUyPKyfjDls9.heif" },
    { id: 65, name: "星币二", emoji: "🤹", element: "土", number: "2", type: "pentacles", age: "青年", role: "平衡者", time: "清晨", mood: "波动", event: "平衡", desc: "平衡之道。在波动中保持节奏，如杂耍般 juggling。", reverseDesc: "失衡混乱，过度承诺。无法平衡，或承担过多。", highlight: "星币·波浪·平衡", imgUrl: "https://pic1.imgdb.cn/i/0346qveWwuVElMfNgL6HWQ.heif" },
    { id: 66, name: "星币三", emoji: "🏛️", element: "土", number: "3", type: "pentacles", age: "壮年", role: "工匠", time: "正午", mood: "专注", event: "合作", desc: "技艺精进。工匠在教堂雕刻，专注与合作。", reverseDesc: "缺乏技能，团队合作差。技艺不足，或团队不和。", highlight: "工匠·教堂·技艺", imgUrl: "https://pic1.imgdb.cn/i/0346qvgB0p5gwFuMplkp2M.heif" },
    { id: 67, name: "星币四", emoji: "🤲", element: "土", number: "4", type: "pentacles", age: "成年", role: "守财者", time: "黄昏", mood: "固守", event: "保守", desc: "固守财富。紧抓金币不放，害怕失去。", reverseDesc: "慷慨分享，放手控制。学会分享，或放下执念。", highlight: "星币·金币", imgUrl: "https://pic1.imgdb.cn/i/0346qvOpbxSW9VTLACd555.heif" },
    { id: 68, name: "星币五", emoji: "🥶", element: "土", number: "5", type: "pentacles", age: "壮年", role: "困境者", time: "深夜", mood: "艰难", event: "困境", desc: "物质困境。风雪中的教堂，寻求帮助。", reverseDesc: "走出困境，获得帮助。困难结束，或得到援助。", highlight: "风雪·教堂·困境", imgUrl: "https://pic1.imgdb.cn/i/0346qvRd1gbkmYEW48Dd3P.heif" },
    { id: 69, name: "星币六", emoji: "🎁", element: "土", number: "6", type: "pentacles", age: "成年", role: "施予者", time: "正午", mood: "慷慨", event: "馈赠", desc: "给予与接受。商人的慷慨，天平衡量。", reverseDesc: "债务负担，不平等交换。过度给予，或债务问题。", highlight: "天平·给予", imgUrl: "https://pic1.imgdb.cn/i/0346qvVyx0YKr91BO7mv74.heif" },
    { id: 70, name: "星币七", emoji: "🌱", element: "土", number: "7", type: "pentacles", age: "壮年", role: "耕耘者", time: "午后", mood: "期待", event: "等待", desc: "耕耘等待。果实即将成熟，耐心等待收获。", reverseDesc: "缺乏耐心，投资失误。急于求成，或投资失败。", highlight: "果实·耕耘", imgUrl: "https://pic1.imgdb.cn/i/0346qvcRt8F2YOqKjR68PX.heif" },
    { id: 71, name: "星币八", emoji: "🔨", element: "土", number: "8", type: "pentacles", age: "壮年", role: "学徒", time: "清晨", mood: "勤奋", event: "精进", desc: "专注技艺。工匠打磨星币，日复一日。", reverseDesc: "缺乏专注，技能不足。敷衍了事，或技艺不精。", highlight: "工匠·打磨·勤奋", imgUrl: "https://pic1.imgdb.cn/i/0346qvcMub423jtGZgdLHa.heif" },
    { id: 72, name: "星币九", emoji: "🦚", element: "土", number: "9", type: "pentacles", age: "成年", role: "享受者", time: "午后", mood: "满足", event: "享受", desc: "独立富足。果园中的优雅，孔雀开屏。", reverseDesc: "依赖他人，失去独立。过度依赖，或财务问题。", highlight: "果园·孔雀·优雅", imgUrl: "https://pic1.imgdb.cn/i/0346qvh1YEnwGOqceaS0qw.heif" },
    { id: 73, name: "星币十", emoji: "👨‍👩‍👧‍👦", element: "土", number: "10", type: "pentacles", age: "圆满", role: "传承者", time: "正午", mood: "传承", event: "legacy", desc: "家族传承。世代积累的财富，家族城堡。", reverseDesc: "家庭不和，财务损失。家族问题，或继承纠纷。", highlight: "家族·城堡·传承", imgUrl: "https://pic1.imgdb.cn/i/0346qvgzJNPohikCYongfK.heif" },
    { id: 74, name: "星币侍从", emoji: "📚", element: "土", number: "侍从", type: "pentacles", age: "少年", role: "学习者", time: "清晨", mood: "好学", event: "学习", desc: "勤奋学徒。专注学习技艺，书本与星币。", reverseDesc: "缺乏动力，机会错失。学习懈怠，或机会错过。", highlight: "星币·书本", imgUrl: "https://pic1.imgdb.cn/i/0346r4It7LMiA4DGICyGI0.heif" },
    { id: 75, name: "星币骑士", emoji: "🐢", element: "土", number: "骑士", type: "pentacles", age: "青年", role: "执行者", time: "午后", mood: "稳健", event: "执行", desc: "稳健骑士。脚踏实地前行，不急不躁。", reverseDesc: "固执僵化，缺乏灵活。过于保守，或拒绝改变。", highlight: "星币·稳健", imgUrl: "https://pic1.imgdb.cn/i/0346r4IpzzVO7FDZvZdq6t.heif" },
    { id: 76, name: "星币王后", emoji: "🐇", element: "土", number: "王后", type: "pentacles", age: "成年", role: "滋养者", time: "午后", mood: "丰饶", event: "滋养", desc: "丰饶女王。手抚兔子坐于花园，大地之母。", reverseDesc: "过度依赖，物质主义。过于物质化，或失去自然连接。", highlight: "星币·兔子·花园", imgUrl: "https://pic1.imgdb.cn/i/0346r4IpPol8S3SnvflNHj.heif" },
    { id: 77, name: "星币国王", emoji: "👑", element: "土", number: "国王", type: "pentacles", age: "中年", role: "掌控者", time: "正午", mood: "权威", event: "掌控", desc: "财富之主。成熟掌控物质，王座稳固。", reverseDesc: "贪婪腐败，物质至上。过度追求物质，或财务腐败。", highlight: "星币·财富", imgUrl: "https://pic1.imgdb.cn/i/0346r4IV2k2pmmYMXSnxc8.heif" }
];
// 吉普赛之眼 · 模块化核心逻辑 (第三部分：符号库与基础UI绑定)

// ---------- 符号库 ----------
const tarotSymbols = [
    { type: '关联库', symbol: '白马', cards: ['死神', '太阳'], meaning: '死亡与新生，同一匹马跨越生命周期两端' },
    { type: '关联库', symbol: '高塔', cards: ['高塔', '月亮'], meaning: '同一座尖顶石塔，显与隐的边界' },
    { type: '关联库', symbol: '旗帜', cards: ['死神', '太阳'], meaning: '同款旗帜，宣告终结与生命欢庆' },
    { type: '关联库', symbol: '玫瑰', cards: ['愚人', '死神', '魔术师'], meaning: '同种玫瑰（白/红），纯真→终结→创造' },
    { type: '关联库', symbol: '天使', cards: ['恋人', '审判', '节制'], meaning: '同一位神圣信使，神意介入人间' },
    { type: '关联库', symbol: '狮子', cards: ['力量', '权杖国王', '权杖王后'], meaning: '同一狮子/狮头装饰，驯服的原始力量' },
    { type: '关联库', symbol: '蛇', cards: ['恋人', '圣杯二'], meaning: '同一条蛇，智慧与关系的张力' },
    { type: '关联库', symbol: '向日葵', cards: ['太阳', '权杖王后'], meaning: '同一株向日葵，追随光明' },
    { type: '关联库', symbol: '百合', cards: ['魔术师', '皇后'], meaning: '同一朵白百合，纯洁与滋养' },
    { type: '关联库', symbol: '花环/桂冠', cards: ['力量', '世界', '权杖六', '宝剑Ace'], meaning: '同款胜利花环，成就与荣耀' },
    { type: '关联库', symbol: '王冠（十字顶）', cards: ['皇帝', '死神'], meaning: '同款十字顶王冠，世俗权威的终结' },
    { type: '关联库', symbol: '王冠（圆顶）', cards: ['皇后', '权杖王后'], meaning: '同款圆顶金冠，阴性滋养型王权' },
    { type: '关联库', symbol: '王冠（尖顶/三重冠）', cards: ['教皇', '战车'], meaning: '同款三重冠，精神与世俗结合' },
    { type: '关联库', symbol: '王冠（星冠）', cards: ['战车', '星星'], meaning: '同款星冠，宇宙指引与胜利' },
    { type: '关联库', symbol: '帆船', cards: ['权杖三', '星币二', '圣杯国王', '宝剑六'], meaning: '同款帆船，旅程与过渡' },
    { type: '关联库', symbol: '天平', cards: ['正义', '星币六'], meaning: '同款天平，公正与平衡' },
    { type: '关联库', symbol: '无限符号', cards: ['魔术师', '星币二', '力量'], meaning: '∞，无限潜能与永恒循环' },
    { type: '素材库', symbol: '山脉', cards: ['愚人', '隐士', '恋人', '皇帝', '节制', '审判', '权杖侍从', '权杖骑士', '星币Ace', '星币侍从'], meaning: '险阻、远方、蓄势、超越' },
    { type: '素材库', symbol: '河流/水流', cards: ['皇后', '节制', '月亮', '审判', '圣杯Ace', '圣杯八', '圣杯骑士'], meaning: '潜意识流动、过渡、远方' },
    { type: '素材库', symbol: '小径', cards: ['愚人', '隐士', '月亮', '节制'], meaning: '人生道路、追寻' },
    { type: '素材库', symbol: '海/浪', cards: ['宝剑二', '星币二'], meaning: '情感起伏、潜意识波动' },
    { type: '素材库', symbol: '太阳', cards: ['太阳', '恋人', '死神', '节制'], meaning: '意识、生命之源、启迪' },
    { type: '素材库', symbol: '月亮', cards: ['女祭司', '月亮', '圣杯八'], meaning: '直觉、潜意识、暗中之光' },
    { type: '素材库', symbol: '星星', cards: ['星星', '战车', '皇后'], meaning: '希望、指引、天命' },
    { type: '素材库', symbol: '云', cards: ['愚人', '审判', '圣杯四', '圣杯七', '宝剑侍从', '宝剑骑士'], meaning: '思绪、迷雾、神圣遮蔽' },
    { type: '素材库', symbol: '城堡', cards: ['权杖Ace', '权杖二', '权杖四', '圣杯五', '圣杯六', '星币四', '星币十', '星币国王'], meaning: '安全感、归宿、成就' }
];

// ---------- 基础UI绑定逻辑（原版） ----------
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    bindEvents();
    renderGrid();
    renderHistory();
    checkDailyCard();

    // 牌阵默认
    document.querySelectorAll('.spread-selector .btn').forEach(b => {
        b.addEventListener('click', function() {
            document.querySelectorAll('.spread-selector .btn').forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            currentSpread = this.dataset.spread;
            const def = SPREAD_DEFS[currentSpread];
            document.getElementById('spreadCount').textContent = def.count + ' 张';
            document.getElementById('spreadResult').innerHTML = '';
            document.getElementById('spreadInterp').style.display = 'none';
        });
    });
    document.querySelector('.spread-selector .btn')?.classList.add('active');
    const def = SPREAD_DEFS['three'];
    document.getElementById('spreadCount').textContent = def.count + ' 张';
});

function initParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 15 + 's';
        p.style.animationDuration = (10 + Math.random() * 10) + 's';
        container.appendChild(p);
    }
}

function bindEvents() {
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchView(view);
        });
    });
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            setFilter(filter);
        });
    });
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => renderGrid(), 300);
    });
    document.getElementById('deck').addEventListener('click', drawCard);
    document.getElementById('spreadDeck').addEventListener('click', drawSpread);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal')) closeModal();
    });
    document.getElementById('favoriteBtn').addEventListener('click', toggleFavorite);
    document.getElementById('shareBtn').addEventListener('click', shareCard);
    document.getElementById('modalNote').addEventListener('blur', saveNote);
    document.getElementById('dailyBtn').addEventListener('click', showDailyCard);
    document.querySelectorAll('.library-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            document.querySelectorAll('.library-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.library-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById('lib-' + tabName);
            if (target) target.classList.add('active');
        });
    });
    document.getElementById('libraryModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('libraryModal')) closeLibrary();
    });
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(view + 'View').classList.add('active');
    if (view === 'history') renderHistory();
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderGrid();
}
// 吉普赛之眼 · 模块化核心逻辑 (第四部分：完整交互逻辑 + AI精灵)

// ===== 牌库渲染与详情 =====
function renderGrid() {
    const grid = document.getElementById('cardGrid');
    let cards = TAROT_DATA;
    if (currentFilter !== 'all') {
        cards = cards.filter(c => c.type === currentFilter);
    }
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        cards = cards.filter(c => c.name.toLowerCase().includes(searchTerm));
    }
    grid.innerHTML = cards.map(card => {
        const isFav = favorites.includes(card.id);
        const dual = getDualElements(card);
        const elementHtml = dual.secondary ?
            `<div class="card-elements"><span class="element-tag element-${ELEMENT_MAP[dual.primary].class}">${ELEMENT_MAP[dual.primary].icon}</span><span class="element-tag element-${ELEMENT_MAP[dual.secondary].class}">${ELEMENT_MAP[dual.secondary].icon}</span></div>` :
            `<div class="card-elements"><span class="element-tag element-${ELEMENT_MAP[dual.primary].class}">${ELEMENT_MAP[dual.primary].icon} ${dual.primary}</span></div>`;
        return `
            <div class="card ${isFav ? 'favorite' : ''}" onclick="openCard(${card.id})">
                <div class="card-img">
                    <img src="${card.imgUrl}" alt="${card.name}" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'card-emoji\\'>${card.emoji}</span>'">
                </div>
                <div class="card-name">${card.name}</div>${elementHtml}
            </div>`;
    }).join('');
}

function openCard(id, isReversed = false) {
    currentPosition = isReversed ? "reversed" : "upright";
    currentCard = TAROT_DATA.find(c => c.id === id);
    if (!currentCard) return;
    const img = document.getElementById('modalImg');
    img.src = currentCard.imgUrl;
    img.onerror = function() {
        this.style.display = 'none';
        this.parentElement.innerHTML = `<div style="font-size:5rem;text-align:center;padding:2rem;">${currentCard.emoji}</div>`;
    };
    img.style.display = 'block';
    renderElementDisplay(currentCard);
    document.getElementById('modalTitle').innerHTML = `${currentCard.emoji} ${currentCard.name}`;
    document.getElementById('modalInfo').innerHTML = `
        <div class="info-item"><div class="info-label">元素</div>${currentCard.element}</div>
        <div class="info-item"><div class="info-label">数字</div>${currentCard.number}</div>
        <div class="info-item"><div class="info-label">类别</div>${getTypeName(currentCard.type)}</div>
        <div class="info-item"><div class="info-label">视觉焦点</div>${currentCard.highlight}</div>`;
    switchPosition(currentPosition);
    const favBtn = document.getElementById('favoriteBtn');
    favBtn.textContent = favorites.includes(currentCard.id) ? '★ 已收藏' : '☆ 收藏';
    favBtn.classList.toggle('active', favorites.includes(currentCard.id));
    document.getElementById('modalNote').value = notes[currentCard.id] || '';
    document.getElementById('modal').classList.add('active');
    renderRelatedCards(currentCard);
    // 设置AI精灵上下文
    setSpiritContext(`当前牌面：${currentCard.name}（${currentPosition === 'reversed' ? '逆位' : '正位'}）。元素：${currentCard.element}。画面符号：${currentCard.highlight}`);
}

function renderElementDisplay(card) {
    const dual = getDualElements(card);
    let html = '<h4>🔮 元素构成</h4>';
    if (dual.secondary) {
        html += `<div class="element-pair">
            <div class="element-box element-${ELEMENT_MAP[dual.primary].class}">${ELEMENT_MAP[dual.primary].icon} 主元素：${dual.primary}</div>
            <span style="color:var(--text2)">+</span>
            <div class="element-box element-${ELEMENT_MAP[dual.secondary].class}">${ELEMENT_MAP[dual.secondary].icon} 次元素：${dual.secondary}</div>
        </div>
        <div class="element-mix-desc">${getMixElementDesc(dual.primary, dual.secondary)}</div>`;
    } else {
        html += `<div class="element-pair"><div class="element-box element-${ELEMENT_MAP[dual.primary].class}">${ELEMENT_MAP[dual.primary].icon} ${dual.primary}元素</div></div><div class="element-mix-desc">纯粹的${dual.primary}元素能量</div>`;
    }
    document.getElementById('elementDisplay').innerHTML = html;
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    currentCard = null;
}
function closeModalScroll() {
    const scrollPos = window.scrollY;
    document.getElementById('modal').classList.remove('active');
    currentCard = null;
    setTimeout(() => window.scrollTo({ top: scrollPos, behavior: 'auto' }), 10);
}
function toggleFavorite() {
    if (!currentCard) return;
    const idx = favorites.indexOf(currentCard.id);
    if (idx > -1) {
        favorites.splice(idx, 1);
        showToast('已取消收藏');
    } else {
        favorites.push(currentCard.id);
        showToast('已收藏');
    }
    localStorage.setItem('tarot_favorites', JSON.stringify(favorites));
    const favBtn = document.getElementById('favoriteBtn');
    favBtn.textContent = favorites.includes(currentCard.id) ? '★ 已收藏' : '☆ 收藏';
    favBtn.classList.toggle('active', favorites.includes(currentCard.id));
    renderGrid();
}
function shareCard() {
    if (!currentCard) return;
    const posText = currentPosition === 'reversed' ? '逆位' : '正位';
    const text = `【${currentCard.name}·${posText}】${currentPosition === 'reversed' ? currentCard.reverseDesc : currentCard.desc}`;
    if (navigator.share) {
        navigator.share({ title: currentCard.name, text, url: window.location.href });
    } else {
        navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
    }
}
function saveNote() {
    if (!currentCard) return;
    notes[currentCard.id] = document.getElementById('modalNote').value;
    localStorage.setItem('tarot_notes', JSON.stringify(notes));
    showToast('备注已保存');
}

// ===== 符号关联 =====
function renderRelatedCards(card) {
    const container = document.getElementById('relatedCards');
    const grid = document.getElementById('relatedGrid');
    const hits = tarotSymbols.filter(s => s.cards.includes(card.name));
    if (!hits.length) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';
    grid.innerHTML = hits.map(s => {
        const isLink = s.type === '关联库';
        const others = s.cards.filter(n => n !== card.name).join(' / ');
        return `<div class="symbol-chip ${isLink ? 'chip-link' : 'chip-material'}" onclick="showSymbolCard('${s.symbol}')">
            <div class="chip-icon">${isLink ? '🔗' : '🎨'}</div>
            <div class="chip-text"><div class="chip-name">${s.symbol}</div><div class="chip-type">${s.type}</div></div>
            <div class="chip-others">${others}</div>
        </div>`;
    }).join('');
}

function showSymbolCard(symbolName) {
    const s = tarotSymbols.find(x => x.symbol === symbolName);
    if (!s) return;
    const isLink = s.type === '关联库';
    const accent = isLink ? 'var(--copper)' : 'var(--text2)';
    const html = `<div class="symbol-modal" onclick="this.remove()">
        <div class="symbol-modal-inner ${isLink ? 'symbol-related' : 'symbol-material'}" onclick="event.stopPropagation()">
            <div class="symbol-modal-header" style="color:${accent}">${isLink ? '🔗 关联符号' : '🎨 画面素材'}</div>
            <h3 style="color:var(--text);margin:.3rem 0 .5rem;font-size:1.3rem">${s.symbol}</h3>
            <p class="symbol-meaning">${s.meaning}</p>
            <div class="symbol-hint">${isLink ? '📖 关联库：用于理解牌与牌之间的叙事联系' : '🖌️ 素材库：仅作为画面元素与创作参考'}</div>
            <hr style="border:0;border-top:1px solid var(--border);margin:.8rem 0">
            <div style="font-size:.75rem;color:var(--gold);margin-bottom:.4rem">出现牌面（${s.cards.length}张）</div>
            <div class="symbol-tags">${s.cards.map(name => { const c = TAROT_DATA.find(x => x.name === name); return `<span class="symbol-tag">${c ? c.emoji : ''} ${name}</span>`; }).join('')}</div>
            <button class="close-scroll-btn" onclick="this.closest('.symbol-modal').remove()">✕ 合上符号卷轴</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

// ===== 抽牌与历史 =====
function drawCard() {
    const deck = document.getElementById('deck');
    deck.classList.add('shuffling');
    setTimeout(() => {
        deck.classList.remove('shuffling');
        const randomCard = TAROT_DATA[Math.floor(Math.random() * TAROT_DATA.length)];
        const isReversed = Math.random() > 0.5;
        const result = document.getElementById('drawResult');
        addToHistory(randomCard, isReversed);
        const posClass = isReversed ? "reversed" : "";
        const badge = isReversed ? '<div class="reversed-badge">逆位</div>' : "";
        result.innerHTML = `<div class="draw-card ${posClass}">
            <div class="card" onclick="openCard(${randomCard.id}, ${isReversed})" style="position:relative;">${badge}
                <div class="card-img"><img src="${randomCard.imgUrl}" alt="${randomCard.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'card-emoji\\'>${randomCard.emoji}</span>'"></div>
                <div class="card-name">${randomCard.name} ${isReversed ? '↓' : '↑'}</div>
            </div>
        </div>`;
    }, 500);
}

function addToHistory(card, isReversed = false) {
    const record = { cardId: card.id, isReversed: isReversed, cardName: card.name, cardEmoji: card.emoji, cardImg: card.imgUrl, timestamp: new Date().toISOString() };
    history.unshift(record);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('tarot_history', JSON.stringify(history));
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (history.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:var(--text2);padding:2rem;">暂无占卜记录</div>';
        return;
    }
    list.innerHTML = history.map(record => {
        const date = new Date(record.timestamp);
        const dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;
        const revClass = record.isReversed ? 'reversed' : '';
        const revBadge = record.isReversed ? '↓逆位' : '';
        return `<div class="history-item" onclick="openCard(${record.cardId}, ${record.isReversed || false})">
            <div class="history-date">${dateStr}</div>
            <div class="history-cards">
                <div class="history-card-mini ${revClass}"><img src="${record.cardImg}" alt="${record.cardName}${revBadge}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'font-size:1.5rem;text-align:center;line-height:75px\\'>${record.cardEmoji}</div>'"></div>
                <div style="display:flex;flex-direction:column;align-items:flex-start;justify-content:center;"><div style="color:var(--text);font-weight:bold;">${record.cardName} ${revBadge}</div><div style="color:var(--text2);font-size:0.7rem;">点击查看详情</div></div>
            </div>
        </div>`;
    }).join('');
}

// ===== 每日一抽 =====
function checkDailyCard() {
    const today = new Date().toDateString();
    if (dailyCard && dailyCard.date === today) {} else {
        dailyCard = null;
        localStorage.removeItem('tarot_daily');
    }
}
function showDailyCard() {
    const today = new Date().toDateString();
    if (dailyCard && dailyCard.date === today) {
        const card = TAROT_DATA.find(c => c.id === dailyCard.cardId);
        if (card) {
            openCard(card.id, dailyCard.isReversed);
            showToast('今日已抽牌，再次查看');
        } else {
            dailyCard = null;
            localStorage.removeItem('tarot_daily');
        }
        return;
    }
    const card = TAROT_DATA[Math.floor(Math.random() * TAROT_DATA.length)];
    const isReversed = Math.random() > 0.5;
    dailyCard = { date: today, cardId: card.id, isReversed: isReversed };
    localStorage.setItem('tarot_daily', JSON.stringify(dailyCard));
    openCard(card.id, isReversed);
    showToast('🌅 今日指引已揭晓');
}

// ===== 牌阵系统 =====
function drawSpread() {
    const deck = document.getElementById('spreadDeck');
    deck.classList.add('shuffling');
    const def = SPREAD_DEFS[currentSpread];
    document.getElementById('spreadCount').textContent = def.count + ' 张';
    setTimeout(() => {
        deck.classList.remove('shuffling');
        const drawn = [];
        for (let i = 0; i < def.count; i++) {
            const c = TAROT_DATA[Math.floor(Math.random() * TAROT_DATA.length)];
            const rev = Math.random() > 0.5;
            drawn.push({ card: c, reversed: rev });
            addToHistory(c, rev);
        }
        const container = document.getElementById('spreadResult');
        container.innerHTML = drawn.map((item, idx) => {
            const posClass = item.reversed ? "reversed" : "";
            const badge = item.reversed ? '<div class="reversed-badge">逆位</div>' : "";
            const label = def.slots[idx] || `位置${idx+1}`;
            const meaning = def.meanings[idx] || '';
            return `<div class="spread-slot">
                <div class="draw-card ${posClass}">
                    <div class="card" onclick="openCard(${item.card.id}, ${item.reversed})" style="position:relative;">${badge}
                        <div class="card-img"><img src="${item.card.imgUrl}" alt="${item.card.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'card-emoji\\'>${item.card.emoji}</span>'"></div>
                        <div class="card-name">${item.card.name}</div>
                    </div>
                </div>
                <div class="spread-label">${label}</div>
                <div class="spread-meaning">${meaning}</div>
            </div>`;
        }).join('');
        const interp = document.getElementById('spreadInterp');
        interp.style.display = 'block';
        let html = `<strong>📖 ${def.label} · 基础解读</strong><br><br>`;
        drawn.forEach((item, idx) => {
            const label = def.slots[idx] || `位置${idx+1}`;
            const desc = item.reversed ? item.card.reverseDesc : item.card.desc;
            const pos = item.reversed ? '逆位' : '正位';
            html += `<span class="pos-tag">${label}</span> <strong>${item.card.name}</strong>（${pos}）— ${desc}<br><br>`;
        });
        html += `<span style="color:var(--text2);font-size:0.8rem;">💡 点击单牌查看完整释义 · 点击右下角AI精灵获取深度解读</span>`;
        interp.innerHTML = html;
        const spreadContexts = drawn.map((item, idx) => `${def.slots[idx] || `位置${idx+1}`}：${item.card.name}（${item.reversed ? '逆位' : '正位'}）`).join('；');
        setSpiritContext(`当前牌阵：${def.label}。${spreadContexts}`);
    }, 500);
}

// ===== AI 全局悬浮精灵 =====
let spiritContext = '';
function setSpiritContext(context) {
    spiritContext = context;
    const ctxEl = document.getElementById('spirit-context');
    if (ctxEl) ctxEl.innerText = context;
}
function openSpirit() {
    document.getElementById('ai-spirit-modal').classList.add('active');
}
function closeSpirit() {
    document.getElementById('ai-spirit-modal').classList.remove('active');
}
async function askSpirit() {
    const question = document.getElementById('spirit-input').value.trim();
    const output = document.getElementById('spirit-output');
    if (!question) {
        output.innerText = "请先输入你的问题，或者点击单张牌、牌阵后再问我~";
        return;
    }
    output.innerHTML = '<span class="ai-loading">✨ 正在召唤智慧之灵…</span>';
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: '你是深谙塔罗智慧、能解答用户疑惑的智慧之灵。请结合用户提供的牌面上下文，用诗意且深邃的语言回答。' },
                    { role: 'user', content: `牌面上下文：${spiritContext}\n\n用户问题：${question}` }
                ]
            })
        });
        const data = await response.json();
        output.innerHTML = (data.choices?.[0]?.message?.content || '（无回应）').replace(/\n/g, '<br>');
        document.getElementById('spirit-input').value = '';
    } catch (error) {
        output.innerHTML = `<span style="color: #d9534f;">❌ 召唤失败，请检查网络或后台API配置。</span>`;
    }
}

// ===== 资料库逻辑 =====
const NUMBER_MEANINGS = { '0': { meaning: '无限潜能', keywords: '开始·纯真·无限' }, '1': { meaning: '开创与专注', keywords: '开始·创造·独立' }, '2': { meaning: '平衡与选择', keywords: '对立·合作·决策' }, '3': { meaning: '表达与创造', keywords: '成长·社交·表达' }, '4': { meaning: '稳定与秩序', keywords: '基础·安全·固执' }, '5': { meaning: '冲突与改变', keywords: '不稳定·挑战·适应' }, '6': { meaning: '和谐与给予', keywords: '平衡·责任·关爱' }, '7': { meaning: '内省与探索', keywords: '分析·评估·精神' }, '8': { meaning: '力量与成就', keywords: '行动·掌控·结果' }, '9': { meaning: '完成与放下', keywords: '结束·智慧·放手' }, '10': { meaning: '圆满与超越', keywords: '完成·转化·新循环' }, 'A': { meaning: '开端潜能', keywords: '种子·潜力·开始' }, '侍从': { meaning: '学习探索', keywords: '消息·好奇·学生' }, '骑士': { meaning: '行动追求', keywords: '冒险·冲动·前进' }, '王后': { meaning: '滋养包容', keywords: '关怀·情感·成熟' }, '国王': { meaning: '掌控领导', keywords: '权威·稳定·责任' } };
const ELEMENT_DETAILS = { '火': { icon: '🔥', name: '火元素', quality: '活跃·外向', season: '夏季', direction: '南方', zodiac: '白羊·狮子·射手', traits: '热情、行动力、创造力、冲动' }, '水': { icon: '💧', name: '水元素', quality: '流动·内向', season: '秋季', direction: '西方', zodiac: '巨蟹·天蝎·双鱼', traits: '情感、直觉、敏感、包容' }, '风': { icon: '💨', name: '风元素', quality: '活跃·外向', season: '春季', direction: '东方', zodiac: '双子·天秤·水瓶', traits: '思维、沟通、理性、客观' }, '土': { icon: '🌍', name: '土元素', quality: '稳定·内向', season: '冬季', direction: '北方', zodiac: '金牛·处女·摩羯', traits: '务实、稳定、物质、耐心' } };
const ZODIAC_DATA = [ { symbol: '♈', name: '白羊座', date: '3.21-4.19', element: '火', card: '皇帝' }, { symbol: '♉', name: '金牛座', date: '4.20-5.20', element: '土', card: '教皇' }, { symbol: '♊', name: '双子座', date: '5.21-6.21', element: '风', card: '恋人' }, { symbol: '♋', name: '巨蟹座', date: '6.22-7.22', element: '水', card: '战车' }, { symbol: '♌', name: '狮子座', date: '7.23-8.22', element: '火', card: '力量' }, { symbol: '♍', name: '处女座', date: '8.23-9.22', element: '土', card: '隐士' }, { symbol: '♎', name: '天秤座', date: '9.23-10.23', element: '风', card: '正义' }, { symbol: '♏', name: '天蝎座', date: '10.24-11.22', element: '水', card: '死神' }, { symbol: '♐', name: '射手座', date: '11.23-12.21', element: '火', card: '节制' }, { symbol: '♑', name: '摩羯座', date: '12.22-1.19', element: '土', card: '恶魔' }, { symbol: '♒', name: '水瓶座', date: '1.20-2.18', element: '风', card: '星星' }, { symbol: '♓', name: '双鱼座', date: '2.19-3.20', element: '水', card: '月亮' } ];

function openLibrary() { document.getElementById('libraryModal').classList.add('active'); renderNumberGrid(); renderElementGrid(); renderZodiacGrid(); }
function closeLibrary() { document.getElementById('libraryModal').classList.remove('active'); }
function renderNumberGrid() { const grid = document.getElementById('numberGrid'); grid.innerHTML = Object.entries(NUMBER_MEANINGS).map(([num, data]) => `<div class="number-card"><div class="number-value">${num}</div><div class="number-meaning">${data.meaning}</div><div class="number-keywords">${data.keywords}</div></div>`).join(''); }
function renderElementGrid() { const grid = document.getElementById('elementGrid'); grid.innerHTML = Object.entries(ELEMENT_DETAILS).map(([key, data]) => `<div class="element-card"><div class="element-header"><span class="element-icon">${data.icon}</span><span class="element-title">${data.name}</span></div><div style="color:var(--text);font-size:0.8rem;margin-bottom:0.3rem;">${data.quality}</div><div class="element-assoc"><div>特质：${data.traits}</div><div>季节：${data.season} | 方向：${data.direction}</div><div>星座：${data.zodiac}</div></div></div>`).join(''); }
function renderZodiacGrid() { const grid = document.getElementById('zodiacGrid'); grid.innerHTML = ZODIAC_DATA.map(z => `<div class="zodiac-item"><div class="zodiac-symbol">${z.symbol}</div><div class="zodiac-name">${z.name}</div><div class="zodiac-date">${z.date}</div><div style="font-size:0.6rem;color:var(--text2);">${z.element}·${z.card}</div></div>`).join(''); }

const SYMBOL_DATABASE = [];
TAROT_DATA.forEach(card => { const symbols = card.highlight.split('·'); symbols.forEach(sym => { sym = sym.trim(); if (sym) { const existing = SYMBOL_DATABASE.find(s => s.symbol === sym); if (existing) { if (!existing.cards.find(c => c.id === card.id)) { existing.cards.push({ id: card.id, name: card.name }); } } else { SYMBOL_DATABASE.push({ symbol: sym, cards: [{ id: card.id, name: card.name }] }); } } }); });
const SYMBOL_CATEGORIES = { 'element': ['火', '水', '风', '土', '太阳', '月亮', '星星', '光', '云'], 'animal': ['狗', '狮', '蛇', '狼', '龙虾', '马', '鸟', '鹰', '牛', '羊', '鱼', '螃蟹', '兔子', '孔雀', '黑猫'], 'object': ['剑', '杯', '杖', '币', '星币', '王冠', '钥匙', '书', '灯', '桥', '塔', '城堡', '船', '车', '号角', '棺材', '花', '玫瑰', '麦穗'], 'person': ['少年', '青年', '壮年', '成年', '中年', '老年', '孩童', '男子', '女子', '天使', '国王', '王后', '骑士', '侍从', '愚人', '魔术师', '祭司'] };
function filterSymbolCat(cat, event) { currentSymbolFilter = cat; document.querySelectorAll('.symbol-cat-btn').forEach(btn => btn.classList.remove('active')); if (event) event.target.classList.add('active'); searchSymbols(); }
function searchSymbols() { const query = document.getElementById('symbolSearchInput').value.toLowerCase().trim(); const results = document.getElementById('symbolResults'); if (!query) { results.innerHTML = '<div style="text-align:center;color:var(--text2);padding:1rem;">输入关键词搜索符号、牌名或含义</div>'; return; } let matches = SYMBOL_DATABASE.filter(s => { if (currentSymbolFilter !== 'all') { const catSymbols = SYMBOL_CATEGORIES[currentSymbolFilter] || []; if (!catSymbols.some(cs => s.symbol.includes(cs))) return false; } return s.symbol.toLowerCase().includes(query) || s.cards.some(c => c.name.toLowerCase().includes(query)); }); const cardMatches = TAROT_DATA.filter(c => c.desc.toLowerCase().includes(query) || c.highlight.toLowerCase().includes(query) || c.name.toLowerCase().includes(query) || (c.reverseDesc && c.reverseDesc.toLowerCase().includes(query))).map(c => ({ symbol: c.highlight.split('·')[0] || c.name, cards: [{ id: c.id, name: c.name }], matchReason: c.desc.includes(query) ? '描述' : '牌名' })); const allMatches = [...matches, ...cardMatches]; if (allMatches.length === 0) { results.innerHTML = '<div style="text-align:center;color:var(--text2);padding:1rem;">未找到相关结果</div>'; return; } results.innerHTML = allMatches.slice(0, 20).map(m => { const highlightQuery = (text) => { if (!query) return text; const regex = new RegExp(`(${query})`, 'gi'); return text.replace(regex, '<span class="symbol-highlight">$1</span>'); }; return `<div class="symbol-result" onclick="closeLibrary();openCard(${m.cards[0].id})"><div class="symbol-match">${highlightQuery(m.symbol)} ${m.matchReason ? `<span style="font-size:0.65rem;color:var(--text2);">(${m.matchReason})</span>` : ''}</div><div style="color:var(--text2);font-size:0.75rem;margin-top:0.3rem;">出现在：${m.cards.map(c => `<span style="color:var(--text);cursor:pointer;">${highlightQuery(c.name)}</span>`).join('、')}</div></div>`; }).join(''); }