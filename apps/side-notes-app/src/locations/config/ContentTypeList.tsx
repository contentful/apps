import { Button, Flex, Grid, Heading, Menu, Paragraph, Text } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ContentTypeAssignmentEvent } from '../../analytics';
import { useWidgetStore } from '../../stores/widgets.store';
import { AnalyticsContentTypeAssignmentEventAction } from '../../types';
import { ContentTypeElement } from './ContentTypeElement';
import { ContentTypeListContext } from './ContentTypeListContext';

const ElementGrid = styled(Grid)`
  width: 100%;
  padding: ${tokens.spacingM} ${tokens.spacingL};
`;

const TableHeader = styled(ElementGrid)`
  background: ${tokens.gray200};
  border-bottom: 1px solid ${tokens.gray300};
  border-radius: 6px 6px 0 0;
`;

const EmptyMessage = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: ${tokens.gray600};
`;

const Headline = styled(Heading)`
  margin-bottom: 0;
`;

export const ContentTypeList = () => {
  const { addNewContentType, contentTypeDefs } = useWidgetStore((state) => state);
  const { allContentTypesMap } = useContext(ContentTypeListContext);

  const contentTypesToBeAdded = useMemo(() => {
    return Object.values(allContentTypesMap || {}).filter((item) => !contentTypeDefs[item.sys.id]);
  }, [allContentTypesMap, contentTypeDefs]);

  const navigate = useNavigate();

  return (
    <Flex flexDirection="column" gap="spacingS">
      <Flex gap="spacingS" flexDirection="column">
        <Headline>Manage Static Side Notes</Headline>
        <Paragraph>
          <Text fontColor="gray600">
            - Static widgets allow for easy annotation and adding static text to content types.{' '}
            <br />- Customizable widgets can be edited to fit your preferred visual presentation for
            each entry. <br />- Enhance your content and improve the user experience by providing a
            clearer understanding of the content to anyone editing or creating an entry.
          </Text>
        </Paragraph>
      </Flex>

      <TableHeader columns="1fr 2fr 1fr 100px">
        <Grid.Item>
          <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
            Content Type
          </Text>
        </Grid.Item>
      </TableHeader>

      {Object.values(contentTypeDefs).length === 0 && (
        <EmptyMessage>No static widgets assigned</EmptyMessage>
      )}
      {Object.values(contentTypeDefs).map((ct) => (
        <ContentTypeElement key={ct.id} widgetDef={ct} />
      ))}
      {contentTypesToBeAdded && contentTypesToBeAdded.length > 0 && (
        <Menu>
          <Menu.Trigger>
            <Button startIcon={<PlusIcon />}>Add Content Type</Button>
          </Menu.Trigger>
          <Menu.List>
            {contentTypesToBeAdded.map((item) => (
              <Menu.Item
                key={item.sys.id}
                onClick={() => {
                  addNewContentType(item);
                  navigate(`/ct/${item.sys.id}/sidebar`);
                  ContentTypeAssignmentEvent(AnalyticsContentTypeAssignmentEventAction.CREATE);
                }}>
                {item.name}
              </Menu.Item>
            ))}
          </Menu.List>
        </Menu>
      )}
    </Flex>
  );
};
