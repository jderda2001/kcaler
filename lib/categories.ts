import type { FoodCategory } from '@/types';

export const CATEGORY_COLOR: Record<FoodCategory, string> = {
  pieczywo: 'hsl(35 60% 55%)',
  nabial: 'hsl(45 90% 70%)',
  jaja: 'hsl(40 85% 60%)',
  mieso: 'hsl(0 60% 55%)',
  ryby: 'hsl(200 60% 55%)',
  warzywa: 'hsl(140 50% 45%)',
  owoce: 'hsl(340 65% 60%)',
  zboza: 'hsl(30 50% 60%)',
  straczkowe: 'hsl(85 40% 45%)',
  orzechy: 'hsl(25 40% 50%)',
  tluszcze: 'hsl(50 85% 60%)',
  slodycze: 'hsl(310 50% 55%)',
  napoje: 'hsl(210 70% 55%)',
  fast_food: 'hsl(15 70% 55%)',
  gotowe: 'hsl(265 40% 55%)',
  inne: 'hsl(0 0% 65%)',
};

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  pieczywo: 'Pieczywo',
  nabial: 'Nabiał',
  jaja: 'Jaja',
  mieso: 'Mięso',
  ryby: 'Ryby',
  warzywa: 'Warzywa',
  owoce: 'Owoce',
  zboza: 'Zboża',
  straczkowe: 'Strączkowe',
  orzechy: 'Orzechy',
  tluszcze: 'Tłuszcze',
  slodycze: 'Słodycze',
  napoje: 'Napoje',
  fast_food: 'Fast food',
  gotowe: 'Gotowe',
  inne: 'Inne',
};
