
import { StyleConfig, WordCategory, Scenario, TranslationEngine, WordInteractionConfig, PageWidgetConfig, AnkiConfig, OriginalTextConfig, MergeStrategyConfig, AutoTranslateConfig, DictionaryEngine } from './types';

export const DEFAULT_STYLE: StyleConfig = {
  color: '#000000',
  backgroundColor: 'transparent',
  underlineStyle: 'none',
  underlineColor: '#000000',
  underlineOffset: '2px',
  isBold: false,
  isItalic: false,
  fontSize: '1em',
  opacity: 1,
  densityMode: 'percent',
  densityValue: 100,
};

export const DEFAULT_ORIGINAL_TEXT_CONFIG: OriginalTextConfig = {
  show: true,
  activeMode: 'horizontal',
  bracketsTarget: 'original',
  horizontal: {
    translationFirst: false, // Original Last
    wrappers: {
      translation: { prefix: '', suffix: '' },
      original: { prefix: '(', suffix: ')' }
    }
  },
  vertical: {
    translationFirst: true, // Translation Top
    baselineTarget: 'translation', // Default: English sits on baseline
    wrappers: {
      translation: { prefix: '', suffix: '' },
      original: { prefix: '', suffix: '' }
    }
  },
  style: { ...DEFAULT_STYLE, color: '#94a3b8', fontSize: '0.85em' }
};

export const DEFAULT_STYLES: Record<WordCategory, StyleConfig> = {
  [WordCategory.KnownWord]: { ...DEFAULT_STYLE, color: '#15803d' }, 
  [WordCategory.WantToLearnWord]: { ...DEFAULT_STYLE, color: '#b45309', isBold: true }, 
  [WordCategory.LearningWord]: { ...DEFAULT_STYLE, color: '#b91c1c', backgroundColor: '#fef2f2', isBold: true }, 
};

export const INITIAL_SCENARIOS: Scenario[] = [
  { id: '1', name: '通用英语', isActive: true, isCustom: false },
  { id: '2', name: '雅思 / 托福', isActive: false, isCustom: false },
  { id: '3', name: '计算机科学', isActive: false, isCustom: false },
  { id: '4', name: '旅游出行', isActive: false, isCustom: true },
];

export const INITIAL_ENGINES: TranslationEngine[] = [
  { 
    id: 'tencent', 
    name: '腾讯翻译君 (Tencent)', 
    type: 'standard', 
    isEnabled: true, // Default Enabled
    appId: '', // SecretId
    secretKey: '', 
    endpoint: 'tmt.tencentcloudapi.com',
    region: 'ap-shanghai',
    projectId: 0
  },
  { id: 'google', name: 'Google 翻译', type: 'standard', isEnabled: false, endpoint: 'https://translation.googleapis.com/language/translate/v2' },
  { id: 'gemini', name: 'Google Gemini', type: 'ai', isEnabled: false, apiKey: '', model: 'gemini-2.5-flash' },
  { id: 'deepl', name: 'DeepL API', type: 'standard', isEnabled: false, apiKey: '', endpoint: 'https://api-free.deepl.com/v2/translate' },
  { id: 'volcengine', name: '字节火山引擎', type: 'standard', isEnabled: false, apiKey: '', secretKey: '' },
  { id: 'baidu', name: '百度翻译', type: 'standard', isEnabled: false, appId: '', secretKey: '' },
  { id: 'iflytek', name: '科大讯飞', type: 'standard', isEnabled: false, appId: '', apiKey: '', secretKey: '' },
  { id: 'custom-mock', name: '模拟翻译 (无需 Key)', type: 'standard', isEnabled: false },
];

