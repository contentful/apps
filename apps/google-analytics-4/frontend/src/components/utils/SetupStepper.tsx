import React, { useContext } from 'react'
import { Button, ButtonGroup, Heading, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '../utils/RouteConstants';
import { StepperContext, StepperContextType } from '../Main';

const styles = {
  step: css({
    display: 'flex',
    height: '25px',
    width: '25px',
    borderRadius: '50%',
  }),
  line: css({
    minHeight: '1px',
    width: '30px',
    background: 'black',
    marginTop: '-15px'
  })
}


export default function SetupStepper() {
  const stepperContext = useContext<StepperContextType>(StepperContext);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ minWidth: 'fit-content', padding: '5px 5px 5px 5px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', }}>
            <div className={[styles.step, `${css({ backgroundColor: stepperContext.stepperStatuses.authCreds ? '#5DB057' : '#bbb' })}`].join(" ")} />
          </div>
          <p style={{ fontSize: '10px', padding: '0px 5px 0px 5px' }}>Authorization Credentials</p>
        </div>
        <div className={styles.line}></div>
        <div style={{ minWidth: 'fit-content', padding: '5px 5px 5px 5px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={[styles.step, `${css({ backgroundColor: stepperContext.stepperStatuses.enableApis ? '#5DB057' : '#bbb' })}`].join(" ")} />
          </div>
          <p style={{ fontSize: '10px' }}>Enable APIs</p>
        </div>
        <div className={styles.line}></div>
        <div style={{ minWidth: 'fit-content', padding: '5px 5px 5px 5px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={[styles.step, `${css({ backgroundColor: stepperContext.stepperStatuses.serviceAccounts ? '#5DB057' : '#bbb' })}`].join(" ")} />
          </div>
          <p style={{ fontSize: '10px' }}>Add Service Accounts</p>
        </div>
      </div>
    </div>
  )
}
