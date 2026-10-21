import React from 'react';
import { css } from '@emotion/react';

// Contentful Imports
import { Badge, Card, Flex, Text, IconButton } from '@contentful/f36-components';
import { WarningIcon, ExternalLinkIcon, CloseIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

// Local Imports
import { FieldType, SfccItem, describeItem, getItemStatus, labelFor } from '../../utils/resources';
import { useFieldItem } from '../../utils/useFieldItems';

interface ItemProps {
  id: string;
  type: FieldType;
  onRemove: (id: string) => void;
}

interface ItemCardProps extends ItemProps {
  withDragHandle?: boolean;
  dragHandleRender?: (props: {
    isDragging?: boolean;
    drag: React.ReactElement;
  }) => React.ReactElement;
}

const ItemCard = (props: ItemCardProps) => {
  const {
    locale,
    query: { isLoading, data: itemData },
  } = useFieldItem(props.id);

  return (
    <Card
      padding="none"
      isLoading={isLoading}
      withDragHandle={props.withDragHandle}
      dragHandleRender={props.dragHandleRender}>
      <Flex flexDirection="column">
        <Flex alignItems="center" padding="spacingXs">
          {itemData ? (
            <ItemPreview
              id={props.id}
              type={props.type}
              itemData={itemData}
              locale={locale}
              onRemove={props.onRemove}
            />
          ) : (
            <MissingItem type={props.type} id={props.id} onRemove={props.onRemove} />
          )}
        </Flex>
      </Flex>
    </Card>
  );
};

interface ItemPreviewProps extends ItemProps {
  itemData: SfccItem;
  locale?: string;
}

const ItemPreview = (props: ItemPreviewProps) => {
  const { itemData } = props;
  const useImage = props.type === 'product';
  const { title, detail } = describeItem(props.type, itemData, props.locale);
  const statuses = getItemStatus(props.type, itemData);

  const actionsProps: ItemActionsProps = {
    id: props.id,
    type: props.type,
    onRemove: props.onRemove,
  };

  const imageUrl = itemData.image?.absUrl;

  return (
    <>
      {useImage && imageUrl && (
        <img
          src={imageUrl}
          alt={itemData.image?.alt?.default || 'Product image'}
          height="75"
          width="75"
        />
      )}
      <Flex flexDirection="column" marginLeft="spacingS">
        <Text as="div" fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
          {title}
        </Text>
        <Text as="div" fontWeight="fontWeightMedium" fontSize="fontSizeS" fontColor="gray600">
          ID: {itemData.id}
          {detail && ` | ${detail}`}
        </Text>
        {statuses.length > 0 && (
          <Flex gap="spacingXs" marginTop="spacing2Xs">
            {statuses.map((status) => (
              <Badge key={status.label} variant={status.variant}>
                {status.label}
              </Badge>
            ))}
          </Flex>
        )}
        <ItemActions {...actionsProps} />
      </Flex>
    </>
  );
};

interface ItemActionsProps extends ItemProps {
  externalLink?: string;
}

const ItemActions = (props: ItemActionsProps) => {
  const wrapperStyles = css`
    position: absolute;
    top: ${tokens.spacingXs};
    right: ${tokens.spacingXs};
  `;

  const linkStyle = css`
    display: inline-block;
    margin-right: ${tokens.spacingXs};
    &:hover {
      svg {
        fill: ${tokens.colorBlack};
      }
    }
  `;

  const externalIconStyle = css`
    transition: fill ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault};
  `;

  return (
    <div css={wrapperStyles}>
      {props.externalLink && (
        <a target="_blank" rel="noopener noreferrer" href="https://example.com" css={linkStyle}>
          <ExternalLinkIcon color="muted" css={externalIconStyle} />
        </a>
      )}
      <IconButton
        aria-label="Delete"
        icon={<CloseIcon />}
        variant="transparent"
        onClick={() => props.onRemove(props.id)}
      />
    </div>
  );
};

const MissingItem = (props: ItemProps) => {
  const label = labelFor(props.type).singular;
  return (
    <>
      <WarningIcon variant="warning" />
      <Text marginLeft="spacingS">
        {label.charAt(0).toUpperCase() + label.slice(1)} not found: {props.id}
      </Text>
      <ItemActions id={props.id} type={props.type} onRemove={props.onRemove} />
    </>
  );
};

export default ItemCard;
