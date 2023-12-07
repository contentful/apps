import { Card, Flex, Grid, IconButton, Menu, ModalConfirm, Text } from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ContentTypeWidgetDefs, useWidgetStore } from '../../stores/widgets.store';
import { ContentTypeListContext } from './ContentTypeListContext';

const ElementFlex = styled(Flex)`
  width: 100%;
  padding: 0 ${tokens.spacingL};
`;

const StyledLink = styled(Link)`
  align-self: center;
  text-decoration: none;
`;

const ElementCard = styled(Card)`
  padding: ${tokens.spacingS};
  text-decoration: none;
`;

export const ContentTypeElement = ({ widgetDef }: { widgetDef: ContentTypeWidgetDefs }) => {
  const { removeContentType } = useWidgetStore((state) => state);
  const { allContentTypesMap } = useContext(ContentTypeListContext);

  const [confirmModalIsShown, setConfirmModalIsShown] = useState(false);

  const contentType = allContentTypesMap?.[widgetDef.id];

  return (
    <ElementCard>
      <ModalConfirm
        intent="positive"
        isShown={confirmModalIsShown}
        onCancel={() => {
          setConfirmModalIsShown(false);
        }}
        onConfirm={() => {
          removeContentType(widgetDef.id);
          setConfirmModalIsShown(false);
        }}>
        <Text>Do you really want to delete all static widgets from this content model?</Text>
      </ModalConfirm>
      <ElementFlex justifyContent="space-between">
        <StyledLink to={`/ct/${widgetDef.id}/sidebar`}>
          <Text fontColor="gray600" fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
            {contentType?.name}
          </Text>
        </StyledLink>

        <Grid.Item>
          <Menu>
            <Menu.Trigger>
              <IconButton
                variant="transparent"
                icon={<MoreHorizontalIcon />}
                aria-label="toggle menu"
              />
            </Menu.Trigger>
            <Menu.List>
              <Menu.Item onClick={() => setConfirmModalIsShown(true)}>Remove</Menu.Item>
            </Menu.List>
          </Menu>
        </Grid.Item>
      </ElementFlex>
    </ElementCard>
  );
};