export const INITIAL_DICTIONARIES: DictionaryEngine[] = [
  { 
    id: 'youdao', 
    name: '有道词典 (Youdao)', 
    endpoint: 'https://dict.youdao.com/jsonapi', 
    link: 'https://dict.youdao.com/',
    isEnabled: true, 
    priority: 1, // Youdao is #1
    description: '网易出品，数据最全，包含音频、考试等级、柯林斯星级等。'
  },
  { 
    id: 'iciba', 
    name: '金山词霸 (ICBA)', 
    endpoint: 'https://dict-co.iciba.com/api/dictionary.php',
    link: 'http://www.iciba.com/',
    isEnabled: true, 
    priority: 2, // ICBA is #2
    description: '经典词典，包含英/美音标及双语例句。'
  },
  { 
    id: 'free-dict', 
    name: 'Free Dictionary API', 
    endpoint: 'https://api.dictionaryapi.dev/api/v2/entries/en/', 
    link: 'https://dictionaryapi.dev/',
    isEnabled: true, 
    priority: 3,
    description: 'Google 官方推荐，英文释义为主。'
  },
  { 
    id: 'wiktionary', 
    name: 'Wiktionary API', 
    endpoint: 'https://en.wiktionary.org/api/rest_v1/page/definition/', 
    link: 'https://en.wiktionary.org/',
    isEnabled: true, 
    priority: 4,
    description: '维基词典，纯英文释义，国内访问不稳定。'
  }
];

export const DEFAULT_WORD_INTERACTION: WordInteractionConfig = {
  mainTrigger: { modifier: 'None', action: 'Hover', delay: 600 },
  quickAddTrigger: { modifier: 'Alt', action: 'DoubleClick', delay: 0 },
  bubblePosition: 'top',
  showPhonetic: true,
  showOriginalText: true, 
  showDictExample: true,
  showDictTranslation: true,
  autoPronounce: true,
  autoPronounceAccent: 'US',
  autoPronounceCount: 1,
  dismissDelay: 300,
  allowMultipleBubbles: false,
};

export const DEFAULT_PAGE_WIDGET: PageWidgetConfig = {
  enabled: true,
  // Set to 0 to indicate uninitialized position, triggering auto-position logic in component
  x: 0, 
  y: 0,
  width: 380,
  maxHeight: 600,
  opacity: 0.98,
  backgroundColor: '#ffffff',
  fontSize: '14px',
  
  modalPosition: { x: 0, y: 0 }, // Will also auto-center
  modalSize: { width: 500, height: 600 },

  showPhonetic: true,
  showMeaning: true,
  showMultiExamples: true,
  
  showExampleTranslation: true,
  showContextTranslation: true,
  showInflections: true,

  // New Fields for Rich Metadata in Widget
  showPartOfSpeech: true,
  showTags: true,
  showImportance: true,
  showCocaRank: true,

  showSections: {
    known: false,
    want: true,
    learning: true,
  },
  cardDisplay: [
    { id: 'context', label: '来源原句', enabled: true },
    { id: 'mixed', label: '中英混合', enabled: false },
    { id: 'dictExample', label: '词典例句', enabled: true },
  ]
};

export const DEFAULT_AUTO_TRANSLATE: AutoTranslateConfig = {
  enabled: true,
  bilingualMode: false,
  translateWholePage: false,
  matchInflections: true, // Default Enabled
  blacklist: ['google.com', 'baidu.com'], 
  whitelist: ['nytimes.com', 'medium.com'],
  ttsSpeed: 1.0,
};

