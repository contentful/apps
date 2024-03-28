import { Note, TextLink, Flex, ModalLauncher } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

import { GrayInfoBox } from '../../../common/GrayInfoBox/GrayInfoBox';
import { InformationalModal } from '../InformationalModal/InformationalModal';
import { styles } from './PreviewPathInfoNote.styles';
import { copies } from '../../../../constants/copies';

// this gap is tailored specifically to the designs of the modal
const FLEX_GAP = '11rem';

export const PreviewPathInfoNote = () => {
  const { infoBoxCopyDescription, infoBoxExample, infoBoxTextLink } =
    copies.configPage.contentTypePreviewPathSection.infoNote;

  const renderExampleInfoModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <InformationalModal onClose={onClose} isShown={isShown} />
    ));
  };

  return (
    <Note className={styles.root} variant="neutral">
      <Flex justifyContent="space-between" alignItems="center" gap={FLEX_GAP}>
        <Flex alignItems="center" gap={tokens.spacingXs}>
          {infoBoxCopyDescription}
          <GrayInfoBox withCopy>{infoBoxExample}</GrayInfoBox>
        </Flex>
        <TextLink onClick={renderExampleInfoModal}>{infoBoxTextLink}</TextLink>
      </Flex>
    </Note>
  );
};
