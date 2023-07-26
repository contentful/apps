import { useAutoResizer } from '@contentful/react-apps-toolkit';
import SidebarButtons from '@components/app/sidebar/SidebarButtons';
import DisclaimerMessage from '@components/app/sidebar/disclaimer-message/DisclaimerMessage';
import { styles } from './Sidebar.styles';

const Sidebar = () => {
  useAutoResizer();
  return (
    <>
      <SidebarButtons />
      <div css={styles.disclaimerMsgWrapper}>
        <DisclaimerMessage />
      </div>
    </>
  );
};

export default Sidebar;
