import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import {
  Heading,
  TextLink,
  Tooltip,
  SkeletonContainer,
  SkeletonBodyText,
  Paragraph,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

const styles = {
  heading: css({
    marginBottom: tokens.spacingL,
  }),
  container: css({
    display: 'flex',
    marginBottom: `-${tokens.spacingM}`,
  }),
  item: css({
    marginRight: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  emptyParagraph: css({
    marginBottom: tokens.spacingM,
  }),
};

function ReferenceItem({ entry, onClick, separator }) {
  return (
    <div className={styles.item}>
      <Tooltip content={`${entry.contentTypeName}`} place="bottom">
        <TextLink onClick={onClick}>{entry.title + separator}</TextLink>
      </Tooltip>
    </div>
  );
}
ReferenceItem.propTypes = {
  entry: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

function Container(props) {
  return (
    <React.Fragment>
      <Heading element="h2" className={styles.heading}>
        Referenced in:
      </Heading>
      <div className={styles.container}>{props.children}</div>
    </React.Fragment>
  );
}

Container.propTypes = {
  children: PropTypes.any,
};

export default function ReferencesSection({ loaded, references = [], sdk }) {
  const onItemClick = (id) => () => {
    sdk.navigator.openEntry(id, {
      slideIn: true,
    });
  };

  if (!loaded) {
    return (
      <Container>
        <SkeletonContainer svgHeight="30px" clipId="references-section">
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
      </Container>
    );
  }

  return (
    <Container>
      {references.length > 0 &&
        references.map((entry, index) => (
          <React.Fragment key={entry.id}>
            <ReferenceItem
              entry={entry}
              onClick={onItemClick(entry.id)}
              separator={index !== references.length - 1 ? ', ' : ''}
            />
          </React.Fragment>
        ))}
      {references.length === 0 && (
        <Paragraph className={styles.emptyParagraph}>
          No other entries link to this entry.
        </Paragraph>
      )}
    </Container>
  );
}

ReferencesSection.propTypes = {
  loaded: PropTypes.bool.isRequired,
  references: PropTypes.array,
  sdk: PropTypes.object.isRequired,
};
