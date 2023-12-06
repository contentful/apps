import { Text, Tooltip } from '@contentful/f36-components';
import { CheckCircleIcon } from '@contentful/f36-icons';
import { ContentFields } from 'contentful-management';
import { ReactElement, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useWidgetStore } from '../../../../stores/widgets.store';
import { DISABLED_FIELD_TYPES } from '../../constants';
import { Selector } from './LocationSelector';

const StyledLink = styled(Link)<{ isDisabled: boolean }>`
  text-decoration: none;
  pointer-events: ${({ isDisabled }) => (isDisabled ? 'none' : 'auto')};
`;

const TooltipWrapper = ({
  children,
  isWrapped,
}: {
  children: ReactElement;
  isWrapped: boolean;
}) => {
  if (!isWrapped) return children;
  return (
    <Tooltip placement="left" content="This field type is not supported.">
      {children}
    </Tooltip>
  );
};

export function FieldSelectorElement({ field }: { field: ContentFields }) {
  const params = useParams();

  const contentTypeDefs = useWidgetStore((state) => state.contentTypeDefs);

  const selectedContentType = useMemo(() => {
    if (!params.contentTypeId) {
      throw new Error('something wrong with params');
    }
    return contentTypeDefs[params.contentTypeId];
  }, [contentTypeDefs]);

  const isEmpty = useMemo(() => {
    return !selectedContentType.fields[field.id]?.widgets;
  }, [selectedContentType, selectedContentType.fields]);

  const isDisabled = useMemo(() => {
    return DISABLED_FIELD_TYPES.includes(field.type);
  }, [field]);

  return (
    <TooltipWrapper isWrapped={isDisabled}>
      <StyledLink isDisabled={isDisabled} to={`/ct/${selectedContentType.id}/field/${field.id}`}>
        <Selector selected={params.fieldId === field.id} gap="spacingS" alignItems="center">
          <Text fontSize="fontSizeM" fontColor={isDisabled ? 'gray400' : 'gray900'}>
            {field.name}
          </Text>{' '}
          {!isEmpty ? <CheckCircleIcon size="tiny" variant="muted" /> : null}
        </Selector>
      </StyledLink>
    </TooltipWrapper>
  );
}
