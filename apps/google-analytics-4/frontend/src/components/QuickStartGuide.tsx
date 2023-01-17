import {
    Button,
    Heading,
    Collapse,
    Flex,
    FormControl,
    Note,
    Paragraph,
    Text,
    Textarea,
    TextLink,
} from '@contentful/f36-components';
import {
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ExternalLinkTrimmedIcon,
} from '@contentful/f36-icons';
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
}

const QuickStartGuide = () => {
    const [expanded, setExpanded] = useState(false)
    return (
        <>
            <Heading as="h2" className={styles.sectionHeading}>Quickstart (Recommended)</Heading>
            <Paragraph>
                Create a new Cloud Platform project, automatically enable the Google Analytics Data API, and create a service account all at once. 
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
                            window.open("https://console.developers.google.com/henhouse/?pb=%5B%22hh-0%22%2C%22analyticsdata.googleapis.com%22%2Cnull%2C%5B%5D%2C%22https%3A%2F%2Fdevelopers.google.com%22%2Cnull%2C%5B%5D%2Cnull%2C%22Enable%20the%20Google%20Analytics%20Data%20API%20v1%22%2C3%2Cnull%2C%5B%5D%2Cfalse%2Cfalse%2Cnull%2Cnull%2Cnull%2Cnull%2Cfalse%2Cnull%2Cfalse%2Cfalse%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%22Quickstart%22%2Ctrue%2C%22Quickstart%22%2Cnull%2Cnull%2Cfalse%5D",
                                "_blank", "width=600,height=300,top=50,left=50")
                        }} >Authenticate with Google</Button>

                </Flex>
            </Paragraph>
            <TextLink
                as="button"
                variant="primary"
                icon={expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                alignIcon="start"
                onClick={() => setExpanded(!expanded)}
                testId="keyFileFieldExpander"
            >
                Manual Setup (for advanced users)
            </TextLink>
            <Collapse isExpanded={expanded}>
            <Paragraph marginTop="spacingM">If you feel confident setting up a service account manually, we recommend following this guide: // TBD</Paragraph>

            </Collapse>

        </>
    )
}


export default QuickStartGuide;