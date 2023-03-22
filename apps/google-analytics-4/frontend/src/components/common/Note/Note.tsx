import React from 'react';
import { styles } from './Note.styles';
import { Note as F36Note, NoteProps } from '@contentful/f36-components';

interface Props {
  body: string;
  variant: NoteProps['variant'];
  children?: JSX.Element;
}

const Note = (props: Props) => {
  const { body, variant = 'negative', children } = props;
  return (
    <F36Note className={styles.note} variant={variant}>
      <p className={styles.noteContent}>
        {body}
        {children}
      </p>
    </F36Note>
  );
};

export default Note;
