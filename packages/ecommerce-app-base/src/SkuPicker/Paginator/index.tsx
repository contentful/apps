import React from 'react';
import clamp from 'lodash/clamp';
import range from 'lodash/range';
import { doubleChevron } from '../iconsInBase64';
import { styles } from './styles';

import { Button } from '@contentful/f36-components';

import { ChevronLeftIcon, ChevronRightIcon } from '@contentful/f36-icons';

export interface Props {
  activePage: number;
  className?: string;
  pageCount: number;
  setActivePage: (page: number) => void;
}

export function getPagesRange(page: number, total: number, neighboursCount = 2): number[] {
  const PAGINATOR_RANGE = neighboursCount * 2;

  if (total <= PAGINATOR_RANGE) {
    // Total amount of pages are less than the possible paginator range
    return range(0, total);
  }
  if (page <= neighboursCount) {
    // Active page is at the start of the paginator page count
    return range(0, PAGINATOR_RANGE + 1);
  }
  if (page > total - neighboursCount) {
    // Active page is at the end of the paginator page count
    return range(total - PAGINATOR_RANGE - 1, total);
  }
  // Active page is in the middle of the paginator count
  return range(page - neighboursCount - 1, page + neighboursCount);
}

export function Paginator(props: Props) {
  const { className, pageCount, setActivePage } = props;
  const activePage = clamp(props.activePage, 1, pageCount);
  const hasOnlyOnePage = pageCount === 1;
  const activePageIsAtPaginatorStart = activePage === 1;
  const activePageIsAtPaginatorEnd = activePage === pageCount;

  return (
    <div className={className}>
      <Button
        className={styles.button}
        variant="secondary"
        isDisabled={hasOnlyOnePage || activePageIsAtPaginatorStart}
        onClick={() => setActivePage(1)}
      >
        <img className={styles.chevronLeft} src={doubleChevron} alt="right" />
      </Button>
      <Button
        startIcon={<ChevronLeftIcon />}
        className={styles.button}
        variant="secondary"
        isDisabled={hasOnlyOnePage || activePageIsAtPaginatorStart}
        onClick={() => setActivePage(activePage - 1)}
      />
      {getPagesRange(activePage, pageCount).map((pageIndex) => {
        const page = pageIndex + 1;
        return (
          <Button
            onClick={() => setActivePage(page)}
            className={styles.button}
            variant={page === activePage ? 'primary' : 'secondary'}
            testId={page === activePage ? 'active' : `inactive-${page}`}
            key={pageIndex}
          >
            {page}
          </Button>
        );
      })}
      <Button
        startIcon={<ChevronRightIcon />}
        variant="secondary"
        className={styles.button}
        isDisabled={hasOnlyOnePage || activePageIsAtPaginatorEnd}
        onClick={() => setActivePage(activePage + 1)}
      />
      <Button
        variant="secondary"
        className={styles.button}
        isDisabled={hasOnlyOnePage || activePageIsAtPaginatorEnd}
        onClick={() => setActivePage(pageCount)}
      >
        <img className={styles.chevronRight} src={doubleChevron} alt="right" />
      </Button>
    </div>
  );
}
