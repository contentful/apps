import { useCallback, useEffect, useState } from 'react';
import { Card, Collapse, Flex, IconButton, TextLink } from '@contentful/f36-components';
import { XIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';
import { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Asset, Config, ThumbnailFn, GetAdditionalDataFn, AdditionalData } from '../interfaces';
import FileIcon from '../Icons/FileIcon';

interface Props {
  disabled: boolean;
  onChange: (data: Asset[]) => void;
  config: Config;
  resources: Asset[];
  makeThumbnail: ThumbnailFn;
  getAdditionalData: GetAdditionalDataFn | null;
}

interface AssetWithId extends Asset {
  id: UniqueIdentifier;
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
  uniqueId: UniqueIdentifier;
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
      minHeight: '130px',
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
    top: '-5px',
    right: '-5px',
    backgroundColor: 'white',
    padding: 0,
    minHeight: 'initial',
    minWidth: '25px',
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
    cursor: 'default',
  }),
  secondaryAdditionalData: css({
    color: tokens.gray500,
    cursor: 'default',
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

const DragHandle = ({ url, alt, additionalData }: DragHandleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        <>
          <div>
            <Flex justifyContent="center" title={alt}>
              <FileIcon />
            </Flex>
          </div>
          <AdditionalDataDisplay additionalData={additionalData} />
        </>
      );
    } else {
      return (
        <>
          <div>
            <img src={url} alt={alt} title={alt} />
          </div>
          <Collapse isExpanded={isExpanded}>
            {<AdditionalDataDisplay additionalData={additionalData} />}
          </Collapse>
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
};

const SortableItem = ({
  url,
  alt,
  disabled,
  onDelete,
  additionalData,
  uniqueId,
}: SortableElementProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: uniqueId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      className={styles.card(disabled)}
      ref={setNodeRef}
      style={style}
      key={uniqueId}
      {...attributes}
      {...listeners}>
      <DragHandle url={url} alt={alt} additionalData={additionalData} />
      {!disabled && (
        <IconButton
          variant="transparent"
          icon={<XIcon variant="muted" />}
          aria-label="Close"
          onClick={onDelete}
          className={styles.remove}
        />
      )}
    </Card>
  );
};

export const SortableComponent = ({
  resources,
  makeThumbnail,
  getAdditionalData,
  config,
  disabled,
  onChange,
}: Props) => {
  const [items, setItems] = useState<AssetWithId[]>([]);

  const deleteItem = useCallback(
    (index: number) => {
      const myResources = [...resources];
      myResources.splice(index, 1);
      onChange(myResources);
    },
    [resources, onChange]
  );

  useEffect(() => {
    const myItems = resources.reduce(
      (acc, resource, index) => {
        const [url, alt] = makeThumbnail(resource, config);
        const additionalData = getAdditionalData?.(resource) || null;
        const counts = { ...acc.counts };
        const item = JSON.parse(
          JSON.stringify({ url, alt, key: `url-unknown-${index}`, additionalData, ...resource })
        );

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
    );

    setItems(myItems.list);
  }, [resources, makeThumbnail, getAdditionalData, setItems]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active?.id !== over?.id) {
        const oldIndex = items.findIndex((i) => i.key === active.id);
        const newIndex = items.findIndex((i) => i.key === over?.id);
        const sortedItems = arrayMove(items, oldIndex, newIndex);

        onChange(sortedItems);
        setItems(sortedItems);
      }
    },
    [items, onChange, setItems]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items?.map((i) => i.key)} strategy={verticalListSortingStrategy}>
        <div className={styles.container} data-testid="container">
          <div className={styles.grid} data-testid="grid">
            {items.map(({ key, alt, url, additionalData }, index) => (
              <div key={key}>
                <SortableItem
                  disabled={disabled}
                  url={url}
                  alt={alt}
                  uniqueId={key}
                  onDelete={() => deleteItem(index)}
                  additionalData={additionalData}
                />
              </div>
            ))}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
};
