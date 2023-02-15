import React, { useContext } from 'react'
import { Button, ButtonGroup, Heading, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '../../utils/RouteConstants';
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
  buttonContainer: css({
    display: 'flex',
    justifyContent: 'flex-end'
  })
};

export default function InitialOverviewPage() {
  // const navigate = useNavigate();
  const stepperContext = useContext<StepperContextType>(StepperContext);

  const handleNextStepClick = () => {
    stepperContext.onStepperStatusesChange({ ...stepperContext.stepperStatuses, enableApis: true })
    // navigate(ROUTE_PATHS.serviceAccountRoute)
  }

  const handleBackClick = () => {
    // navigate(ROUTE_PATHS.authCredentialsRoute)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Heading>Enable Google Analytics APIs</Heading>
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


      <div className={styles.buttonContainer}>
        <ButtonGroup variant="spaced" spacing="spacingM">
          <Button onClick={handleBackClick}>Back</Button>
          <Button variant="primary" onClick={handleNextStepClick}>Next Step</Button>
        </ButtonGroup>
      </div>

    </>
  )
}
