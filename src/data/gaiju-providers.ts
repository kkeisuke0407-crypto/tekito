/**
 * 害獣駆除PPC比較LP（/gaiju/nezumi/ ・ /gaiju/koumori/ ・ /gaiju/hakubishin/）用 providerデータ
 *
 * ■ 追加ルール
 * - active=false のproviderはDOMへ一切出力しない（「準備中」「後入れ」等も表示しない）。
 * - 2位・3位を追加するときは、必ず各社公式サイトとASP条件を確認したうえで実データを入れ、
 *   affiliateUrl を設定してから active: true にすること。
 * - 成果報酬額を順位の根拠として画面に表示しない。
 * - affiliateUrl が空のまま本番公開しないこと（空の間はCTAクリックで遷移しない実装になっている）。
 */

export type Provider = {
  rank: number;
  active: boolean;
  name: string;
  slug: string;
  /** ASP発行のアフィリエイトURL。未確定の間は空文字のままにする（架空URLを入れない）。 */
  affiliateUrl: string;
  investigation: string;
  estimate: string;
  area: string;
  reception: string;
  sameDay: string;
  speed: string;
  entryPointWork: string;
  recurrencePrevention: string;
  guarantee: string;
  webConsultation: string;
  /** 当サイトの評価基準にもとづく総合評価（報酬額は根拠にしない） */
  overall: string;
  animals: string[];
  strengths: string[];
  notes: string[];
};

export const providers: Provider[] = [
  {
    rank: 1,
    active: true,
    name: 'ハウスガード24',
    slug: 'houseguard24',
    affiliateUrl: '',
    investigation: '0円',
    estimate: '0円',
    area: '関東7県',
    reception: '24時間365日',
    sameDay: '対応あり',
    speed: '最短30分',
    entryPointWork: '対応例あり',
    recurrencePrevention: '対応例あり',
    guarantee: '施工箇所の永年保証制度',
    webConsultation: 'あり',
    overall: '当サイト総合1位',
    animals: ['ネズミ', 'コウモリ', 'イタチ', 'ハクビシン', 'アライグマ'],
    strengths: [
      '現地調査・見積もり0円',
      '関東7県',
      '24時間365日',
      '侵入口対策を含む施工例',
      '施工箇所の永年保証制度',
    ],
    notes: ['保証等には条件あり', '最新条件は公式サイトで確認'],
  },
  {
    rank: 2,
    active: false,
    name: '',
    slug: '',
    affiliateUrl: '',
    investigation: '',
    estimate: '',
    area: '',
    reception: '',
    sameDay: '',
    speed: '',
    entryPointWork: '',
    recurrencePrevention: '',
    guarantee: '',
    webConsultation: '',
    overall: '',
    animals: [],
    strengths: [],
    notes: [],
  },
  {
    rank: 3,
    active: false,
    name: '',
    slug: '',
    affiliateUrl: '',
    investigation: '',
    estimate: '',
    area: '',
    reception: '',
    sameDay: '',
    speed: '',
    entryPointWork: '',
    recurrencePrevention: '',
    guarantee: '',
    webConsultation: '',
    overall: '',
    animals: [],
    strengths: [],
    notes: [],
  },
];

/** 画面に出してよいproviderはこれだけ */
export const activeProviders: Provider[] = providers
  .filter((p) => p.active)
  .sort((a, b) => a.rank - b.rank);

export function getProvider(slug: string): Provider | undefined {
  return activeProviders.find((p) => p.slug === slug);
}

/** 比較社数はactive件数から動的に決める（3社揃うまで「3社比較」と書かない） */
export const comparisonTitle: string =
  activeProviders.length >= 3
    ? `害獣駆除サービス${activeProviders.length}社を比較`
    : '害獣駆除サービスを比較';

/** 比較表の項目（最低12項目） */
export type ComparisonItem = {
  key: keyof Provider;
  label: string;
  /** スマホの重要5項目カードに出す項目 */
  primary?: boolean;
};

export const comparisonItems: ComparisonItem[] = [
  { key: 'animals', label: '対応害獣' },
  { key: 'investigation', label: '現地調査', primary: true },
  { key: 'estimate', label: '見積もり', primary: true },
  { key: 'area', label: '対応地域', primary: true },
  { key: 'reception', label: '受付時間', primary: true },
  { key: 'sameDay', label: '即日対応' },
  { key: 'speed', label: '最短対応' },
  { key: 'entryPointWork', label: '侵入口対策' },
  { key: 'recurrencePrevention', label: '再発対策' },
  { key: 'guarantee', label: '保証', primary: true },
  { key: 'webConsultation', label: 'WEB相談' },
  { key: 'overall', label: '総合評価' },
];

export function comparisonValue(provider: Provider, item: ComparisonItem): string {
  const value = provider[item.key];
  return Array.isArray(value) ? value.join('・') : String(value ?? '');
}

/** 順位の評価基準（画面に掲載する） */
export const rankingCriteria: string[] = [
  '現地調査の費用',
  '見積もりの費用',
  '対象害獣への対応',
  '対応地域',
  '受付体制',
  '対応スピード',
  '侵入口への対策',
  '再発対策',
  '保証',
  'WEB相談のしやすさ',
];
