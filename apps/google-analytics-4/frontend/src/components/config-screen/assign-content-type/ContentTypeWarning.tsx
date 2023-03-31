import { useState, useEffect } from 'react';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import {
  NO_SLUG_WARNING_MSG,
  REMOVED_FROM_SIDEBAR_WARNING_MSG,
  getContentTypeDeletedMsg,
  getSlugFieldDeletedMsg,
  WarningTypes,
} from 'components/config-screen/WarningDisplay/constants/warningMessages';
import { ConfigurationWarningTypes } from 'types';
import WarningDisplay from 'components/config-screen/WarningDisplay/WarningDisplay';

interface Props {
  contentTypeId: string;
  slugField: string;
  isSaved: boolean;
  isInSidebar: boolean;
  isContentTypeInOptions: boolean;
  isSlugFieldInOptions: boolean;
}

const ContentTypeWarning = (props: Props) => {
  const {
    contentTypeId,
    slugField,
    isSaved,
    isInSidebar,
    isContentTypeInOptions,
    isSlugFieldInOptions,
  } = props;

  const [warningType, setWarningType] = useState<ConfigurationWarningTypes>(WarningTypes.Empty);
  const [tooltipContent, setTooltipContent] = useState<string>('');

  useEffect(() => {
    let content = '';

    // Warning states
    if (contentTypeId && !slugField) {
      setWarningType(WarningTypes.Warning);
      content += NO_SLUG_WARNING_MSG;
    }

    if (isSaved && !isInSidebar && isContentTypeInOptions) {
      setWarningType(WarningTypes.Warning);
      content += REMOVED_FROM_SIDEBAR_WARNING_MSG;
    }

    if (contentTypeId && isContentTypeInOptions && slugField && !isSlugFieldInOptions) {
      setWarningType(WarningTypes.Warning);
      content += getSlugFieldDeletedMsg(contentTypeId, slugField);
    }

    // Error state
    if (contentTypeId && !isContentTypeInOptions) {
      setWarningType(WarningTypes.Error);
      content += getContentTypeDeletedMsg(contentTypeId);
    }

    if (!content) {
      setWarningType('');
    }

    setTooltipContent(content);
  }, [
    contentTypeId,
    slugField,
    isSaved,
    isInSidebar,
    isContentTypeInOptions,
    isSlugFieldInOptions,
  ]);

  return (
    <WarningDisplay
      warningType={warningType}
      tooltipContent={tooltipContent}
      className={styles.statusItem}
    />
  );
};

export default ContentTypeWarning;
