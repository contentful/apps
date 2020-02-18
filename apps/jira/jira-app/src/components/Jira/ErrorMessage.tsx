import React from 'react';

import {Note} from '@contentful/forma-36-react-components'

interface Props {
    errorType: IssuesResponse['error'];
}

export default function ErrorMessage({errorType}: Props) {
    if (errorType === 'unauthorized_error') {
        return (
            <Note noteType="negative" title="Unauthorized">
                Your Jira account does not have permission to view the issues in this project. Please contact your admin.
            </Note>
        );
    }

    if (errorType === 'general_error') {
        return (
            <Note noteType="warning" title="Error">
                An error occured while communicating with Jira. Please reload the page.
            </Note>
        );
    }

    return null;
}