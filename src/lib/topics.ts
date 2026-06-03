export interface Topic {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  starterQuestion: string;
  subtopics: string[];
}

export const TOPICS: Topic[] = [
  {
    id: 'social-media',
    title: '社交媒体',
    icon: '📱',
    description: '探讨社交媒体对青少年生活、人际关系与心理健康的影响',
    color: 'blue',
    starterQuestion: '你平时使用哪些社交媒体平台？你觉得它们对你的生活有什么影响？',
    subtopics: ['网络成瘾', '人际关系', '隐私安全', '信息真假', '心理健康'],
  },
  {
    id: 'environment',
    title: '环境保护',
    icon: '🌿',
    description: '讨论气候变化、环保行动，以及个人与社会的责任',
    color: 'green',
    starterQuestion: '你在日常生活中有做什么保护环境的事吗？你觉得最迫切需要解决的环境问题是什么？',
    subtopics: ['气候变化', '垃圾分类', '可持续发展', '绿色生活', '企业责任'],
  },
  {
    id: 'cyberbullying',
    title: '网络霸凌',
    icon: '🛡️',
    description: '了解网络霸凌的形式、危害，以及如何保护自己和他人',
    color: 'red',
    starterQuestion: '你有没有见过或听过网络霸凌的例子？你认为为什么有些人会在网上欺凌他人？',
    subtopics: ['匿名文化', '受害者支持', '学校责任', '法律保护', '预防措施'],
  },
  {
    id: 'family',
    title: '家庭关系',
    icon: '👨‍👩‍👧',
    description: '探讨亲子关系、家庭沟通，以及现代家庭面对的挑战',
    color: 'amber',
    starterQuestion: '你觉得你和父母之间的沟通顺畅吗？你们之间有没有什么常见的矛盾？',
    subtopics: ['亲子沟通', '代沟问题', '家庭压力', '手机与家人', '陪伴时间'],
  },
  {
    id: 'learning',
    title: '终身学习',
    icon: '📚',
    description: '思考学习的意义、方式，以及在快速变化的社会中持续成长的重要性',
    color: 'purple',
    starterQuestion: '你觉得学习只是为了考试拿好成绩吗？在学校以外，你有什么学习的方式或爱好？',
    subtopics: ['自主学习', '技能培养', '失败教育', '好奇心', '网络学习'],
  },
  {
    id: 'health',
    title: '饮食与健康',
    icon: '🥗',
    description: '讨论均衡饮食、运动习惯，以及现代人如何维持健康的生活方式',
    color: 'orange',
    starterQuestion: '你觉得新加坡年轻人的饮食习惯健康吗？你自己平时怎么照顾自己的健康？',
    subtopics: ['垃圾食品', '运动习惯', '心理健康', '熬夜问题', '饮食文化'],
  },
  {
    id: 'volunteering',
    title: '义工精神',
    icon: '🤝',
    description: '探讨志愿服务的价值、意义，以及培养社会责任感的重要性',
    color: 'teal',
    starterQuestion: '你有做过义工吗？是什么让你去参与？你觉得义工服务对你有什么意义？',
    subtopics: ['社会责任', '同理心', '社区建设', '学生义工', '老年关怀'],
  },
  {
    id: 'culture',
    title: '传统文化',
    icon: '🏮',
    description: '思考传统文化在现代社会的地位，以及如何在全球化中保留文化根源',
    color: 'rose',
    starterQuestion: '你觉得新加坡的华族传统文化还重要吗？有哪些传统是你认为值得保留的？',
    subtopics: ['华语地位', '节日习俗', '全球化冲击', '年轻人与传统', '文化认同'],
  },
  {
    id: 'technology',
    title: '科技发展',
    icon: '💡',
    description: '探讨人工智能、自动化等科技进步对社会、就业和生活的影响',
    color: 'cyan',
    starterQuestion: '你觉得人工智能（AI）会给我们的生活带来什么改变？你对这些改变感到兴奋还是担忧？',
    subtopics: ['人工智能', '工作被取代', '数字差距', '科技依赖', '未来职业'],
  },
  {
    id: 'career',
    title: '职业与梦想',
    icon: '🎯',
    description: '讨论职业选择、兴趣与现实的平衡，以及如何规划未来',
    color: 'indigo',
    starterQuestion: '你有没有想过将来想从事什么职业？是什么影响了你的想法？',
    subtopics: ['兴趣与现实', '父母期望', '新兴职业', '创业精神', '人生规划'],
  },
];

export interface TopicColors {
  bg: string; border: string; text: string; badge: string; hover: string;
  /** Vivid gradient for icon tiles, primary buttons, user bubbles */
  gradient: string;
  /** Soft gradient wash for surfaces */
  soft: string;
  /** Solid mid-tone (e.g. bg-blue-600) for accents */
  solid: string;
  /** Coloured shadow tint */
  glow: string;
}

export const COLOR_MAP: Record<string, TopicColors> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   hover: 'hover:bg-blue-100 hover:border-blue-300',   gradient: 'from-sky-400 to-blue-600',      soft: 'from-sky-50 to-blue-50',      solid: 'bg-blue-600',   glow: 'shadow-blue-500/25' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  hover: 'hover:bg-green-100 hover:border-green-300', gradient: 'from-emerald-400 to-green-600', soft: 'from-emerald-50 to-green-50', solid: 'bg-green-600',  glow: 'shadow-emerald-500/25' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    hover: 'hover:bg-red-100 hover:border-red-300',    gradient: 'from-rose-400 to-red-600',      soft: 'from-rose-50 to-red-50',      solid: 'bg-red-600',    glow: 'shadow-rose-500/25' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  hover: 'hover:bg-amber-100 hover:border-amber-300', gradient: 'from-amber-400 to-orange-500',  soft: 'from-amber-50 to-orange-50',  solid: 'bg-amber-500',  glow: 'shadow-amber-500/25' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', hover: 'hover:bg-purple-100 hover:border-purple-300', gradient: 'from-violet-400 to-purple-600', soft: 'from-violet-50 to-purple-50', solid: 'bg-purple-600', glow: 'shadow-violet-500/25' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', hover: 'hover:bg-orange-100 hover:border-orange-300', gradient: 'from-orange-400 to-rose-500',   soft: 'from-orange-50 to-rose-50',   solid: 'bg-orange-500', glow: 'shadow-orange-500/25' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700',   hover: 'hover:bg-teal-100 hover:border-teal-300',   gradient: 'from-teal-400 to-cyan-600',     soft: 'from-teal-50 to-cyan-50',     solid: 'bg-teal-600',   glow: 'shadow-teal-500/25' },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700',   hover: 'hover:bg-rose-100 hover:border-rose-300',   gradient: 'from-rose-400 to-pink-600',     soft: 'from-rose-50 to-pink-50',     solid: 'bg-rose-600',   glow: 'shadow-pink-500/25' },
  cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-700',   hover: 'hover:bg-cyan-100 hover:border-cyan-300',   gradient: 'from-cyan-400 to-sky-600',      soft: 'from-cyan-50 to-sky-50',      solid: 'bg-cyan-600',   glow: 'shadow-cyan-500/25' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', hover: 'hover:bg-indigo-100 hover:border-indigo-300', gradient: 'from-indigo-400 to-violet-600', soft: 'from-indigo-50 to-violet-50', solid: 'bg-indigo-600', glow: 'shadow-indigo-500/25' },
};
