import React from 'react';
import { css } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';

// Contentful Imports
import { Card, Flex, Text, IconButton, Box } from '@contentful/f36-components';
import { WarningIcon, ExternalLinkIcon, CloseIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';

// Local Imports
import { AppInstallationParameters } from '../../locations/ConfigScreen';
import SfccClient from '../../utils/Sfcc';

interface ItemProps {
  id: string;
  type: 'product' | 'category';
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
  const sdk = useSDK<FieldAppSDK>();
  const installParameters = sdk.parameters.installation as AppInstallationParameters;
  const client = new SfccClient(installParameters);

  const [itemId, catalogId] = props.id.split(':');
  const { isLoading, data: itemData } = useQuery({
    queryKey: ['itemInfo', props.id],
    queryFn:
      props.type === 'product'
        ? () => client.fetchProduct(itemId)
        : () => client.fetchCategory(itemId, catalogId),
  });

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
  itemData: any;
}

const ItemPreview = (props: ItemPreviewProps) => {
  const { itemData } = props;
  const useImage = props.type === 'product';

  const categoryStyle = css`
    margin-left: ${tokens.spacingXs};
  `;

  // const externalLink = props.type === 'product' ? 'https://example.com' : 'https://google.com'
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
          {itemData.name?.default || 'Untitled Item'}
        </Text>
        <Text as="div" fontWeight="fontWeightMedium" fontSize="fontSizeS" fontColor="gray600">
          ID: {itemData.id}
          {props.type === 'category' && (
            <>
              <Box
                as="span"
                css={css`
                  margin-left: ${tokens.spacingXs};
                `}>
                |
              </Box>
              <Box as="span" css={categoryStyle}>
                Catalog: {itemData.name?.default || itemData.catalogId}
              </Box>
            </>
          )}
        </Text>
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
  return (
    <>
      <WarningIcon variant="warning" />
      <Text marginLeft="spacingS">
        {props.type.charAt(0).toUpperCase() + props.type.slice(1)} not found: {props.id}
      </Text>
      <ItemActions id={props.id} type={props.type} onRemove={props.onRemove} />
    </>
  );
};

export default ItemCard;
