import React, { ReactElement } from 'react';
import styled from 'styled-components';
import tokens from '@contentful/f36-tokens';
import { Button, Flex, SectionHeading, Tabs } from '@contentful/f36-components';

const SidebarContainer = styled.div`
  width: 360px;
  border-left: 1px solid ${tokens.gray200};
  height: 100%;
  background: ${tokens.gray100};
`;

const EntryContainer = styled(Flex)`
  height: 100%;
  border: 1px solid ${tokens.gray200};
`;

const WidgetBuilderHeader = styled(SectionHeading)`
  border-bottom: 1px solid ${tokens.gray400};
  padding-bottom: 8px !important;
  line-height: 32px;
  margin-bottom: 0 !important;
  color: ${tokens.gray600} !important;
`;

const SkeletonBlock = styled.div`
  background: ${tokens.gray200};

  width: 100%;
  height: 32px;
`;

export function SidebarWrapper({ children }: { children: ReactElement }) {
  return (
    <EntryContainer justifyContent="flex-end">
      <SidebarContainer>
        <Flex flexDirection="column" gap="spacingM" padding="spacingXs">
          <Tabs currentTab="first">
            <Tabs.List variant="horizontal-divider">
              <Tabs.Tab isDisabled panelId="first">
                General
              </Tabs.Tab>
              <Tabs.Tab isDisabled panelId="second">
                Comments
              </Tabs.Tab>
              <Tabs.Tab isDisabled panelId="third">
                Info
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
          <Flex flexDirection="column" gap="spacingM">
            <WidgetBuilderHeader>Annotations</WidgetBuilderHeader>
            {children}
            <WidgetBuilderHeader>Status</WidgetBuilderHeader>
            <Button variant="positive" isDisabled isFullWidth>
              Publish
            </Button>
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
            <WidgetBuilderHeader>Other</WidgetBuilderHeader>
            <SkeletonBlock />
            <SkeletonBlock />
          </Flex>
        </Flex>
      </SidebarContainer>
    </EntryContainer>
  );
}
