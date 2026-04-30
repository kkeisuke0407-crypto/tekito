export type Currency = 'USD' | 'EUR' | 'JPY';

export interface Plan {
  id: string;
  name: string;
  vcpu: number;
  memoryGB: number;
  storageGB: number;
  storageType: 'NVMe' | 'SSD' | 'HDD' | 'Mixed';
  bandwidthTB: number;
  monthlyPrice: number;
  hourlyPrice?: number;
  currency: Currency;
  regions: string[];
  category?: 'shared' | 'dedicated' | 'highmem' | 'highcpu' | 'storage' | 'gpu';
}

export interface Provider {
  slug: string;
  name: string;
  homepage: string;
  signupUrl: string;
  affiliateProgram?: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  freeTier: boolean;
  freeTrialUSD?: number;
  paymentMethods: string[];
  hqCountry: string;
  founded: number;
  regions: string[];
  plans: Plan[];
  lastUpdated: string;
  source: 'api' | 'scrape' | 'manual';
}
