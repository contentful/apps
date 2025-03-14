import {DialogAppSDK} from '@contentful/app-sdk';
import {useAutoResizer, useSDK} from '@contentful/react-apps-toolkit';
import {
    generateConnectedContentCall,
    Field,
    assembleQuery,
    getGraphQLResponse,
} from '../helpers/assembleQuery';
import generateLiquidTags from '../helpers/generateLiquidTags';
import {Box, Button, Flex} from '@contentful/f36-components';
import {useEffect, useState} from 'react';
import FieldsSelectionStep from '../components/FieldsSelectionStep';
import CodeBlocksStep from '../components/CodeBlocksStep';
import LocalesSelectionStep from '../components/LocalesSelectionStep';

export type InvocationParams = {
    entryId: string;
    entryFields: Field[];
    contentTypeId: string;
};

const STEPS = ['fields', 'locales', 'codeBlocks'];

function nextStep(step: string): string {
    const currentStepIndex = STEPS.findIndex((s) => s === step);
    const nextStepIndex =
        currentStepIndex < STEPS.length - 1 ? currentStepIndex + 1 : currentStepIndex;
    return STEPS[nextStepIndex];
}

function previousStep(step: string): string {
    const currentStepIndex = STEPS.findIndex((s) => s === step);
    const nextStepIndex = currentStepIndex > 0 ? currentStepIndex - 1 : currentStepIndex;
    return STEPS[nextStepIndex];
}

function formatGraphqlResponse(response: JSON) {
    const jsonString = JSON.stringify(response, null, 2);
    return jsonString.replace(/\n/g, "\n");
}

const Dialog = () => {
    const sdk = useSDK<DialogAppSDK>();
    useAutoResizer();
    const [graphqlResponse, setGraphqlResponse] = useState<string>('');
    const [step, setStep] = useState('fields');

    const spaceId = sdk.ids.space;
    const token = sdk.parameters.installation.apiKey;
    const invocationParams = sdk.parameters.invocation as InvocationParams;
    const contentTypeId = invocationParams.contentTypeId;
    const entryId = invocationParams.entryId;
    const query = assembleQuery(contentTypeId, entryId, invocationParams.entryFields);
    const connectedContentCall = generateConnectedContentCall(query, spaceId, token);
    const liquidTags = generateLiquidTags(contentTypeId, invocationParams.entryFields);
    useEffect(() => {
        const fetchEntry = async () => {
            const response = await getGraphQLResponse(spaceId, token, query);
            const graphqlResponseWithNewlines = formatGraphqlResponse(response);

            setGraphqlResponse(graphqlResponseWithNewlines);
        };
        fetchEntry();
    }, []);

    return (
        <Box
            paddingBottom="spacingM"
            paddingTop="spacingM"
            paddingLeft="spacingL"
            paddingRight="spacingL">
            {step === 'fields' && <FieldsSelectionStep></FieldsSelectionStep>}
            {step === 'locales' && <LocalesSelectionStep></LocalesSelectionStep>}
            {step === 'codeBlocks' && (
                <CodeBlocksStep
                    connectedContentCall={connectedContentCall}
                    liquidTags={liquidTags}
                    graphqlResponse={graphqlResponse}></CodeBlocksStep>
            )}

            <Flex
                padding="spacingM"
                gap="spacingM"
                justifyContent="end"
                style={{
                    position: 'sticky',
                    bottom: 0,
                    background: 'white',
                }}>
                {step !== 'fields' && (
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setStep((currentStep) => previousStep(currentStep))}>
                        Back
                    </Button>
                )}
                {step !== 'codeBlocks' && (
                    <Button
                        variant="primary"
                        size="small"
                        onClick={() => setStep((currentStep) => nextStep(currentStep))}>
                        Next
                    </Button>
                )}
                {step === 'codeBlocks' && (
                    <Button variant="primary" size="small" onClick={() => sdk.close()}>
                        Close
                    </Button>
                )}
            </Flex>
        </Box>
    );
};

export default Dialog;
