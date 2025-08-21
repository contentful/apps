import React, { useState } from 'react';
import { css } from '@emotion/react';

import { Box, Flex, SkeletonContainer, SkeletonImage } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

import {
  SearchResultsProps,
  SearchResultProps,
  height,
  headerHeight,
  stickyHeaderBreakpoint,
} from './SearchPicker';

const ProductSearchResults = (props: SearchResultsProps) => {
  const resultsStyles = css`
    max-height: ${height}px;
    padding: ${tokens.spacingL};
    overflow-y: auto;
  `;

  return (
    <Box as="section" css={resultsStyles}>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          margin-left: -${tokens.spacingS};
          margin-right: -${tokens.spacingS};
        `}>
        {props.searchResults.map((result) => (
          <ProductSearchResult
            key={props.fieldType === 'product' ? result.id : `${result.catalogId}:${result.id}`}
            fieldType={props.fieldType}
            onItemSelect={props.onItemSelect}
            selected={props.selectedItems}
            result={result}
          />
        ))}
      </div>
    </Box>
  );
};

const ProductSearchResult = (props: SearchResultProps) => {
  const { result, fieldType, onItemSelect, selected } = props;
  const resultId = fieldType === 'product' ? result.id : `${result.catalogId}:${result.id}`;
  const isSelected =
    typeof selected === 'string' ? result.id === selected : selected?.includes(resultId);

  const [imageHasLoaded, setImageHasLoaded] = useState<boolean>(false);
  const [imageHasErrored, setImageHasErrored] = useState<boolean>(false);

  const productWrapperStyles = css`
    flex: 0 0 calc(50% - ${parseFloat(tokens.spacingS) * 2}rem);
    padding: ${tokens.spacingS};
    position: relative;
    @media screen and (min-width: 767px) {
      flex: 0 0 calc(33.3% - ${parseFloat(tokens.spacingS) * 2}rem);
    }
    @media screen and (min-width: 992px) {
      flex: 0 0 calc(25% - ${parseFloat(tokens.spacingS) * 2}rem);
    }
  `;

  const productStyles = css`
    border: 1px solid ${tokens.gray200};
    border-radius: 3px;
    box-shadow: 0px 0px 0px 1px inset rgba(48, 114, 190, 0), 0 1px 3px rgba(0, 0, 0, 0);
    display: flex;
    flex-direction: column;
    padding: ${tokens.spacingS};
    outline: 0;
    transition: all ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault};
    width: 100%;
    transform: translateZ(0);
    will-change: box-shadow, border-color;
    &:hover {
      border-color: ${tokens.gray400};
      cursor: pointer;
    }
  `;

  const selectedProductStyles = css`
    border-color: rgba(48, 114, 190, 1);
    box-shadow: 0px 0px 0px 1px inset rgba(48, 114, 190, 1), 0 1px 3px rgba(0, 0, 0, 0.08);
    &:hover {
      border-color: rgba(48, 114, 190, 1);
      cursor: pointer;
    }
  `;

  const skeletonImageStyles = css`
    width: 100%;
    height: 290px;
  `;

  const resultNameStyles = css`
    flex: 1 0 auto;
    font-weight: ${tokens.fontWeightDemiBold};
    text-transform: capitalize;
  `;

  const resultIdStyles = css`
    flex: 0 1 auto;
    color: ${tokens.gray600};
    font-size: ${tokens.fontSizeS};
    margin-top: 0;
    margin-bottom: 0;
    max-width: 289px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  `;

  const productStylesCss = [productStyles];
  if (isSelected) {
    productStylesCss.push(selectedProductStyles);
  }

  return (
    <Flex css={productWrapperStyles}>
      <div
        data-test-id={`item-preview-${resultId}`}
        role="switch"
        aria-checked={isSelected}
        tabIndex={-1}
        onClick={() => onItemSelect(resultId)}
        css={productStylesCss}>
        {!imageHasLoaded && !imageHasErrored && (
          <SkeletonContainer css={skeletonImageStyles}>
            <SkeletonImage width={400} height={290} />
          </SkeletonContainer>
        )}
        {imageHasErrored && (
          <div>
            <AssetIcon />
          </div>
        )}
        {!imageHasErrored && (
          <div>
            <img
              onLoad={() => setImageHasLoaded(true)}
              onError={() => setImageHasErrored(true)}
              style={{ display: imageHasLoaded ? 'block' : 'none' }}
              src={result.image?.absUrl}
              alt={result.image?.alt?.default || 'Product image'}
              data-test-id="image"
            />
          </div>
        )}
        <p css={resultNameStyles}>{result.name?.default || 'Untitled Product'}</p>
        <p css={resultIdStyles}>ID: {result.id}</p>
        {fieldType === 'category' && <p css={resultIdStyles}>Catalog ID: {result.catalogId}</p>}
      </div>
    </Flex>
  );
};

export default ProductSearchResults;
