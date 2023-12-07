import { useContext, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWidgetStore } from '../../../../stores/widgets.store';

import { Flex, Text } from '@contentful/f36-components';
import { CheckCircleIcon, ChevronRightIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import styled from 'styled-components';
import { FieldSelectorElement } from './FieldSelector';
import { ContentTypeListContext } from '../../ContentTypeListContext';

const FlipIcon = styled(ChevronRightIcon)`
  transform: ${(props) => (props.isSelected ? 'rotate(90deg)' : 'none')};
`;

export const Selector = styled(Flex)`
  cursor: pointer;
  background: ${({ selected }) => (selected ? tokens.gray100 : 'none')};
  padding: ${tokens.spacingXs};
  border-radius: ${tokens.borderRadiusSmall};
  text-decoration: none;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
`;

const FieldSelector = styled(Flex)`
  margin-left: ${tokens.spacingXl};
`;

export const LocationSelector = () => {
  const params = useParams();

  const { contentTypeDefs } = useWidgetStore((state) => state);
  const { allContentTypesMap } = useContext(ContentTypeListContext);

  const selectedContentType = useMemo(() => {
    if (!params.contentTypeId) {
      throw new Error('something wrong with params');
    }
    return contentTypeDefs[params.contentTypeId];
  }, [contentTypeDefs]);

  const location = useMemo(() => {
    if (params.fieldId) return 'Field';
    return 'Sidebar';
  }, [params]);

  const [fieldsIsExpanded, setFieldsIsEpxanded] = useState(location === 'Field');

  const selectedContentTypeFields = allContentTypesMap?.[selectedContentType.id]?.fields ?? [];

  return (
    <Flex flexDirection="column" gap="spacingS">
      <StyledLink to={`/ct/${selectedContentType?.id}/sidebar`}>
        <Selector selected={location === 'Sidebar'} gap="spacingS" alignItems="center">
          <ChevronRightIcon variant="secondary" />
          <Text
            fontWeight={location === 'Sidebar' ? 'fontWeightDemiBold' : 'fontWeightNormal'}
            fontSize="fontSizeL">
            Entry Sidebar
          </Text>
          {selectedContentType.sidebar?.widgets && <CheckCircleIcon size="tiny" variant="muted" />}
        </Selector>
      </StyledLink>
      <Selector
        gap="spacingS"
        alignItems="center"
        onClick={() => setFieldsIsEpxanded((prev) => !prev)}>
        <FlipIcon isSelected={fieldsIsExpanded} variant="secondary" />
        <Text
          fontWeight={location === 'Field' ? 'fontWeightDemiBold' : 'fontWeightNormal'}
          fontSize="fontSizeL">
          Fields
        </Text>
      </Selector>
      {fieldsIsExpanded && (
        <FieldSelector flexDirection="column" gap="spacingXs">
          {selectedContentTypeFields.map((field) => (
            <FieldSelectorElement key={field.id} field={field} />
          ))}
        </FieldSelector>
      )}
    </Flex>
  );
};
