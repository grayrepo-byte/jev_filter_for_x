export const SUPPORTED_LOCALES = [
  'en-US',
  'zh-CN',
  'ja-JP',
  'es-ES',
  'de-DE',
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export type LocalePreference = SupportedLocale | 'auto'

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  'en-US': 'English (United States)',
  'zh-CN': '简体中文（中国）',
  'ja-JP': '日本語（日本）',
  'es-ES': 'Español (España)',
  'de-DE': 'Deutsch (Deutschland)',
}

const EN = {
  loading: 'Loading…',
  enabledStatus: '● Enabled',
  disabledStatus: '○ Disabled',
  authError: 'TypeSafe rejected your API key. Open Settings to replace it.',
  mockModePopup:
    'Mock mode is active. Add a TypeSafe API key in Settings to use Jev.',
  enabled: 'Enabled',
  hideNoise: 'Hide Noise',
  focusMode: 'Focus Mode',
  focusModeHelp:
    'High score means at or above the Focus Threshold (currently {score}). Posts below {score} are collapsed.',
  minimumScore: 'Minimum Score',
  topics: 'Topics',
  value: 'Value',
  settings: 'Settings',
  tagline: 'Tune X for signal, not volume.',
  language: 'Language',
  languageDescription: 'Choose the language used by JevFilterForX.',
  browserLanguage: 'Browser default',
  apiKeyTitle: 'TypeSafe API key',
  mockModeOptions:
    'Mock mode — no API key stored, so posts are scored locally with fake numbers. Add a key to use Jev.',
  apiKeyLabel: 'TypeSafe API key',
  saveKey: 'Save key',
  saved: 'Saved',
  apiKeyStorage:
    'Stored on this device only — never synced to your Google account.',
  wantsHeading: 'What do you want from X?',
  interests: 'Interests',
  scoringTitle: 'How scores are calculated',
  scoringIntro:
    'Jev rates each post from 0 to 4 on three dimensions, then converts the weighted result to a 0–100 score.',
  signalDimension: 'Information signal',
  signalDimensionHelp: 'Concrete, substantive information instead of filler.',
  actionDimension: 'Actionability',
  actionDimensionHelp: 'How much the reader can do, learn, or decide afterward.',
  originalDimension: 'Originality',
  originalDimensionHelp: 'Specific, non-recycled thinking instead of clickbait.',
  scoringFormula:
    'Formula: ({signal}% × signal + {action}% × actionability + {original}% × originality) ÷ {max} × 100, rounded to the nearest integer.',
  scoreBands: '0–29 Low · 30–69 Medium · 70–100 High',
  scoringNote:
    'Topic, value, and noise labels are evaluated separately. A post can still be collapsed by your category filters or Focus Mode.',
  filtering: 'Filtering',
  focusThreshold: 'Focus Threshold',
  hideCategory: 'Hide {category}',
  hiddenPost: 'JevFilterForX hidden this post — {reason}',
  showPost: 'Show Post',
  hideAgain: 'Hide Again',
  lowValue: 'Low-value content',
  score: 'Score',
} as const

export type MessageKey = keyof typeof EN

