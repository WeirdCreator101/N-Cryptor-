export type CipherMap = Record<string, string>;

export enum AppMode {
  ENCRYPT = 'ENCRYPT',
  DECRYPT = 'DECRYPT'
}

export interface Protocol {
  id: string;
  name: string;
  mapping: CipherMap;
  isCustom: boolean;
  createdAt: number;
}