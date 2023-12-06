import { Card, Collapse, Flex, IconButton, TextLink } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import arrayMove from 'array-move';
import * as React from 'react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import {
  Asset,
  Config,
  DeleteFn,
  ThumbnailFn,
  GetAdditionalDataFn,
  AdditionalData,
} from '../interfaces';
import FileIcon from '../Icons/FileIcon';

interface Props {
  disabled: boolean;
  onChange: (data: Asset[]) => void;
  config: Config;
  resources: Asset[];
  makeThumbnail: ThumbnailFn;
  getAdditionalData: GetAdditionalDataFn | null;
}

interface SortableContainerProps {
  disabled: boolean;
  config: Config;
  resources: Asset[];
  deleteFn: DeleteFn;
  makeThumbnail: ThumbnailFn;
  getAdditionalData: GetAdditionalDataFn | null;
}

interface DragHandleProps {
  url: string | undefined;
  alt: string | undefined;
  additionalData: AdditionalData | null;
}

interface AdditionalDataDisplayProps {
  additionalData: AdditionalData;
}
interface SortableElementProps extends DragHandleProps {
  disabled: boolean;
  onDelete: () => void;
  additionalData: AdditionalData | null;
}

const styles = {
  container: css({
    maxWidth: '600px',
  }),
  grid: css({
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: 'repeat(3, 1fr)',
  }),
  card: (disabled: boolean) =>
    css({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '10px',
      position: 'relative',
      cursor: disabled ? 'move' : 'pointer',
      img: {
        display: 'block',
        maxWidth: '150px',
        maxHeight: '100px',
        margin: 'auto',
        userSelect: 'none', // Image selection sometimes makes drag and drop ugly.
      },
    }),
  remove: css({
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: 'white',
    padding: 0,
    minHeight: 'initial',
  }),
  altTextContainer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '150px',
    maxHeight: '100px',
    color: tokens.gray500,
  }),
  altTextDisplay: css({
    wordBreak: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    color: tokens.gray500,
  }),
  primaryAdditionalData: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.gray800,
  }),
  secondaryAdditionalData: css({
    color: tokens.gray500,
  }),
  textlink: css({
    marginTop: tokens.spacingXs,
  }),
};

const AdditionalDataDisplay = ({ additionalData }: AdditionalDataDisplayProps) => {
  return (
    <Flex flexDirection="column" marginTop="spacingXs">
      <p className={styles.primaryAdditionalData}>{additionalData.primary}</p>
      <p className={styles.secondaryAdditionalData}>{additionalData.secondary}</p>
    </Flex>
  );
};

const DragHandle = SortableHandle<DragHandleProps>(
  ({ url, alt, additionalData }: DragHandleProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (!url && !alt) {
      return (
        <div className={styles.altTextContainer}>
          <p className={styles.altTextDisplay}>Asset not available</p>
        </div>
      );
    }

    if (additionalData) {
      // if additional data is provided then the "more details" section will be visible
      if (!url) {
        return (
          <div>
            <Flex justifyContent="center" title={alt}>
              <FileIcon />
            </Flex>
            {<AdditionalDataDisplay additionalData={additionalData} />}
          </div>
        );
      } else {
        return (
          <>
            <div>
              <img src={url} alt={alt} title={alt} />
              <Collapse isExpanded={isExpanded}>
                {<AdditionalDataDisplay additionalData={additionalData} />}
              </Collapse>
            </div>
            <TextLink
              as="button"
              onClick={() => setIsExpanded((currentIsExpanded) => !currentIsExpanded)}
              className={styles.textlink}>
              {isExpanded ? 'Hide details' : 'More details'}
            </TextLink>
          </>
        );
      }
    } else {
      // display default asset card when no additional data is provided
      if (!url) {
        return (
          <div className={styles.altTextContainer}>
            <FileIcon />
            <p className={styles.altTextDisplay} title={alt}>
              {alt}
            </p>
          </div>
        );
      } else {
        return (
          <div>
            <img src={url} alt={alt} title={alt} />
          </div>
        );
      }
    }
  }
);

const SortableItem = SortableElement<SortableElementProps>((props: SortableElementProps) => {
  return (
    <Card className={styles.card(props.disabled)}>
      <DragHandle url={props.url} alt={props.alt} additionalData={props.additionalData} />
      {!props.disabled && (
        <IconButton
          variant="transparent"
          icon={<CloseIcon variant="muted" />}
          aria-label="Close"
          onClick={props.onDelete}
          className={styles.remove}
        />
      )}
    </Card>
  );
});

const SortableList = SortableContainer<SortableContainerProps>((props: SortableContainerProps) => {
  // Provide stable keys for all resources so images don't blink.
  const { list } = props.resources.reduce(
    (acc, resource, index) => {
      const [url, alt] = props.makeThumbnail(resource, props.config);

      const additionalData = props.getAdditionalData?.(resource) || null;

      const item = { url, alt, key: `url-unknown-${index}`, additionalData };
      const counts = { ...acc.counts };

      // URLs are used as keys.
      // It is possible to include the same image more than once.
      // We count usages of the same URL and use the count in keys.
      // This can be considered an edge-case but still - should be covered.
      if (url) {
        counts[url] = counts[url] || 1;
        item.key = [url, counts[url]].join('-');
        counts[url] += 1;
      }

      return {
        counts,
        list: [...acc.list, item],
      };
    },
    { counts: {}, list: [] }
  ) as { list: Asset[] };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {list.map(({ url, alt, key, additionalData }, index) => {
          return (
            <SortableItem
              disabled={props.disabled}
              key={key}
              url={url}
              alt={alt}
              index={index}
              onDelete={() => props.deleteFn(index)}
              additionalData={additionalData}
            />
          );
        })}
      </div>
    </div>
  );
});

export class SortableComponent extends React.Component<Props> {
  onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    const resources = arrayMove(this.props.resources, oldIndex, newIndex);
    this.props.onChange(resources);
  };

  deleteItem = (index: number) => {
    const resources = [...this.props.resources];
    resources.splice(index, 1);
    this.props.onChange(resources);
  };

  render() {
    return (
      <SortableList
        disabled={this.props.disabled}
        onSortStart={(_, e) => e.preventDefault()} // Fixes FF glitches.
        onSortEnd={this.onSortEnd}
        axis="xy"
        resources={this.props.resources}
        config={this.props.config}
        deleteFn={this.deleteItem}
        useDragHandle
        makeThumbnail={this.props.makeThumbnail}
        getAdditionalData={this.props.getAdditionalData}
      />
    );
  }
}
