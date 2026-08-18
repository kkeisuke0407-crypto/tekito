/**
 * 害獣駆除PPC比較LPのサイト設定。
 * URLが未確定のものは null にしておき、架空URLを作らない（null のリンクは描画しない）。
 */
export const gaijuLpConfig = {
  siteName: '害獣駆除の相場ナビ',
  siteUrl: 'https://vpscomparehub.com',
  /**
   * フッターリンク。href が null の項目はフッターに出力されない。
   */
  footerLinks: [
    { label: '運営者情報', href: '/gaiju/operator/' },
    { label: 'プライバシーポリシー', href: '/gaiju/privacy/' },
    { label: 'お問い合わせ', href: 'mailto:securewebtech6676@gmail.com' },
    { label: '広告・PRポリシー', href: '/gaiju/operator/#ad-policy' },
  ] as { label: string; href: string | null }[],
} as const;

export type AnimalKey = 'nezumi' | 'koumori' | 'hakubishin';
