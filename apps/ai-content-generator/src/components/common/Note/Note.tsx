import { MouseEventHandler } from 'react';
import { styles } from './Note.styles';
import { Note as F36Note, NoteProps } from '@contentful/f36-components';

interface Props {
  body: string | JSX.Element;
  variant: NoteProps['variant'];
  withCloseButton?: boolean;
  onClose?: MouseEventHandler<HTMLButtonElement>;
}

const Note = (props: Props) => {
  const { body, variant = 'negative', withCloseButton = false, onClose } = props;
  return (
    <F36Note
      css={styles.note}
      variant={variant}
      withCloseButton={withCloseButton}
      onClose={onClose}>
      <p css={styles.noteContent}>{body}</p>
    </F36Note>
  );
};

export default Note;
