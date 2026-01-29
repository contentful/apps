import { CreatorViewSetting } from './types';

export const NEEDS_UPDATE_MONTHS_RANGE = { min: 1, max: 24 };
export const RECENTLY_PUBLISHED_DAYS_RANGE = { min: 1, max: 30 };
export const TIME_TO_PUBLISH_DAYS_RANGE = { min: 7, max: 90 };
export const ITEMS_PER_PAGE = 5;

export const CREATOR_VIEW_OPTIONS: { value: CreatorViewSetting; label: string }[] = [
  { value: CreatorViewSetting.TopFiveCreators, label: 'Top five creators' },
  { value: CreatorViewSetting.BottomFiveCreators, label: 'Bottom five creators' },
  { value: CreatorViewSetting.Alphabetical, label: 'Alphabetical' },
];