const MESSAGES: Record<SupportedLocale, Record<MessageKey, string>> = {
  'en-US': EN,
  'zh-CN': {
    loading: '加载中…',
    enabledStatus: '● 已启用',
    disabledStatus: '○ 已停用',
    authError: 'TypeSafe 拒绝了你的 API Key，请在设置中更换。',
    mockModePopup: '当前为模拟模式。请在设置中添加 TypeSafe API Key 以使用 Jev。',
    enabled: '启用',
    hideNoise: '隐藏低价值内容',
    focusMode: '专注模式',
    focusModeHelp:
      '“高分”指达到或超过“专注模式阈值”（当前为 {score} 分）；低于 {score} 分的帖子会被折叠。',
    minimumScore: '最低分数',
    topics: '主题',
    value: '价值偏好',
    settings: '设置',
    tagline: '让 X 更有价值，而不是更嘈杂。',
    language: '语言',
    languageDescription: '选择 JevFilterForX 使用的界面语言。',
    browserLanguage: '跟随浏览器',
    apiKeyTitle: 'TypeSafe API Key',
    mockModeOptions:
      '模拟模式——尚未保存 API Key，帖子会在本地使用模拟分数。添加 Key 后即可使用 Jev。',
    apiKeyLabel: 'TypeSafe API Key',
    saveKey: '保存 Key',
    saved: '已保存',
    apiKeyStorage: '仅存储在当前设备，不会同步到你的 Google 账户。',
    wantsHeading: '你希望从 X 获得什么？',
    interests: '兴趣主题',
    scoringTitle: '分数如何计算',
    scoringIntro:
      'Jev 会从三个维度分别给帖子评 0–4 分，再按权重换算成 0–100 的最终分数。',
    signalDimension: '信息量',
    signalDimensionHelp: '是否包含具体、有实质的信息，而不是空话或简单反应。',
    actionDimension: '可行动性',
    actionDimensionHelp: '读完后能否采取行动、学到东西或帮助做决定。',
    originalDimension: '原创性',
    originalDimensionHelp: '是否具体、新颖，而不是重复内容或标题党。',
    scoringFormula:
      '公式：（信息量 × {signal}% + 可行动性 × {action}% + 原创性 × {original}%）÷ {max} × 100，结果四舍五入取整。',
    scoreBands: '0–29 低分 · 30–69 中等 · 70–100 高分',
    scoringNote:
      '主题、内容价值和噪声类型会单独判断；即使分数较高，帖子仍可能因类别过滤或专注模式而被折叠。',
    filtering: '过滤设置',
    focusThreshold: '专注模式阈值',
    hideCategory: '隐藏{category}',
    hiddenPost: 'JevFilterForX 已隐藏此帖子 — {reason}',
    showPost: '显示帖子',
    hideAgain: '重新隐藏',
    lowValue: '低价值内容',
    score: '分数',
  },
  'ja-JP': {
    loading: '読み込み中…',
    enabledStatus: '● 有効',
    disabledStatus: '○ 無効',
    authError: 'TypeSafe が API キーを拒否しました。設定で更新してください。',
    mockModePopup:
      'モックモードです。Jev を使うには設定で TypeSafe API キーを追加してください。',
    enabled: '有効',
    hideNoise: 'ノイズを非表示',
    focusMode: '集中モード',
    focusModeHelp:
      '高スコアとは集中モードのしきい値（現在 {score}）以上です。{score} 未満の投稿は折りたたまれます。',
    minimumScore: '最低スコア',
    topics: 'トピック',
    value: '価値',
    settings: '設定',
    tagline: '量ではなく、価値のある情報に集中。',
    language: '言語',
    languageDescription: 'JevFilterForX の表示言語を選択します。',
    browserLanguage: 'ブラウザーの既定',
    apiKeyTitle: 'TypeSafe API キー',
    mockModeOptions:
      'モックモード — API キーがないため、投稿はローカルの仮スコアで評価されます。Jev を使うにはキーを追加してください。',
    apiKeyLabel: 'TypeSafe API キー',
    saveKey: 'キーを保存',
    saved: '保存済み',
    apiKeyStorage: 'この端末にのみ保存され、Google アカウントには同期されません。',
    wantsHeading: 'X から何を得たいですか？',
    interests: '興味',
    scoringTitle: 'スコアの計算方法',
    scoringIntro:
      'Jev は投稿を3つの観点で0〜4点に評価し、重み付き結果を0〜100点に換算します。',
    signalDimension: '情報量',
    signalDimensionHelp: '埋め草ではなく、具体的で実質的な情報があるか。',
    actionDimension: '実行可能性',
    actionDimensionHelp: '読後に行動、学習、判断へつなげられるか。',
    originalDimension: '独自性',
    originalDimensionHelp: '使い回しや釣りではなく、具体的で新しい考えか。',
    scoringFormula:
      '計算式：（情報量 × {signal}% + 実行可能性 × {action}% + 独自性 × {original}%）÷ {max} × 100（四捨五入）。',
    scoreBands: '0〜29 低 · 30〜69 中 · 70〜100 高',
    scoringNote:
      'トピック、価値、ノイズ分類は別に評価されます。カテゴリーフィルターや集中モードによって折りたたまれる場合があります。',
    filtering: 'フィルター',
    focusThreshold: '集中モードのしきい値',
    hideCategory: '{category}を非表示',
    hiddenPost: 'JevFilterForX がこの投稿を非表示にしました — {reason}',
    showPost: '投稿を表示',
    hideAgain: '再び非表示',
    lowValue: '価値の低いコンテンツ',
    score: 'スコア',
  },
  'es-ES': {
    loading: 'Cargando…',
    enabledStatus: '● Activado',
    disabledStatus: '○ Desactivado',
    authError: 'TypeSafe rechazó tu clave API. Cámbiala en Configuración.',
    mockModePopup:
      'El modo de prueba está activo. Añade una clave API de TypeSafe para usar Jev.',
    enabled: 'Activado',
    hideNoise: 'Ocultar ruido',
    focusMode: 'Modo concentración',
    focusModeHelp:
      'Una puntuación alta alcanza o supera el umbral de concentración (actualmente {score}). Las publicaciones por debajo de {score} se contraen.',
    minimumScore: 'Puntuación mínima',
    topics: 'Temas',
    value: 'Valor',
    settings: 'Configuración',
    tagline: 'Ajusta X para obtener señal, no volumen.',
    language: 'Idioma',
    languageDescription: 'Elige el idioma de JevFilterForX.',
    browserLanguage: 'Predeterminado del navegador',
    apiKeyTitle: 'Clave API de TypeSafe',
    mockModeOptions:
      'Modo de prueba: no hay una clave API guardada, por lo que las publicaciones reciben puntuaciones simuladas. Añade una clave para usar Jev.',
    apiKeyLabel: 'Clave API de TypeSafe',
    saveKey: 'Guardar clave',
    saved: 'Guardado',
    apiKeyStorage:
      'Solo se guarda en este dispositivo; nunca se sincroniza con tu cuenta de Google.',
    wantsHeading: '¿Qué quieres obtener de X?',
    interests: 'Intereses',
    scoringTitle: 'Cómo se calcula la puntuación',
    scoringIntro:
      'Jev puntúa cada publicación de 0 a 4 en tres dimensiones y convierte el resultado ponderado en una escala de 0 a 100.',
    signalDimension: 'Señal informativa',
    signalDimensionHelp: 'Información concreta y sustancial en lugar de relleno.',
    actionDimension: 'Utilidad práctica',
    actionDimensionHelp: 'Cuánto permite actuar, aprender o decidir después.',
    originalDimension: 'Originalidad',
    originalDimensionHelp: 'Ideas específicas y no recicladas, sin contenido engañoso.',
    scoringFormula:
      'Fórmula: ({signal}% × señal + {action}% × utilidad + {original}% × originalidad) ÷ {max} × 100, redondeado al entero más cercano.',
    scoreBands: '0–29 Baja · 30–69 Media · 70–100 Alta',
    scoringNote:
      'El tema, el valor y el tipo de ruido se evalúan por separado. Los filtros de categoría o el modo concentración aún pueden contraer una publicación.',
    filtering: 'Filtrado',
    focusThreshold: 'Umbral de concentración',
    hideCategory: 'Ocultar {category}',
    hiddenPost: 'JevFilterForX ocultó esta publicación — {reason}',
    showPost: 'Mostrar publicación',
    hideAgain: 'Ocultar de nuevo',
    lowValue: 'Contenido de poco valor',
    score: 'Puntuación',
  },
  'de-DE': {
    loading: 'Wird geladen…',
    enabledStatus: '● Aktiviert',
    disabledStatus: '○ Deaktiviert',
    authError: 'TypeSafe hat deinen API-Schlüssel abgelehnt. Ändere ihn in den Einstellungen.',
    mockModePopup:
      'Der Testmodus ist aktiv. Füge in den Einstellungen einen TypeSafe-API-Schlüssel hinzu, um Jev zu verwenden.',
    enabled: 'Aktiviert',
    hideNoise: 'Rauschen ausblenden',
    focusMode: 'Fokusmodus',
    focusModeHelp:
      'Eine hohe Punktzahl erreicht mindestens die Fokusschwelle (aktuell {score}). Beiträge unter {score} werden eingeklappt.',
    minimumScore: 'Mindestpunktzahl',
    topics: 'Themen',
    value: 'Wert',
    settings: 'Einstellungen',
    tagline: 'Optimiere X auf Signal statt Lautstärke.',
    language: 'Sprache',
    languageDescription: 'Wähle die Sprache von JevFilterForX.',
    browserLanguage: 'Browsersprache',
    apiKeyTitle: 'TypeSafe-API-Schlüssel',
    mockModeOptions:
      'Testmodus — ohne gespeicherten API-Schlüssel werden Beiträge lokal mit Testwerten bewertet. Füge einen Schlüssel hinzu, um Jev zu verwenden.',
    apiKeyLabel: 'TypeSafe-API-Schlüssel',
    saveKey: 'Schlüssel speichern',
    saved: 'Gespeichert',
    apiKeyStorage:
      'Wird nur auf diesem Gerät gespeichert und nie mit deinem Google-Konto synchronisiert.',
    wantsHeading: 'Was möchtest du von X bekommen?',
    interests: 'Interessen',
    scoringTitle: 'So wird die Punktzahl berechnet',
    scoringIntro:
      'Jev bewertet jeden Beitrag in drei Dimensionen von 0 bis 4 und rechnet das gewichtete Ergebnis auf 0–100 um.',
    signalDimension: 'Informationsgehalt',
    signalDimensionHelp: 'Konkrete, gehaltvolle Informationen statt Fülltext.',
    actionDimension: 'Umsetzbarkeit',
    actionDimensionHelp: 'Wie gut man danach handeln, lernen oder entscheiden kann.',
    originalDimension: 'Originalität',
    originalDimensionHelp: 'Spezifische, nicht wiederverwertete Gedanken statt Clickbait.',
    scoringFormula:
      'Formel: ({signal}% × Informationsgehalt + {action}% × Umsetzbarkeit + {original}% × Originalität) ÷ {max} × 100, auf die nächste Ganzzahl gerundet.',
    scoreBands: '0–29 Niedrig · 30–69 Mittel · 70–100 Hoch',
    scoringNote:
      'Thema, Wert und Rauschtyp werden separat bewertet. Kategorie-Filter oder Fokusmodus können einen Beitrag trotzdem einklappen.',
    filtering: 'Filter',
    focusThreshold: 'Fokusschwelle',
    hideCategory: '{category} ausblenden',
    hiddenPost: 'JevFilterForX hat diesen Beitrag ausgeblendet — {reason}',
    showPost: 'Beitrag anzeigen',
    hideAgain: 'Wieder ausblenden',
    lowValue: 'Inhalt mit geringem Wert',
    score: 'Punktzahl',
  },
}

