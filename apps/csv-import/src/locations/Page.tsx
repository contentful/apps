import React, { useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Box, Card, Stack, Text, Badge } from '@contentful/f36-components';
import { PageShell } from '../components/PageShell';
import { TypeSelector } from '../components/TypeSelector';
import { TemplateDownload } from '../components/TemplateDownload';
import { MappingStep } from '../components/MappingStep';
import { DryRunStep } from '../components/DryRunStep';
import { ExecuteStep } from '../components/ExecuteStep';
import { SummaryStep } from '../components/SummaryStep';
import { useContentTypes } from '../hooks/useContentTypes';
import { useLocales } from '../hooks/useLocales';
import { useEntriesSearch } from '../hooks/useEntriesSearch';
import {
  ImportMode,
  ImportStep,
  ContentTypeMeta,
  ParsedRow,
  ColumnMapping,
  DryRunResultRow,
  ExecutionOutcome,
} from '../lib/types';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  // Hooks
  const {
    contentTypes,
    loading: contentTypesLoading,
    error: contentTypesError,
  } = useContentTypes();
  const { locales, defaultLocale, loading: localesLoading } = useLocales();
  const { searchByField, entryExists } = useEntriesSearch();

  // State
  const [currentStep, setCurrentStep] = useState<ImportStep>('setup');
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>('create');
  const [shouldPublish, setShouldPublish] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [dryRunResults, setDryRunResults] = useState<DryRunResultRow[]>([]);
  const [matchedEntries, setMatchedEntries] = useState<Map<number, string>>(new Map());
  const [executionOutcome, setExecutionOutcome] = useState<ExecutionOutcome | null>(null);

  const selectedContentType = contentTypes.find((ct) => ct.id === selectedContentTypeId) || null;

  const handleMappingComplete = (rows: ParsedRow[], columnMappings: ColumnMapping[]) => {
    setCsvRows(rows);
    setMappings(columnMappings);
    setCurrentStep('dryrun');
  };

  const handleDryRunComplete = (results: DryRunResultRow[], matches: Map<number, string>) => {
    setDryRunResults(results);
    setMatchedEntries(matches);
    setCurrentStep('execute');
  };

  const handleExecutionComplete = (outcome: ExecutionOutcome) => {
    setExecutionOutcome(outcome);
    setCurrentStep('summary');
  };

  const handleStartOver = () => {
    setCurrentStep('setup');
    setSelectedContentTypeId(null);
    setMode('create');
    setShouldPublish(false);
    setCsvRows([]);
    setMappings([]);
    setDryRunResults([]);
    setMatchedEntries(new Map());
    setExecutionOutcome(null);
  };

  const getStepperCurrentStep = (): number => {
    switch (currentStep) {
      case 'setup':
      case 'mapping':
        return 0;
      case 'dryrun':
        return 1;
      case 'execute':
        return 2;
      case 'summary':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <PageShell title="CSV Import">
      <Stack flexDirection="column" spacing="spacingL">
        {/* Progress Stepper */}
        <Card>
          <Box>
            <Stack flexDirection="row" spacing="spacingM" alignItems="center">
              <Badge
                variant={
                  currentStep === 'setup' || currentStep === 'mapping' ? 'primary' : 'positive'
                }>
                {currentStep === 'setup' || currentStep === 'mapping' ? '1' : '✓'}
              </Badge>
              <Text
                fontWeight={
                  currentStep === 'setup' || currentStep === 'mapping'
                    ? 'fontWeightDemiBold'
                    : 'fontWeightNormal'
                }>
                Setup & Mapping
              </Text>
              <Text>→</Text>
              <Badge
                variant={
                  currentStep === 'dryrun'
                    ? 'primary'
                    : getStepperCurrentStep() > 1
                    ? 'positive'
                    : 'secondary'
                }>
                {currentStep === 'dryrun' ? '2' : getStepperCurrentStep() > 1 ? '✓' : '2'}
              </Badge>
              <Text
                fontWeight={currentStep === 'dryrun' ? 'fontWeightDemiBold' : 'fontWeightNormal'}>
                Dry Run
              </Text>
              <Text>→</Text>
              <Badge
                variant={
                  currentStep === 'execute'
                    ? 'primary'
                    : getStepperCurrentStep() > 2
                    ? 'positive'
                    : 'secondary'
                }>
                {currentStep === 'execute' ? '3' : getStepperCurrentStep() > 2 ? '✓' : '3'}
              </Badge>
              <Text
                fontWeight={currentStep === 'execute' ? 'fontWeightDemiBold' : 'fontWeightNormal'}>
                Execute
              </Text>
              <Text>→</Text>
              <Badge variant={currentStep === 'summary' ? 'positive' : 'secondary'}>
                {currentStep === 'summary' ? '✓' : '4'}
              </Badge>
              <Text
                fontWeight={currentStep === 'summary' ? 'fontWeightDemiBold' : 'fontWeightNormal'}>
                Summary
              </Text>
            </Stack>
          </Box>
        </Card>

        {/* Step Content */}
        <Card>
          {currentStep === 'setup' && (
            <Stack flexDirection="column" spacing="spacingL">
              <TypeSelector
                contentTypes={contentTypes}
                selectedContentType={selectedContentTypeId}
                mode={mode}
                shouldPublish={shouldPublish}
                loading={contentTypesLoading}
                error={contentTypesError}
                onContentTypeChange={setSelectedContentTypeId}
                onModeChange={setMode}
                onPublishChange={setShouldPublish}
              />

              {selectedContentType && (
                <>
                  <Box
                    marginTop="spacingL"
                    paddingTop="spacingL"
                    style={{ borderTop: '1px solid #d3dce0' }}>
                    <TemplateDownload
                      contentType={selectedContentType}
                      mode={mode}
                      locales={locales}
                      selectedLocale={selectedLocale}
                      onLocaleChange={setSelectedLocale}
                    />
                  </Box>
                  <Box
                    marginTop="spacingL"
                    paddingTop="spacingL"
                    style={{ borderTop: '1px solid #d3dce0' }}>
                    <button
                      onClick={() => setCurrentStep('mapping')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#0066ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}>
                      Continue to Upload CSV
                    </button>
                  </Box>
                </>
              )}
            </Stack>
          )}

          {currentStep === 'mapping' && selectedContentType && (
            <MappingStep
              contentType={selectedContentType}
              locales={locales}
              defaultLocale={defaultLocale || 'en-US'}
              onComplete={handleMappingComplete}
            />
          )}

          {currentStep === 'dryrun' && selectedContentType && (
            <DryRunStep
              mode={mode}
              rows={csvRows}
              mappings={mappings}
              contentType={selectedContentType}
              defaultLocale={defaultLocale || 'en-US'}
              checkReferenceFn={entryExists}
              searchByFieldFn={searchByField}
              onComplete={handleDryRunComplete}
            />
          )}

          {currentStep === 'execute' && selectedContentType && (
            <ExecuteStep
              mode={mode}
              rows={csvRows}
              mappings={mappings}
              contentType={selectedContentType}
              defaultLocale={defaultLocale || 'en-US'}
              shouldPublish={shouldPublish}
              dryRunResults={dryRunResults}
              matchedEntries={matchedEntries}
              onComplete={handleExecutionComplete}
            />
          )}

          {currentStep === 'summary' && executionOutcome && (
            <SummaryStep mode={mode} outcome={executionOutcome} onStartOver={handleStartOver} />
          )}
        </Card>
      </Stack>
    </PageShell>
  );
};

export default Page;
