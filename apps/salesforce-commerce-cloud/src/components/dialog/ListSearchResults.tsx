import React from 'react';
import { css } from '@emotion/react';

import tokens from '@contentful/f36-tokens';
import { Badge, Box, Card, Flex, Text } from '@contentful/f36-components';
import { TagsIcon } from '@contentful/f36-icons';

import { SearchResultsProps, SearchResultProps, height } from './SearchPicker';
import { describeItem, getItemStatus, itemKey } from '../../utils/resources';

// Text-only result list used for every field type except products (which render as a grid).
const ListSearchResults = (props: SearchResultsProps) => {
  const resultsWrapperStyle = css`
    max-height: ${height}px;
    padding: ${tokens.spacingL};
    overflow-y: auto;
  `;

  return (
    <Box as="section" css={resultsWrapperStyle}>
      {props.searchResults.map((result) => (
        <ListSearchResult
          key={itemKey(props.fieldType, result)}
          fieldType={props.fieldType}
          onItemSelect={props.onItemSelect}
          selected={props.selectedItems}
          result={result}
          locale={props.locale}
        />
      ))}
    </Box>
  );
};

const ListSearchResult = (props: SearchResultProps) => {
  const { result, fieldType, onItemSelect, selected, locale } = props;
  const resultId = itemKey(fieldType, result);
  const isSelected =
    typeof selected === 'string' ? selected === resultId : selected?.includes(resultId);
  const { title, detail } = describeItem(fieldType, result, locale);
  const statuses = getItemStatus(fieldType, result);

  return (
    <Card
      id={resultId}
      padding="none"
      marginBottom="spacingS"
      onClick={() => onItemSelect(resultId)}
      isSelected={isSelected}>
      <Flex flexDirection="column">
        <Flex alignItems="center" padding="spacingXs">
          <TagsIcon />
          <Flex flexDirection="column" marginLeft="spacingS">
            <Text as="div" fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
              {title}
            </Text>
            <Text as="div" fontWeight="fontWeightMedium" fontSize="fontSizeS" fontColor="gray600">
              ID: {result.id}
              {detail && ` | ${detail}`}
            </Text>
          </Flex>
          {statuses.length > 0 && (
            <Flex gap="spacingXs" marginLeft="spacingS">
              {statuses.map((status) => (
                <Badge key={status.label} variant={status.variant}>
                  {status.label}
                </Badge>
              ))}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
};

export default ListSearchResults;
