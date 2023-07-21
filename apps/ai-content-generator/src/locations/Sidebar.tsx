import SidebarButtons from '@components/app/sidebar/SidebarButtons';
import DisclaimerMessage from '@components/app/sidebar/disclaimer-message/DisclaimerMessage';
import { styles } from './Sidebar.styles';

const Sidebar = () => {
  return (
    <div>
      <SidebarButtons />
      <div className={styles.disclaimerMsgWrapper}>
        <DisclaimerMessage />
      </div>
    </div>
  );
};

export default Sidebar;
