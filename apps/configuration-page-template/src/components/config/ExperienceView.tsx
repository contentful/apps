import { FC, useState } from 'react';
import { Flex, Heading, Paragraph, Card } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import TopLevelHeader from '../templates/TopLevelHeader';
import ConfigureAccessInputs from '../templates/ConfigureAccessInputs';
import AssignContentTypeDropdown from '../templates/AssignContentTypeDropdown';
import SetupRules from '../templates/SetupRules';
import Disclaimer from '../templates/Disclaimer';
import tokens from '@contentful/f36-tokens';

const experienceStyles = {
  root: {
    padding: '32px',
    overflow: 'scroll',
    height: 'calc(100vh - 101px)',
  } as React.CSSProperties,
};

interface ExperienceViewProps {
  selectedBlocks: string[];
}

export const ExperienceView: FC<ExperienceViewProps> = ({ selectedBlocks }) => {
  const sdk = useSDK();
  const [selectedContentTypes, setSelectedContentTypes] = useState<{ id: string; name: string }[]>(
    []
  );

  const renderComponent = (blockId: string) => {
    switch (blockId) {
      case 'setup-app':
        return <TopLevelHeader />;
      case 'configure-via-key':
        return <ConfigureAccessInputs />;
      case 'assign-content-types':
        return (
          <AssignContentTypeDropdown
            selectedContentTypes={selectedContentTypes}
            setSelectedContentTypes={setSelectedContentTypes}
            sdk={sdk as ConfigAppSDK}
          />
        );
      case 'set-up-rules':
        return <SetupRules />;
      case 'disclaimer':
        return <Disclaimer />;
      default:
        return null;
    }
  };

  return (
    <Flex flexDirection="column" gap={tokens.spacingXs} style={experienceStyles.root}>
      {selectedBlocks.length === 0 ? (
        <>
          {/* <Flex flexDirection="column" gap="spacingS">
            <Heading as="h2" marginBottom="none">
              Experience Preview
            </Heading>
            <Paragraph marginBottom="none" fontColor="gray600">
              This is where users will see the visual preview of their configuration page.
            </Paragraph>
          </Flex> */}

          <Card padding="large">
            <Flex
              flexDirection="column"
              gap="spacingM"
              alignItems="center"
              justifyContent="center"
              style={{ minHeight: '400px' }}>
              <Heading as="h3" marginBottom="none">
                Select UI Blocks to Preview
              </Heading>
              <Paragraph fontColor="gray600">
                Choose building blocks from the sidebar to see them rendered here.
              </Paragraph>
            </Flex>
          </Card>
        </>
      ) : (
        <Flex flexDirection="column" gap="spacingM">
          {selectedBlocks.map((blockId) => {
            const component = renderComponent(blockId);
            if (!component) return null;

            return (
              <Card key={blockId} padding="large">
                {component}
              </Card>
            );
          })}
        </Flex>
      )}
    </Flex>
  );
};
