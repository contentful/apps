import DisplaySidebarWarning from "@components/app/sidebar/DisplaySidebarWarning";
import SidebarButtons from "@components/app/sidebar/SidebarButtons";
import { useAutoResizer } from "@contentful/react-apps-toolkit";
import useSidebarParameters from "@hooks/sidebar/useSidebarParameters";

const Sidebar = () => {
  const { hasBrandProfile } = useSidebarParameters();
  useAutoResizer();

  return (
    <>
      <SidebarButtons />
      <DisplaySidebarWarning
        hasBrandProfile={hasBrandProfile}
      />
    </>
  );
};

export default Sidebar;
