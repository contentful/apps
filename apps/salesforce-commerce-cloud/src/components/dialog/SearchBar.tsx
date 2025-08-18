import React, { useState } from 'react';
import { css } from '@emotion/react';

import {
  Flex,
  Box,
  /* Text, */ TextInput,
  Spinner,
  Button,
  Tooltip,
  Grid,
} from '@contentful/f36-components';
import { SearchIcon, CloseIcon, ErrorCircleIcon, AssetIcon, TagsIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';

import { DialogInvocationParameters } from '../../locations/Dialog';

interface SearchBarProps {
  query: string;
  isLoading: boolean;
  stickyHeaderBreakpoint: number;
  saveIsDisabled: boolean;
  selectedItems?: string | string[];
  selectedData: any[];
  onQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  removeSelected: (id: string) => void;
}

interface SearchControlProps extends SearchBarProps {
  fieldType: 'product' | 'category';
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const SearchBar = (props: SearchBarProps) => {
  const sdk = useSDK<DialogAppSDK>();
  const { fieldType } = sdk.parameters.invocation as DialogInvocationParameters;

  const headerStyles = css`
    border-bottom: 1px solid ${tokens.gray300};
    padding: ${tokens.spacingM} ${tokens.spacingL} ${tokens.spacingL} ${tokens.spacingL};
    background-color: white;
    position: sticky;
    top: 0;
    z-index: 1;
  `;

  const controlProps = { ...props, fieldType };

  return (
    <Flex as="header" justifyContent="space-between" alignItems="center" css={headerStyles}>
      <LeftSideControls {...controlProps} />
      <RightSideControls {...controlProps} />
    </Flex>
  );
};

const LeftSideControls = (props: SearchControlProps) => {
  const wrapperStyles = css`
    position: relative;
    z-index: 0;
  `;

  const textInputStyles = css`
    padding-left: 35px;
  `;

  const searchIconStyles = css`
    z-index: 1;
    position: absolute;
    top: 10px;
    left: 10px;
  `;

  // const countTextStyles = css`
  //   font-size: ${tokens.fontSizeS};
  //   color: ${tokens.gray600};
  //   display: block;
  //   margin-top: ${tokens.spacingS};
  // `

  return (
    <Box css={wrapperStyles}>
      <Flex flexDirection="row" alignItems="center">
        <TextInput
          placeholder={`Search for a ${props.fieldType}...`}
          type="search"
          name="item-search"
          id="item-search"
          css={textInputStyles}
          onChange={props.onQueryChange}
          value={props.query}
        />
        <SearchIcon variant="muted" css={searchIconStyles} />
        {props.isLoading && (
          <Box marginLeft="spacingS">
            <Spinner />
          </Box>
        )}
      </Flex>
      {/* <Text css={countTextStyles}>Total results: </Text> */}
    </Box>
  );
};

const RightSideControls = (props: SearchControlProps) => {
  return (
    <Flex justifyContent="flex-end" alignItems="center" flexGrow={1} gap="spacingM">
      <SelectionList
        items={props.selectedItems}
        itemsInfo={props.selectedData}
        removeSelected={props.removeSelected}
        fieldType={props.fieldType}
      />
      <Button variant="primary" onClick={props.onSave} isDisabled={props.saveIsDisabled}>
        Save
      </Button>
    </Flex>
  );
};

interface SelectionListProps {
  items?: string | string[];
  itemsInfo: any[];
  removeSelected: (item: string) => void;
  fieldType: 'product' | 'category';
}

const SelectionList = (props: SelectionListProps) => {
  const items: string[] | undefined = typeof props.items === 'string' ? [props.items] : props.items;

  // console.log(props)
  const findItemData = (itemId: string, fieldType: 'product' | 'category', itemsInfo?: any[]) => {
    if (itemsInfo?.length) {
      return itemsInfo.find((item) => {
        return fieldType === 'product'
          ? item.id === itemId
          : `${item.catalogId}:${item.id}` === itemId;
      });
    }
  };

  return (
    <Flex gap="spacingXs" flexWrap="wrap" alignItems="center">
      {items &&
        items.map((itemId: string) => (
          <SelectionListItem
            key={itemId}
            itemId={itemId}
            itemData={findItemData(itemId, props.fieldType, props.itemsInfo)}
            removeSelected={props.removeSelected}
            fieldType={props.fieldType}
          />
        ))}
    </Flex>
  );
};

interface SelectionListItemProps {
  itemId: string;
  itemData: any;
  fieldType: 'product' | 'category';
  removeSelected: (id: string) => void;
}

const SelectionListItem = (props: SelectionListItemProps) => {
  const { itemId, itemData, fieldType } = props;

  const [imageHasLoaded, setImageHasLoaded] = useState<boolean>(false);
  const [imageHasErrored, setImageHasErrored] = useState<boolean>(false);

  const ItemIcon = (props: { fieldType: string }) => {
    return props.fieldType === 'product' ? <AssetIcon /> : <TagsIcon />;
  };

  const getProductPreviewImageUrl = (productInfo?: any) => {
    return productInfo?.image?.absUrl || '';
  };

  const selectedItemWrapperStyles = css`
    border: 1px solid;
    border-color: ${tokens.gray200};
    border-radius: 3px;
    height: 40px;
    width: 40px;
    transition: all ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault};
    transform: translateZ(0);
    will-change: border-color;
    &:hover {
      border-color: ${tokens.gray500};
      cursor: pointer;
      & span > div {
        opacity: 1;
      }
    }
  `;

  const closeActionStyles = css`
    background-color: rgba(0, 0, 0, 0.65);
    border-radius: 50%;
    color: white;
    opacity: 0;
    width: 28px;
    height: 28px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: opacity ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault};
    & svg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  `;

  const selectedItemIconStyles = css`
    background-color: ${tokens.gray100};
    width: 100%;
    height: 40px;
    position: relative;
    z-index: -1;
    & svg {
      fill: ${tokens.gray600};
      width: 100%;
      height: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  `;

  const selectedItemImageStyles = css`
    display: ${imageHasLoaded ? 'block' : 'none'};
    margin: 0 auto;
    min-width: auto;
    height: 40px;
    overflow: hidden;
  `;

  return (
    <Flex
      role="switch"
      aria-checked={true}
      onKeyUp={noop}
      onClick={() => props.removeSelected(itemId)}
      flexDirection="column"
      css={selectedItemWrapperStyles}>
      <Tooltip content={itemId} placement="bottom">
        <Box css={closeActionStyles}>
          <CloseIcon variant="white" />
        </Box>

        {fieldType === 'category' && (
          <Box css={selectedItemIconStyles}>{itemData ? <TagsIcon /> : <ErrorCircleIcon />}</Box>
        )}
        {fieldType === 'product' && (
          <>
            <Box css={selectedItemIconStyles}>
              {!itemData ? <ErrorCircleIcon /> : <ItemIcon fieldType={fieldType} />}
            </Box>
            {itemData && (
              <img
                alt="Product Preview"
                onError={() => setImageHasErrored(true)}
                onLoad={() => setImageHasLoaded(true)}
                src={getProductPreviewImageUrl(itemData)}
                css={selectedItemImageStyles}
              />
            )}
          </>
        )}
      </Tooltip>
    </Flex>
  );
};

export default SearchBar;
