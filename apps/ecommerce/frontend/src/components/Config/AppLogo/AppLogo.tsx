import { Box, Skeleton } from '@contentful/f36-components';
import { styles } from '../ConfigPage/ConfigPage.styles';

interface Props {
  error: Error | undefined;
  isLoading: boolean;
  logoUrl: string;
}

const AppLogo = (props: Props) => {
  const { error, isLoading, logoUrl } = props;

  const logoComponent = () => {
    if (isLoading)
      return (
        <Skeleton.Container ariaLabel="Loading image">
          <Skeleton.Image />
        </Skeleton.Container>
      );

    if (error) return null;
    else return <img src={logoUrl} alt="App logo" />;
  };

  return <Box className={styles.icon}>{logoComponent()}</Box>;
};

export default AppLogo;
