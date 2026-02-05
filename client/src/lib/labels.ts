import type { BurdenOption, MetaConclusionType } from 'shared';

export const BURDEN_LABELS: Record<BurdenOption, string> = {
  me: 'Ja',
  partner: 'Druga osoba',
  both: 'Oboje',
  dont_remember: 'Nie pamiętam',
};

export const META_TYPE_LABELS: Record<MetaConclusionType, string> = {
  bias: 'Bias poznawczy',
  rule: 'Zasada',
  red_flag: 'Red flag',
};

export const RATING_LABELS: Record<number, string> = {
  1: 'Bardzo zła',
  2: 'Zła',
  3: 'Neutralna',
  4: 'Dobra',
  5: 'Bardzo dobra',
};

export const DECISION_STATUS_LABELS: Record<string, string> = {
  proposal: 'Propozycja',
  approved: 'Zatwierdzona',
  closed: 'Zamknięta',
};
