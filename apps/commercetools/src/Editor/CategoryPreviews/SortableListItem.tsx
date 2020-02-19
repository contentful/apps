import React from 'react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import { css } from 'emotion';
import {
  Card,
  CardDragHandle as FormaCardDragHandle,
  Heading,
  Icon,
  IconButton,
  Subheading,
  Tag,
  Typography
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Category } from '../../interfaces';

export interface Props {
  category: Category;
  disabled: boolean;
  onDelete: () => void;
  isSortable: boolean;
}

const styles = {
  card: css({
    display: 'flex',
    padding: 0,
    position: 'relative',
    ':not(:first-of-type)': css({
      marginTop: tokens.spacingXs
    })
  }),
  dragHandle: css({
    height: 'auto'
  }),
  actions: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: tokens.spacingXs,
    a: css({
      display: 'inline-block',
      marginRight: tokens.spacingXs,
      svg: css({
        transition: `fill ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`
      }),
      '&:hover': {
        svg: css({
          fill: tokens.colorContrastDark
        })
      }
    })
  }),
  description: css({
    padding: tokens.spacingM,
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }),
  heading: (category: Category) =>
    css({
      fontSize: tokens.fontSizeL,
      marginBottom: category.isMissing || !category.name ? 0 : tokens.spacing2Xs,
      ...(category.name && { textTransform: 'capitalize' })
    }),
  subheading: css({
    color: tokens.colorElementDarkest,
    fontSize: tokens.fontSizeS,
    marginBottom: 0
  }),
  slug: css({
    color: tokens.colorElementDarkest,
    fontSize: tokens.fontSizeS,
    marginBottom: 0
  })
};

const CardDragHandle = SortableHandle(() => (
  <FormaCardDragHandle className={styles.dragHandle}>Reorder category</FormaCardDragHandle>
));

function getCategoryIdentifier(category: Category) {
  return category.slug.length ? category.slug : category.id;
}

export const SortableListItem = SortableElement<Props>(
  ({ category, disabled, isSortable, onDelete }: Props) => {
    return (
      <Card className={styles.card}>
        <>
          {isSortable && <CardDragHandle />}
          <section className={styles.description}>
            <Typography>
              <Heading className={styles.heading(category)}>
                {category.isMissing || !category.name
                  ? getCategoryIdentifier(category)
                  : category.name}
              </Heading>
              {category.isMissing && <Tag tagType="negative">Category missing</Tag>}
              {!category.isMissing && category.name && (
                <Subheading className={styles.subheading}>
                  {getCategoryIdentifier(category)}
                </Subheading>
              )}
            </Typography>
          </section>
        </>
        {!disabled && (
          <div className={styles.actions}>
            {category.externalLink && (
              <a target="_blank" rel="noopener noreferrer" href={category.externalLink}>
                <Icon icon="ExternalLink" color="muted" />
              </a>
            )}
            <IconButton
              label="Delete"
              iconProps={{ icon: 'Close' }}
              {...{
                buttonType: 'muted',
                onClick: onDelete
              }}
            />
          </div>
        )}
      </Card>
    );
  }
);
