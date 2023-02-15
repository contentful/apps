import React from 'react'
import { Button, Heading, Paragraph } from '@contentful/f36-components';
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '../../utils/RouteConstants';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import SetupStepper from '../../utils/SetupStepper';

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
  // const naviate = useNavigate();

  const handleNextStepClick = () => {
    // naviate(ROUTE_PATHS.authCredentialsRoute)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Heading>Google Analytics for Contentful Guide</Heading>
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
        <Button variant="primary" onClick={handleNextStepClick}>Begin</Button>
      </div>
    </>
  )
}