const DEFAULT_ANKI_FRONT = `
<div class="card front">
  <div class="header">
    <div class="word">{{word}}</div>
    <div class="phonetics">
      <span class="us">🇺🇸 {{phonetic_us}}</span>
      <span class="uk">🇬🇧 {{phonetic_uk}}</span>
    </div>
    <!-- 默认朗读脚本需在 Anki 模板设置中添加，此处仅为结构 -->
  </div>

  <div class="context-section">
    <div class="paragraph">
      {{paragraph_en_prefix}}<b class="target-word">{{word}}</b>{{paragraph_en_suffix}}
    </div>
    <div class="sentence-highlight">
      {{sentence_en_prefix}}<b class="target-word">{{word}}</b>{{sentence_en_suffix}}
    </div>
  </div>

  <div class="example-section">
    <div class="dict-example">{{dict_example}}</div>
  </div>

  <div class="image-section">
    {{image}}
  </div>
</div>

<style>
.card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }
.header { margin-bottom: 20px; }
.word { font-size: 32px; font-weight: bold; color: #2563eb; }
.phonetics { font-family: monospace; color: #64748b; font-size: 16px; margin-top: 5px; }
.context-section { margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; text-align: left; }
.paragraph { color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 10px; }
.sentence-highlight { font-weight: bold; color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 10px; }
.target-word { color: #dc2626; font-style: italic; font-weight: bold; }
.example-section { margin-top: 20px; font-style: italic; color: #475569; }
.image-section img { max-width: 100%; border-radius: 8px; margin-top: 15px; }
</style>
`;

const DEFAULT_ANKI_BACK = `
<div class="card back">
  <div class="header">
    <div class="word">{{word}}</div>
    <div class="phonetics">
      <span class="us">🇺🇸 {{phonetic_us}}</span>
      <span class="uk">🇬🇧 {{phonetic_uk}}</span>
    </div>
  </div>

  <div class="meaning-section">
    <div class="definition">{{def_cn}}</div>
    <div class="tags">{{tags}}</div>
  </div>

  <div class="context-section">
    <div class="paragraph">
      {{paragraph_en_prefix}}<b class="target-word">{{word}}</b>{{paragraph_en_suffix}}
    </div>
    <div class="paragraph-trans">{{paragraph_src}}</div>
  </div>

  <div class="example-section">
    <div class="dict-example">{{dict_example}}</div>
    <div class="dict-example-trans">{{dict_example_trans}}</div>
  </div>

  <div class="video-section">
    {{video}}
  </div>
</div>

<style>
.card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }
.meaning-section { margin: 20px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
.definition { font-size: 24px; font-weight: bold; color: #0f172a; }
.tags { font-size: 12px; color: #64748b; margin-top: 5px; }
.context-section { margin-top: 20px; text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px; }
.paragraph { margin-bottom: 10px; }
.paragraph-trans { color: #64748b; font-size: 14px; }
.target-word { color: #dc2626; font-style: italic; font-weight: bold; }
.example-section { margin-top: 20px; text-align: left; }
.dict-example { font-style: italic; font-weight: bold; }
.dict-example-trans { color: #64748b; font-size: 16px; }
.video-section video { width: 100%; border-radius: 8px; margin-top: 20px; }
</style>
`;

export const DEFAULT_ANKI_CONFIG: AnkiConfig = {
  enabled: true,
  url: 'http://127.0.0.1:8765',
  deckName: 'ContextLingo',
  modelName: 'Basic', // Default Note Type
  syncInterval: 90,
  syncScope: { wantToLearn: true, learning: true },
  templates: { frontTemplate: DEFAULT_ANKI_FRONT, backTemplate: DEFAULT_ANKI_BACK }
};

export const DEFAULT_MERGE_STRATEGY: MergeStrategyConfig = {
  strategy: 'by_word',
  showMultiExamples: true,
  
  showExampleTranslation: true,
  showContextTranslation: true,
  
  showPartOfSpeech: true,
  showTags: true,
  showImportance: true,
  showCocaRank: true,
  showImage: true,
  showVideo: true,

  exampleOrder: [
    { id: 'context', label: '来源原句 (Context)', enabled: true },
    { id: 'mixed', label: '中英混合句 (Mixed)', enabled: true },
    { id: 'dictionary', label: '词典例句 (Dictionary)', enabled: true },
    { id: 'phrases', label: '常用短语 (Phrases)', enabled: true },
    { id: 'roots', label: '词根词缀 (Roots)', enabled: true },
    { id: 'synonyms', label: '近义词 (Synonyms)', enabled: true },
    { id: 'inflections', label: '词态变化 (Morphology)', enabled: true },
  ],
};