const TAGS: Record<SupportedLocale, Record<string, string>> = {
  'en-US': {
    MAKE_MONEY: 'Make Money', LEARN: 'Learn', OPPORTUNITY: 'Opportunity',
    INSIGHT: 'Insight', SELF_IMPROVEMENT: 'Self Improvement', CRYPTO: 'Crypto',
    WEB3: 'Web3', FINANCE: 'Finance', MARKETING: 'Marketing', PRODUCT: 'Product',
    BUSINESS: 'Business', PROGRAMMING: 'Programming', STARTUP: 'Startup', AI: 'AI',
    DAILY: 'Daily Life', ENTERTAINMENT: 'Entertainment', RANT: 'Rant', MEME: 'Meme',
    PROMOTION: 'Promotion',
  },
  'zh-CN': {
    MAKE_MONEY: '赚钱', LEARN: '学习', OPPORTUNITY: '机会', INSIGHT: '洞察',
    SELF_IMPROVEMENT: '自我提升', CRYPTO: '加密货币', WEB3: 'Web3', FINANCE: '金融',
    MARKETING: '营销', PRODUCT: '产品', BUSINESS: '商业', PROGRAMMING: '编程',
    STARTUP: '创业', AI: '人工智能', DAILY: '日常生活', ENTERTAINMENT: '娱乐',
    RANT: '抱怨', MEME: '梗图', PROMOTION: '推广',
  },
  'ja-JP': {
    MAKE_MONEY: '収益化', LEARN: '学習', OPPORTUNITY: '機会', INSIGHT: '洞察',
    SELF_IMPROVEMENT: '自己改善', CRYPTO: '暗号資産', WEB3: 'Web3', FINANCE: '金融',
    MARKETING: 'マーケティング', PRODUCT: 'プロダクト', BUSINESS: 'ビジネス',
    PROGRAMMING: 'プログラミング', STARTUP: 'スタートアップ', AI: 'AI',
    DAILY: '日常', ENTERTAINMENT: 'エンタメ', RANT: '愚痴', MEME: 'ミーム', PROMOTION: '宣伝',
  },
  'es-ES': {
    MAKE_MONEY: 'Ganar dinero', LEARN: 'Aprender', OPPORTUNITY: 'Oportunidad',
    INSIGHT: 'Perspectiva', SELF_IMPROVEMENT: 'Superación personal', CRYPTO: 'Cripto',
    WEB3: 'Web3', FINANCE: 'Finanzas', MARKETING: 'Marketing', PRODUCT: 'Producto',
    BUSINESS: 'Negocios', PROGRAMMING: 'Programación', STARTUP: 'Startup', AI: 'IA',
    DAILY: 'Vida diaria', ENTERTAINMENT: 'Entretenimiento', RANT: 'Queja', MEME: 'Meme',
    PROMOTION: 'Promoción',
  },
  'de-DE': {
    MAKE_MONEY: 'Geld verdienen', LEARN: 'Lernen', OPPORTUNITY: 'Chance',
    INSIGHT: 'Erkenntnis', SELF_IMPROVEMENT: 'Selbstentwicklung', CRYPTO: 'Krypto',
    WEB3: 'Web3', FINANCE: 'Finanzen', MARKETING: 'Marketing', PRODUCT: 'Produkt',
    BUSINESS: 'Wirtschaft', PROGRAMMING: 'Programmierung', STARTUP: 'Startup', AI: 'KI',
    DAILY: 'Alltag', ENTERTAINMENT: 'Unterhaltung', RANT: 'Beschwerde', MEME: 'Meme',
    PROMOTION: 'Werbung',
  },
}

function browserLocale(): string {
  return typeof navigator === 'undefined' ? 'en-US' : navigator.language
}

export function resolveLocale(
  preference: LocalePreference = 'auto',
  detected = browserLocale(),
): SupportedLocale {
  if (preference !== 'auto') return preference
  const normalized = detected.toLowerCase()
  return (
    SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === normalized) ??
    SUPPORTED_LOCALES.find(
      (locale) => locale.split('-')[0] === normalized.split('-')[0],
    ) ??
    'en-US'
  )
}

export function t(
  key: MessageKey,
  preference: LocalePreference = 'auto',
  params: Record<string, string | number> = {},
): string {
  let message = MESSAGES[resolveLocale(preference)][key]
  for (const [name, value] of Object.entries(params)) {
    message = message.replaceAll(`{${name}}`, String(value))
  }
  return message
}

export function tagLabel(
  key: string,
  preference: LocalePreference = 'auto',
): string {
  return (
    TAGS[resolveLocale(preference)][key] ??
    key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')
  )
}
