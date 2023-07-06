import { ReactElement } from 'react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import { css } from 'emotion';
import { Badge, Card, Heading, IconButton, Subheading } from '@contentful/f36-components';
import { CloseIcon, ExternalLinkIcon } from '@contentful/f36-icons';
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
      marginTop: tokens.spacingXs,
    }),
  }),
  cardInner: css({
    display: 'flex',
  }),
  dragHandle: css({
    height: 'auto',
  }),
  actions: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: tokens.spacingXs,
    a: css({
      display: 'inline-block',
      marginRight: tokens.spacingXs,
      svg: css({
        transition: `fill ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
      }),
      '&:hover': {
        svg: css({
          fill: tokens.colorBlack,
        }),
      },
    }),
  }),
  description: css({
    padding: tokens.spacingM,
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }),
  heading: (category: Category) =>
    css({
      fontSize: tokens.fontSizeL,
      marginBottom: category.isMissing || !category.name ? 0 : tokens.spacing2Xs,
      ...(category.name && { textTransform: 'capitalize' }),
    }),
  subheading: css({
    color: tokens.gray500,
    fontSize: tokens.fontSizeS,
    marginBottom: 0,
  }),
  slug: css({
    color: tokens.colorBlack,
    fontSize: tokens.fontSizeS,
    marginBottom: 0,
  }),
};

const CardDragHandle = SortableHandle(({ drag }: { drag: ReactElement }) => <>{drag}</>);

function getCategoryIdentifier(category: Category) {
  return category.slug.length ? category.slug : category.id;
}

export const SortableListItem = SortableElement<Props>(
  ({ category, disabled, isSortable, onDelete }: Props) => {
    return (
      <Card
        className={styles.card}
        withDragHandle
        dragHandleRender={isSortable ? ({ drag }) => <CardDragHandle drag={drag} /> : undefined}>
        <div className={styles.cardInner}>
          <section className={styles.description}>
            <>
              <Heading className={styles.heading(category)}>
                {category.isMissing || !category.name
                  ? getCategoryIdentifier(category)
                  : category.name}
              </Heading>
              {category.isMissing && <Badge variant="negative">Category missing</Badge>}
              {!category.isMissing && category.name && (
                <Subheading className={styles.subheading}>
                  {getCategoryIdentifier(category)}
                </Subheading>
              )}
            </>
          </section>
        </div>
        {!disabled && (
          <div className={styles.actions}>
            {category.externalLink && (
              <a target="_blank" rel="noopener noreferrer" href={category.externalLink}>
                <ExternalLinkIcon color="muted" />
              </a>
            )}
            <IconButton
              aria-label="Delete"
              icon={<CloseIcon />}
              variant="transparent"
              onClick={onDelete}
            />
          </div>
        )}
      </Card>
    );
  },
);
