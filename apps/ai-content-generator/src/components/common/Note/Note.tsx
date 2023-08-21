import { styles } from './Note.styles';
import { Note as F36Note, NoteProps } from '@contentful/f36-components';

interface Props {
  body: string | JSX.Element;
  variant: NoteProps['variant'];
}

const Note = (props: Props) => {
  const { body, variant = 'negative' } = props;
  return (
    <F36Note css={styles.note} variant={variant}>
      <p css={styles.noteContent}>{body}</p>
    </F36Note>
  );
};

export default Note;
