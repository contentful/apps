import SidebarButtons from "@components/app/sidebar/SidebarButtons";
import { disclaimerMessage } from "@components/app/sidebar/sidebarText";
import HyperLink from "@components/common/HyperLink/HyperLink";
import { Box } from "@contentful/f36-components";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import { useAutoResizer } from "@contentful/react-apps-toolkit";
import useSidebarParameters from "@hooks/sidebar/useSidebarParameters";
import { styles } from "./Sidebar.styles";
import DisplaySidebarWarning from "@components/app/sidebar/DisplaySidebarWarning";

const Sidebar = () => {
  const { hasBrandProfile, apiError } = useSidebarParameters();
  useAutoResizer();

  return (
    <>
      <SidebarButtons shouldDisableButtons={!!apiError} />
      <DisplaySidebarWarning
        hasBrandProfile={hasBrandProfile}
        apiError={apiError}
      />
      <Box css={styles.msgWrapper}>
        <HyperLink
          body={disclaimerMessage.body}
          substring={disclaimerMessage.substring}
          hyperLinkHref={disclaimerMessage.link}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </Box>
    </>
  );
};

export default Sidebar;
