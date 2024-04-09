import { Note, TextLink, Flex, ModalLauncher } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

import { GrayInfoBox } from '@components/common/GrayInfoBox/GrayInfoBox';
import { copies } from '@constants/copies';
import { InformationalModal } from '../InformationalModal/InformationalModal';
import { styles } from './PreviewPathInfoNote.styles';

// this gap is tailored specifically to the designs of the modal
const FLEX_GAP = '14rem';

export const PreviewPathInfoNote = () => {
  const { description, example, link } = copies.configPage.contentTypePreviewPathSection.infoNote;

  const renderExampleInfoModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <InformationalModal onClose={onClose} isShown={isShown} />
    ));
  };

  return (
    <Note className={styles.root} variant="neutral">
      <Flex justifyContent="space-between" alignItems="center" gap={FLEX_GAP}>
        <Flex alignItems="center" gap={tokens.spacingXs}>
          {description}
          <GrayInfoBox withCopy>{example}</GrayInfoBox>
        </Flex>
        <TextLink className={styles.link} onClick={renderExampleInfoModal}>
          {link.copy}
        </TextLink>
      </Flex>
    </Note>
  );
};
