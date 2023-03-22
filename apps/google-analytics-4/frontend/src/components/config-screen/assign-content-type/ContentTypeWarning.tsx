import { useState, useEffect } from 'react';
import { Box, Tooltip } from '@contentful/f36-components';
import { WarningIcon, ErrorCircleIcon } from '@contentful/f36-icons';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import {
  NO_CONTENT_TYPE_ERR_MSG,
  NO_SLUG_WARNING_MSG,
  REMOVED_FROM_SIDEBAR_WARNING_MSG,
  getContentTypeDeletedMsg,
  getSlugFieldDeletedMsg,
  WarningTypes,
} from './constants/warningMessages';
import { ContentWarningTypes } from 'types';

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

  const [warningType, setWarningType] = useState<ContentWarningTypes>(WarningTypes.Empty);
  const [tooltipContent, setTooltipContent] = useState<string>('');

  useEffect(() => {
    const getTooltipContent = () => {
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

      // Error states
      if (!contentTypeId) {
        setWarningType(WarningTypes.Error);
        content += NO_CONTENT_TYPE_ERR_MSG;
      }

      if (contentTypeId && !isContentTypeInOptions) {
        setWarningType(WarningTypes.Error);
        content += getContentTypeDeletedMsg(contentTypeId);
      }

      if (!content) {
        setWarningType('');
      }

      setTooltipContent(content);
    };

    getTooltipContent();
  }, [
    contentTypeId,
    slugField,
    isSaved,
    isInSidebar,
    isContentTypeInOptions,
    isSlugFieldInOptions,
  ]);

  const WarningComponent = () => {
    if (warningType === WarningTypes.Warning) {
      return (
        <Box className={styles.statusItem} testId="warningIcon">
          <Tooltip content={tooltipContent}>
            <WarningIcon variant="warning" />
          </Tooltip>
        </Box>
      );
    } else if (warningType === WarningTypes.Error) {
      return (
        <Box className={styles.statusItem} testId="errorIcon">
          <Tooltip content={tooltipContent}>
            <ErrorCircleIcon variant="negative" />
          </Tooltip>
        </Box>
      );
    } else {
      return <Box className={styles.statusItem} testId="noStatus" />;
    }
  };

  return <WarningComponent />;
};

export default ContentTypeWarning;
