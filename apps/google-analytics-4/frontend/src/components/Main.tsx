import React, { createContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthCredentialsPage from './setup-wizard/auth-credentials/AuthCredentialsPage'
import EnableApiPage from './setup-wizard/enable-api/EnableApiPage'
import InitialOverviewPage from './setup-wizard/overview/InitialOverviewPage'
import ServiceAccountPage from './setup-wizard/service-account/ServiceAccountPage'
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { ROUTE_PATHS } from './utils/RouteConstants'

const googleAnalyticsBrand = {
    primaryColor: '#E8710A',
    url: 'https://www.google.com/analytics',
    logoImage: './images/google-analytics-logo.png',
};

const styles = {
    body: css({
        height: 'auto',
        minHeight: '65vh',
        margin: '0 auto',
        marginTop: tokens.spacingXl,
        padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
        maxWidth: `calc(${tokens.contentWidthText} + 100px)`,
        backgroundColor: tokens.colorWhite,
        zIndex: 2,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '2px',
    }),
    background: css({
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        top: 0,
        width: '100%',
        height: '300px',
        backgroundColor: googleAnalyticsBrand.primaryColor,
    }),
};

export type StepperStatusType = {
    authCreds: boolean;
    enableApis: boolean;
    serviceAccounts: boolean;
}

export type StepperContextType = {
    stepperStatuses: StepperStatusType;
    onStepperStatusesChange: (_stepperStatuses: StepperStatusType) => void
}

export const StepperContext = createContext<StepperContextType>({} as StepperContextType)

export default function Main() {
    const [stepperStatuses, setStepperStatuses] = useState<StepperStatusType>({} as StepperStatusType);

    const onStepperStatusesChange = (_stepperStatuses: StepperStatusType) => {
        setStepperStatuses(_stepperStatuses)
    }

    useEffect(() => {
        // Update stepper statuses state here
        setStepperStatuses({
            authCreds: false,
            enableApis: false,
            serviceAccounts: false,
        })
    }, [])

    return (
        <>
            <div className={styles.background} />
            <div className={styles.body}>
                <StepperContext.Provider value={{ stepperStatuses, onStepperStatusesChange }}>
                <InitialOverviewPage />
                    {/* <BrowserRouter>
                        <Routes>
                            <Route path={ROUTE_PATHS.overviewRoute} element={<InitialOverviewPage />} />
                            <Route path={ROUTE_PATHS.authCredentialsRoute} element={<AuthCredentialsPage />} />
                            <Route path={ROUTE_PATHS.enableApiRoute} element={<EnableApiPage />} />
                            <Route path={ROUTE_PATHS.serviceAccountRoute} element={<ServiceAccountPage />} />
                        </Routes>
                    </BrowserRouter> */}
                </StepperContext.Provider>
            </div>
        </>
    )
}
