import React, { useState, useEffect } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK, CollectionResponse } from '@contentful/app-sdk';
import { Stack, Box, Subheading, Paragraph, Card, FormControl, Select, Button, MenuItem, IconButton, Menu, Flex, TextLink, Badge } from '@contentful/f36-components'
import { MenuIcon, CycleIcon, CheckCircleIcon, ArrowForwardTrimmedIcon } from '@contentful/f36-icons';
import { Collection, ContentFields, ContentTypeProps, KeyValueMap, LocaleProps } from 'contentful-management';
import SimpleDropdown from 'components/common/SimpleDropdown';
import { createClient } from 'contentful-management'
import { AccountSummariesType, PropertySummariesType } from 'types';
import DisplayAccountPropertyConfiguration from 'components/config-screen/configure-account-property/DisplayAccountPropertyConfigurationCard';
import SetupAccountPropertyConfiguration from 'components/config-screen/configure-account-property/SetupAccountPropertyConfigurationCard';

interface Props {
  accountsSummaries: AccountSummariesType[],
}

export default function ConfigurationPage(props: Props) {
  const { accountsSummaries } = props;

  const [selectedAccount, setSelectedAccount] = useState<AccountSummariesType>({} as AccountSummariesType);
  const [selectedProperty, setSelectedProperty] = useState<PropertySummariesType>({} as PropertySummariesType);

  const [isInEditConfigurationMode, setIsInEditConfigurationMode] = useState<boolean>(false);

  const handlePropertySelection = (event: any) => {
    const _selectedProperty = JSON.parse(event.target.value);
    const _selectedAccountId = _selectedProperty.parent;
    const _selectedAccount = accountsSummaries.find(e => e.account === _selectedAccountId) ?? {} as AccountSummariesType;
    setSelectedAccount(_selectedAccount)
    setSelectedProperty(_selectedProperty);
    setIsInEditConfigurationMode(true);
  }

  const handleEditConfiguration = () => {
    setIsInEditConfigurationMode(true)
  }

  const handleCancelConfiguration = () => {
    setIsInEditConfigurationMode(false)
  }

  const handleSaveConfiguration = () => {
    setIsInEditConfigurationMode(false)
  }

  console.log(accountsSummaries)

// Unwrap test button inline with edit view
  return (
    <Stack spacing='spacingL' marginBottom='none' flexDirection='column' alignItems='flex-start'>
      <Box>
        <Subheading>Configuration</Subheading>
        <Paragraph marginBottom='none'>Configure your Google Analytics app installation.</Paragraph>
      </Box>

      <Card>
        {isInEditConfigurationMode || (!selectedAccount && !selectedProperty) ?
          <SetupAccountPropertyConfiguration
            selectedAccount={selectedAccount}
            selectedProperty={selectedProperty}
            onCancelConfiguration={handleCancelConfiguration}
            onSaveConfiguration={handleSaveConfiguration}
            accountsSummaries={accountsSummaries}
            onPropertySelection={handlePropertySelection}
          />
          :
          <DisplayAccountPropertyConfiguration
            onEditConfiguration={handleEditConfiguration}
            selectedAccount={selectedAccount}
            selectedProperty={selectedProperty}
          />
        }
      </Card>
    </Stack>
  )
}
