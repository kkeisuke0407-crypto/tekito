/**
 * 害獣駆除PPC比較LP（/gaiju/nezumi/ ・ /gaiju/koumori/ ・ /gaiju/hakubishin/）用 providerデータ
 *
 * ■ 追加ルール
 * - active=false のproviderはDOMへ一切出力しない（「準備中」「後入れ」等も表示しない）。
 * - providerを追加するときは、各社公式サイトとASP条件を確認したうえで実データを入れる。
 * - 成果報酬額を順位の根拠として画面に表示しない。
 * - アフィリエイト提携済みのproviderのみ affiliateUrl を設定する。
 *   affiliateUrl が空のproviderはCTAを描画せず、比較情報のみ掲載する（架空URLへ送らない）。
 * - showOn を指定したproviderは、そのページでのみ表示される（未指定なら全ページ）。
 *
 * ■ 出典について
 * 2位以降は各社が公開している情報（対応エリア・受付時間・保証年数など）をもとに記載。
 * verifiedAt は当サイトで内容を確認した日付。条件は変更されるため、
 * 掲載前・広告出稿前に必ず各社公式サイトで再確認すること。
 */
import type { AnimalKey } from './gaiju-lp-config';

export type Provider = {
  rank: number;
  active: boolean;
  name: string;
  slug: string;
  /** 運営会社名（公表されている場合） */
  company: string;
  /** ASP発行のアフィリエイトURL。提携前・未確定の間は空文字（架空URLを入れない）。 */
  affiliateUrl: string;
  /** 情報確認用の公式サイトURL。画面には出力せず、再確認時の参照に使う。 */
  officialUrl: string;
  /** 掲載ページ。未指定なら全ページに掲載する。 */
  showOn?: AnimalKey[];
  /** 記載内容を確認した日付（YYYY-MM-DD） */
  verifiedAt: string;
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

/** 公式に明記が見つからなかった項目に使う表記（比較表を空欄にしない） */
const UNCONFIRMED = '公式サイトで要確認';

export const providers: Provider[] = [
  {
    rank: 1,
    active: true,
    name: 'ハウスガード24',
    slug: 'houseguard24',
    company: '',
    affiliateUrl: '',
    officialUrl: 'https://houseguard24.saki-x.jp/lp02/',
    verifiedAt: '2026-08-18',
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
    active: true,
    name: 'ハウスプロテクト',
    slug: 'house-protect',
    company: '株式会社GROWTH',
    affiliateUrl: '',
    officialUrl: 'https://house-protect.net/',
    showOn: ['nezumi'],
    verifiedAt: '2026-08-18',
    investigation: '0円',
    estimate: '0円',
    area: '関東・関西・東海・中四国・九州（35都府県）',
    reception: '24時間365日',
    sameDay: UNCONFIRMED,
    speed: UNCONFIRMED,
    entryPointWork: '侵入口の封鎖に対応',
    recurrencePrevention: '再発防止対策あり',
    guarantee: '最長10年保証',
    webConsultation: 'あり',
    overall: '保証期間の長さで評価',
    animals: ['ネズミ', 'コウモリ', 'イタチ', 'ハクビシン', 'アライグマ'],
    strengths: [
      '現地調査・見積もり0円',
      '24時間365日受付',
      '最長10年保証',
      'リフォーム施工に対応し再発防止を重視',
    ],
    notes: [
      '北海道・東北・北陸・沖縄は対象外',
      '保証内容・適用条件は公式サイトで確認',
    ],
  },
  {
    rank: 3,
    active: true,
    name: '害獣BUZZ',
    slug: 'gaiju-buzz',
    company: '株式会社リブシー',
    affiliateUrl: '',
    officialUrl: 'https://gaijyu-buzz.com/',
    showOn: ['nezumi'],
    verifiedAt: '2026-08-18',
    investigation: '0円',
    estimate: '0円',
    area: '関東・東海・関西・中四国・九州',
    reception: '24時間365日（WEB受付）',
    sameDay: '対応あり',
    speed: '最短30分',
    entryPointWork: '侵入口の封鎖に対応',
    recurrencePrevention: '施工1年後の無料点検あり',
    guarantee: '最長10年保証',
    webConsultation: 'あり',
    overall: '対応スピードと保証を評価',
    animals: ['ネズミ', 'コウモリ', 'イタチ', 'ハクビシン', 'アライグマ'],
    strengths: [
      '現地調査・見積もり0円',
      '最短30分で現地対応',
      '最長10年保証',
      '施工1年後の無料点検',
    ],
    notes: [
      '北海道・東北・北陸・沖縄等は対象外',
      '保証内容・適用条件は公式サイトで確認',
    ],
  },
  {
    rank: 4,
    active: true,
    name: 'ホームレスキュー',
    slug: 'home-rescue',
    company: 'ホームレスキュー株式会社',
    affiliateUrl: '',
    officialUrl: 'https://kujo-service.com/',
    showOn: ['nezumi'],
    verifiedAt: '2026-08-18',
    investigation: '0円',
    estimate: '0円',
    area: '関東・中部・関西・九州（全国13拠点）',
    reception: UNCONFIRMED,
    sameDay: '対応あり',
    speed: '最短30分で現地到着',
    entryPointWork: '侵入口の封鎖に対応',
    recurrencePrevention: '再発防止対策あり',
    guarantee: '最長10年保証',
    webConsultation: 'あり（フォーム・LINE）',
    overall: '拠点数と保証を評価',
    animals: ['ネズミ', 'コウモリ', 'イタチ', 'ハクビシン', 'アライグマ'],
    strengths: [
      '現地調査・見積もり0円',
      '全国13拠点',
      '最長10年保証',
      'フォーム・LINEから相談できる',
    ],
    notes: [
      '対応エリアは拠点により異なる',
      '保証内容・適用条件は公式サイトで確認',
    ],
  },
  {
    rank: 5,
    active: true,
    name: 'ねずみ110番',
    slug: 'nezumi110ban',
    company: '株式会社シェアリングテクノロジー',
    affiliateUrl: '',
    officialUrl: 'https://www.sharing-tech.co.jp/nezumi/',
    showOn: ['nezumi'],
    verifiedAt: '2026-08-18',
    investigation: '0円',
    estimate: '0円',
    area: '全国（一部地域を除く）',
    reception: '24時間365日',
    sameDay: UNCONFIRMED,
    speed: UNCONFIRMED,
    entryPointWork: '侵入口の封鎖に対応',
    recurrencePrevention: '再発防止施工あり',
    guarantee: '1年間の再発防止保証',
    webConsultation: 'あり',
    overall: '対応エリアの広さを評価',
    animals: ['ネズミ'],
    strengths: [
      '現地調査・見積もり0円',
      '24時間365日受付',
      '対応エリアが広い',
      '1年間の再発防止保証',
    ],
    notes: [
      '加盟店を紹介するサービス。施工は加盟店が行う',
      '料金・保証条件は紹介先により異なる場合がある',
    ],
  },
];

/** 指定ページに掲載してよいproviderだけを返す */
export function activeProvidersFor(animal: string): Provider[] {
  return providers
    .filter((p) => p.active)
    .filter((p) => !p.showOn || p.showOn.includes(animal as AnimalKey))
    .sort((a, b) => a.rank - b.rank);
}

export function getProvider(slug: string): Provider | undefined {
  return providers.find((p) => p.active && p.slug === slug);
}

/** 比較社数はページごとのactive件数から動的に決める（3社未満は社数を書かない） */
export function comparisonTitleFor(animal: string): string {
  const count = activeProvidersFor(animal).length;
  return count >= 3 ? `害獣駆除サービス${count}社を比較` : '害獣駆除サービスを比較';
}

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
