import { useState, useEffect } from 'react';
import { ApiErrorType } from 'apis/apiTypes';
import {
  CheckCircleIcon,
  ClockIcon,
  ErrorCircleIcon,
  ArrowForwardIcon,
} from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import ChecklistSplitter from 'components/config-screen/api-access/display/ChecklistSplitter';
import { KeyValueMap } from 'contentful-management';
import GenericCheckRow from 'components/config-screen/api-access/display/GenericCheckRow';

interface Props {
  adminApiError: ApiErrorType | undefined;
  dataApiError: ApiErrorType | undefined;
  invalidServiceAccountError: ApiErrorType | undefined;
  ga4PropertiesError: ApiErrorType | undefined;
  parameters: KeyValueMap;
}

const styles = {
  defaultRowStyle: {
    minHeight: '35px',
    backgroundColor: tokens.gray100,
  },
};

const API_TYPES = {
  adminApi: 'Admin api',
  dataApi: 'Data api',
};

export default function ServiceAccountChecklist(props: Props) {
  const {
    invalidServiceAccountError,
    adminApiError,
    dataApiError,
    ga4PropertiesError,
    parameters,
  } = props;

  const [isFirstSetup, setIsFirstSetup] = useState<boolean>(false);
  useEffect(() => {
    if (!parameters || !parameters.propertyId) setIsFirstSetup(true);
  }, [parameters]);

  const getApiType = (type: string) => {
    switch (type) {
      case API_TYPES.adminApi:
        return API_TYPES.adminApi;
      case API_TYPES.dataApi:
        return API_TYPES.dataApi;
      default:
        return '';
    }
  };

  const renderServiceAccountCheck = () => {
    return invalidServiceAccountError ? (
      <GenericCheckRow
        icon={<ErrorCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="negative" />}
        title={'Service Account'}
        description={'Invalid service account and service account key'}
        style={styles.defaultRowStyle}
      />
    ) : (
      <GenericCheckRow
        icon={<CheckCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="positive" />}
        title={'Service Account'}
        description={'Success!'}
        style={styles.defaultRowStyle}
      />
    );
  };

  const renderApiCheck = (type: string) => {
    const title = getApiType(type);
    const error = title === API_TYPES.adminApi ? adminApiError : dataApiError;

    // Success state
    if (!invalidServiceAccountError && !error) {
      return (
        <GenericCheckRow
          icon={
            <CheckCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="positive" />
          }
          title={title}
          description={'Success!'}
          style={styles.defaultRowStyle}
        />
      );
    }

    // Check for first time install setup
    if (isFirstSetup && invalidServiceAccountError) {
      return (
        <GenericCheckRow
          icon={<ArrowForwardIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />}
          title={title}
          description={`Awaiting a valid service account install`}
          style={styles.defaultRowStyle}
        />
      );
    }
    if (isFirstSetup && !invalidServiceAccountError) {
      return (
        <GenericCheckRow
          icon={<ArrowForwardIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />}
          title={title}
          description={`Please enable the ${title} to run this check`}
          style={styles.defaultRowStyle}
        />
      );
    }

    // Otherwise it is installed so check for errors
    if (invalidServiceAccountError) {
      return (
        <GenericCheckRow
          icon={<ClockIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />}
          title={title}
          description={`Check will run once a valid key service is installed`}
          style={styles.defaultRowStyle}
        />
      );
    }
    if (error) {
      return (
        <GenericCheckRow
          icon={<ErrorCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />}
          title={title}
          description={`Failed to connect to the ${title} - did you enable the api?`}
          style={styles.defaultRowStyle}
        />
      );
    }
  };

  const renderGa4AccountPropertiesCheck = () => {
    const title = 'GA4 Account Properties';

    // Success state
    if (!invalidServiceAccountError && !adminApiError && !ga4PropertiesError) {
      return (
        <GenericCheckRow
          icon={
            <CheckCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="positive" />
          }
          title={title}
          description={`Success!`}
          style={styles.defaultRowStyle}
        />
      );
    }

    // Check for first time install setup
    if (isFirstSetup && invalidServiceAccountError) {
      return (
        <GenericCheckRow
          icon={<ArrowForwardIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />}
          title={title}
          description={`Awaiting a valid service account install`}
          style={styles.defaultRowStyle}
        />
      );
    }
    if (isFirstSetup && adminApiError) {
      return (
        <GenericCheckRow
          icon={<ArrowForwardIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />}
          title={title}
          description={`Check will run once the ${API_TYPES.adminApi} is enabled`}
          style={styles.defaultRowStyle}
        />
      );
    }

    // Otherwise it is installed so check for errors
    if (invalidServiceAccountError) {
      return (
        <GenericCheckRow
          icon={<ClockIcon marginLeft="spacingXs" marginRight="spacingXs" variant="negative" />}
          title={title}
          description={`This check will run with a valid service key and admin api connection`}
          style={styles.defaultRowStyle}
        />
      );
    }
    if (adminApiError) {
      return (
        <GenericCheckRow
          icon={<ClockIcon marginLeft="spacingXs" marginRight="spacingXs" variant="muted" />}
          title={title}
          description={`Awaiting the admin api to be enabled`}
          style={styles.defaultRowStyle}
        />
      );
    }
    if (ga4PropertiesError) {
      return (
        <GenericCheckRow
          icon={
            <ErrorCircleIcon marginLeft="spacingXs" marginRight="spacingXs" variant="negative" />
          }
          title={title}
          description={`There are no properties listed!`}
          style={styles.defaultRowStyle}
        />
      );
    }
  };

  return (
    <>
      <ChecklistSplitter />
      {renderServiceAccountCheck()}
      <ChecklistSplitter />
      {renderApiCheck(API_TYPES.adminApi)}
      <ChecklistSplitter />
      {renderApiCheck(API_TYPES.dataApi)}
      <ChecklistSplitter />
      {renderGa4AccountPropertiesCheck()}
      <ChecklistSplitter />
    </>
  );
}
