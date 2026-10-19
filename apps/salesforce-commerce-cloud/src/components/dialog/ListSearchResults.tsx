import React from 'react';
import { css } from '@emotion/react';

import tokens from '@contentful/f36-tokens';
import { Box, Card, Flex, Text } from '@contentful/f36-components';
import { TagsIcon } from '@contentful/f36-icons';

import {
  SearchResultsProps,
  SearchResultProps,
  height,
  stickyHeaderBreakpoint,
  headerHeight,
} from './SearchPicker';

const CategorySearchResults = (props: SearchResultsProps) => {
  const resultsWrapperStyle = css`
    max-height: ${height}px;
    padding: ${tokens.spacingL};
    overflow-y: auto;
  `;

  return (
    <Box as="section" css={resultsWrapperStyle}>
      {props.searchResults.map((result) => (
        <CategorySearchResult
          key={`${result.catalogId}:${result.id}`}
          fieldType={props.fieldType}
          onItemSelect={props.onItemSelect}
          selected={props.selectedItems}
          result={result}
        />
      ))}
    </Box>
  );
};

const CategorySearchResult = (props: SearchResultProps) => {
  const { result, fieldType, onItemSelect, selected } = props;
  const resultId = fieldType === 'product' ? result.id : `${result.catalogId}:${result.id}`;

  const categoryStyle = css`
    margin-left: ${tokens.spacingXs};
  `;

  return (
    <Card
      id={resultId}
      padding="none"
      marginBottom="spacingS"
      onClick={() => onItemSelect(resultId)}
      isSelected={selected?.includes(resultId)}>
      <Flex flexDirection="column">
        <Flex alignItems="center" padding="spacingXs">
          <TagsIcon />
          <Flex flexDirection="column" marginLeft="spacingS">
            <Text as="div" fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
              {result.name?.default || 'Untitled Category'}
            </Text>
            <Text as="div" fontWeight="fontWeightMedium" fontSize="fontSizeS" fontColor="gray600">
              ID: {result.id}
              <Box
                as="span"
                css={css`
                  margin-left: ${tokens.spacingXs};
                `}>
                |
              </Box>
              <Box as="span" css={categoryStyle}>
                Catalog: {result.name?.default || result.catalogId}
              </Box>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

export default CategorySearchResults;
