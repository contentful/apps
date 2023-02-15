import React, { useContext, useState } from 'react'
import { Button, ButtonGroup, Heading, Paragraph, Spinner, Text } from '@contentful/f36-components';
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '../../utils/RouteConstants';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import SetupStepper from '../../utils/SetupStepper';
import { StepperContextType, StepperContext } from '../../Main';

const styles = {
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
  sectionHeading: css({
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacing2Xs,
  }),
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
};

export default function InitialOverviewPage() {
  // const navigate = useNavigate();
  const stepperContext = useContext<StepperContextType>(StepperContext);

  const [verifying, setVerifying] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);
  const [successfullyVerified, setSuccessfullyVerified] = useState<boolean>(false);
  const [successfullyInstalled, setSuccessfullyInstalled] = useState<boolean>(false);

  const handleVerifyClick = async () => {
    setVerifying(true)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSuccessfullyVerified(true)
    setVerifying(false)
  }

  const handleInstallClick = async () => {
    setInstalling(true)
    await new Promise(resolve => setTimeout(resolve, 1000));
    stepperContext.onStepperStatusesChange({ ...stepperContext.stepperStatuses, serviceAccounts: true })
    setSuccessfullyInstalled(true)
    setInstalling(false)
  }

  const handleDoneClick = () => {
    stepperContext.onStepperStatusesChange({ authCreds: false, enableApis: false, serviceAccounts: false })
    // navigate(ROUTE_PATHS.overviewRoute)
  }

  const handleBackClick = () => {
    // navigate(ROUTE_PATHS.enableApiRoute)
  }

  const handleClickLogic = () => {

    if (!successfullyVerified) handleVerifyClick()
    else if (!successfullyInstalled) handleInstallClick()
    else if (successfullyVerified && successfullyInstalled) handleDoneClick()
  }

  const handleButtonName = () => {
    if (verifying) {
      return (
        <>
          <Text marginRight="spacingXs">Verifying</Text>
          <Spinner />
        </>
      )
    }
    if (installing) {
      return (
        <>
          <Text marginRight="spacingXs">Installing</Text>
          <Spinner />
        </>
      )
    }
    if (!successfullyVerified) return "Verify"
    if (!successfullyInstalled) return "Install"
    if (successfullyVerified && successfullyInstalled) return "Done"
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Heading>Add Service Account in Google Analytics</Heading>
        <SetupStepper />
      </div>
      <Heading as="h2" className={styles.sectionHeading}>
        Top Level Description
      </Heading>
      <Paragraph>
        Figma mockups <a target="_blank" href='https://www.figma.com/file/sCt0XEqqtiDwonvYUX9R6w/Untitled?node-id=7%3A29580&t=FMV2ZzlftPVF4IuG-0'>here</a>
      </Paragraph>

      <hr className={styles.splitter} />

      <Heading as="h2" className={styles.sectionHeading}>
        Body Content
      </Heading>
      <Paragraph>
        Do what must be done down here
      </Paragraph>

      <hr className={styles.splitter} />

      <div style={styles.buttonContainer}>
        <ButtonGroup variant="spaced" spacing="spacingM">
          <Button onClick={handleBackClick}>Back</Button>
          <Button variant="primary" onClick={handleClickLogic}>{handleButtonName()}</Button>
        </ButtonGroup>
      </div>

      <div>
        {successfullyInstalled ? "Successfuly Installed" : "Print your error message here"}
      </div>
    </>
  )
}
