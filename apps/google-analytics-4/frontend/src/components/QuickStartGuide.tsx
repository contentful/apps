import {
    Button,
    Heading,
    Flex,
    Note,
    Paragraph,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useState } from 'react';

const styles = {
    credentialsNote: css({
        marginBottom: tokens.spacingM,
    }),
    sectionHeading: css({
        fontSize: tokens.fontSizeL,
        marginBottom: tokens.spacing2Xs,
    }),
    subSectionHeading: css({
        fontSize: tokens.fontSizeM,
        marginBottom: tokens.spacing2Xs,
    }),
}

/* this URL comes from the button located at: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries */
const quickStartURL = 'https://console.developers.google.com/henhouse/?pb=%5B%22hh-0%22%2C%22analyticsdata.googleapis.com%22%2Cnull%2C%5B%5D%2C%22https%3A%2F%2Fdevelopers.google.com%22%2Cnull%2C%5B%5D%2Cnull%2C%22Enable%20the%20Google%20Analytics%20Data%20API%20v1%22%2C3%2Cnull%2C%5B%5D%2Cfalse%2Cfalse%2Cnull%2Cnull%2Cnull%2Cnull%2Cfalse%2Cnull%2Cfalse%2Cfalse%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%22Quickstart%22%2Ctrue%2C%22Quickstart%22%2Cnull%2Cnull%2Cfalse%5D'

const QuickStartGuide = () => {
    const [expanded, setExpanded] = useState(false)
    return (
        <>
            <Heading as="h3" className={styles.subSectionHeading}>Quickstart (Recommended)</Heading>
            <Paragraph>
                The simplest way to get started using Google Analytics with Contentful is to have us set up a Cloud Platform project with a service account on your behalf.
                This is a requirement from Google in order for us to send data back and forth to your Analytics dashboard.
            </Paragraph>
            <Paragraph>
                The button below will allow us to create a new Cloud Platform project, automatically enable the Google Analytics Data API, and create a service account with read access to your Organization's data all at once.

            </Paragraph>
            <Paragraph>
                This will open a window that will guide you through the process on the Google side and allow you to download a JSON file. Paste the contents of that JSON file below.

            </Paragraph>
            <Paragraph>
                <Note variant="warning" className={styles.credentialsNote}>This step requires authentication with Google. You will need to be logged into an existing Google account - a private session will not work.
                </Note>
                <Flex marginTop="spacingM" justifyContent="space-between">
                    <Button
                        size="medium"
                        variant="primary"
                        onClick={() => {
                            window.open(quickStartURL,
                                "_blank", "width=600,height=300,top=50,left=50")
                        }} >Authenticate with Google</Button>

                </Flex>
            </Paragraph>
            <Heading as="h3" className={styles.subSectionHeading}>Manual Setup (for advanced users)</Heading>
            <Paragraph marginTop="spacingM">If you feel confident setting up a service account manually, we recommend following this guide: // TBD</Paragraph>


        </>
    )
}


export default QuickStartGuide;