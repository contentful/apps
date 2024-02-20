import { Button, Card, Flex, Paragraph, Subheading } from '@contentful/f36-components';
import { styles } from './AccessSectionCard.styles';
import { accessSection } from '@constants/configCopy';
import { ErrorCircleOutlineIcon } from '@contentful/f36-icons';
import { AppInstallationParameters } from '@customTypes/configPage';

interface Props {
  parameters: AppInstallationParameters;
  loginInProgress: boolean;
  logoutInProgress: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: () => void;
}

const AccessSectionCard = (props: Props) => {
  const { parameters, loginInProgress, logoutInProgress, handleLogin, handleLogout } = props;
  const { logout, orgDetailsError, retry } = accessSection;
  const hasOrgDetails = !!parameters.orgName;

  const renderCardContent = () => {
    if (hasOrgDetails) {
      return (
        <>
          <Flex alignItems="center">
            {parameters.orgLogo && (
              <img className={styles.orgLogo} src={parameters.orgLogo} alt="logo"></img>
            )}
            <Subheading marginBottom="none">{parameters.orgName}</Subheading>
          </Flex>
          <Button
            onClick={() => handleLogout()}
            isDisabled={logoutInProgress}
            isLoading={logoutInProgress}>
            {logout}
          </Button>
        </>
      );
    }

    return (
      <>
        <Flex flexDirection="column">
          <Paragraph marginBottom="none" className={styles.username}>
            {parameters.authenticatedUsername}
          </Paragraph>
          <Flex className={styles.errorText}>
            <ErrorCircleOutlineIcon variant="negative" marginRight="spacing2Xs" />
            {orgDetailsError}
          </Flex>
        </Flex>
        <Flex gap="spacingXs">
          <Button
            onClick={() => handleLogout()}
            isDisabled={logoutInProgress}
            isLoading={logoutInProgress}>
            {logout}
          </Button>
          <Button
            onClick={() => handleLogin()}
            isDisabled={loginInProgress}
            isLoading={loginInProgress}>
            {retry}
          </Button>
        </Flex>
      </>
    );
  };

  return (
    <Card padding="large" className={!hasOrgDetails ? styles.cardError : ''}>
      <Flex justifyContent="space-between">{renderCardContent()}</Flex>
    </Card>
  );
};

export default AccessSectionCard;
