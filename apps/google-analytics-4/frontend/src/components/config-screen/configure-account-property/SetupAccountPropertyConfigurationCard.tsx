import React from 'react'
import { Flex, Box, Paragraph, TextLink, Menu, Button } from '@contentful/f36-components'
import { AccountSummariesType, PropertySummariesType } from 'types'
import { MenuIcon, CycleIcon, CheckCircleIcon, ArrowForwardTrimmedIcon } from '@contentful/f36-icons';

interface Props {
  onCancelConfiguration: React.MouseEventHandler<HTMLButtonElement>
  onSaveConfiguration: React.MouseEventHandler<HTMLButtonElement>
  onPropertySelection: React.MouseEventHandler<HTMLButtonElement>
  selectedAccount: AccountSummariesType
  selectedProperty: PropertySummariesType
  accountsSummaries: AccountSummariesType[]
}

export default function SetupAccountPropertyConfiguration(props: Props) {
  const { onCancelConfiguration, onSaveConfiguration, onPropertySelection, selectedAccount, selectedProperty, accountsSummaries } = props;

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Box paddingBottom='spacingL'>
          <Paragraph marginBottom='none'><b>Google Analytics Configuration</b></Paragraph>
        </Box>
        <Flex justifyContent="space-between" marginBottom='spacingL'>
          <Box paddingRight='spacingXs'>
            <TextLink testId='cancelConfigurationButton' as="button" variant='primary' onClick={onCancelConfiguration}>Cancel</TextLink>
          </Box>
          <TextLink testId='saveConfigurationButton' as="button" variant='primary' onClick={onSaveConfiguration}>Save</TextLink>
        </Flex>
      </Flex>
      <Paragraph marginBottom='spacingXs'>Select your new {<b>Account to Property</b>} mapping and save your changes</Paragraph>
      <Menu>
        <Menu.Trigger>
          <Button isFullWidth>{selectedProperty ? (
            <Flex>
              {selectedAccount.displayName}<ArrowForwardTrimmedIcon marginLeft="spacingXs" marginRight="spacingXs" />{selectedProperty.displayName}
            </Flex>
          )
            :
            'Select a property'}
          </Button>
        </Menu.Trigger>
        <Menu.List>
          {accountsSummaries.filter(accountSummary => accountSummary.propertySummaries.length > 0).map((accountsSummary) => {
            return (
              <Menu.Submenu key={accountsSummary.account}>
                <Menu.SubmenuTrigger>{`${accountsSummary.displayName} (${accountsSummary.account})`}</Menu.SubmenuTrigger>
                <Menu.List>
                  {accountsSummary.propertySummaries.map((property: any) => <Menu.Item key={property.property} value={JSON.stringify(property)} onClick={onPropertySelection}>{property.displayName}</Menu.Item>)}
                </Menu.List>
              </Menu.Submenu>
            )
          })}
        </Menu.List>
      </Menu>
    </>
  )
}
