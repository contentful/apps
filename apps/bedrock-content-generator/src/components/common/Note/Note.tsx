import { Note as F36Note, NoteProps } from "@contentful/f36-components";
import { css } from "@emotion/react";
import { MouseEventHandler } from "react";
import { styles } from "./Note.styles";

interface Props {
  body: string | JSX.Element;
  variant: NoteProps["variant"];
  withCloseButton?: boolean;
  onClose?: MouseEventHandler<HTMLButtonElement>;
}

const Note = (props: Props) => {
  const {
    body,
    variant = "negative",
    withCloseButton = false,
    onClose,
  } = props;

  const noteStyles = css(styles.note, {
    wordBreak: "break-all",
    wordWrap: "break-word",
  });

  return (
    <F36Note
      css={noteStyles}
      variant={variant}
      withCloseButton={withCloseButton}
      onClose={onClose}
    >
      <p css={styles.noteContent}>{body}</p>
    </F36Note>
  );
};

export default Note;
