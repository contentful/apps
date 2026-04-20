import AnalyticsApp from 'components/main-app/AnalyticsApp/AnalyticsApp';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { Skeleton } from '@contentful/f36-components';
import { useApi } from 'hooks/useApi';
import { AppInstallationParameters, CustomRangeDialogResult, StartEndDates } from 'types';
import Note from 'components/common/Note/Note';
import { getMissingParamsMsg } from 'components/main-app/constants/noteMessages';
import { AppConfigPageHyperLink } from 'components/main-app/ErrorDisplay/CommonErrorDisplays';
import { normalizeContentTypeRules } from 'helpers/contentTypeRules/contentTypeRules';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();
  const installationParameters = sdk.parameters.installation as AppInstallationParameters | undefined;

  const { serviceAccountKeyId, propertyId, contentTypes, contentTypeRules } =
    installationParameters || {};

  const currentContentType = sdk.contentType.sys.id;
  const slugFieldRules = normalizeContentTypeRules(contentTypeRules, contentTypes).filter(
    (rule) => rule.contentTypeId === currentContentType
  );

  const api = useApi(serviceAccountKeyId);

  const hasInstallationParams = serviceAccountKeyId && propertyId;

  const openCustomRangeDialog = async (
    startEndDates: StartEndDates
  ): Promise<CustomRangeDialogResult | undefined> => {
    const result = await sdk.dialogs.openCurrentApp({
      title: 'Custom date range',
      width: 'medium',
      minHeight: '560px',
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        mode: 'customDateRange',
        startDate: startEndDates.start,
        endDate: startEndDates.end,
      },
    });

    return result as CustomRangeDialogResult | undefined;
  };

  if (!installationParameters) {
    return (
      <Skeleton.Container svgHeight={300}>
        <Skeleton.Image height={68} width={325} offsetTop={10} />
        <Skeleton.Image height={160} width={325} offsetTop={93} />
        <Skeleton.Image height={25} width={200} offsetTop={268} />
      </Skeleton.Container>
    );
  }

  if (!hasInstallationParams) {
    const bodyMsg = getMissingParamsMsg(!serviceAccountKeyId, !propertyId);
    return <Note body={<AppConfigPageHyperLink bodyMsg={bodyMsg} />} variant="warning" />;
  }

  return (
    <>
      <AnalyticsApp
        api={api}
        propertyId={propertyId}
        slugFieldRules={slugFieldRules}
        openCustomRangeDialog={openCustomRangeDialog}
      />
    </>
  );
};

export default Sidebar;
