import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Paragraph,
  Spinner,
  Stack,
  Note,
  TextLink,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import jsPDF from 'jspdf';
import { analyzeBrandContent, BrandInsights } from '../services/brandAnalysis';
import type { AppInstallationParameters } from './ConfigScreen';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const cma = useCMA();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Check if API key is configured on component mount
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        // Debug logging
        console.log('Full SDK object:', sdk);
        console.log('SDK.parameters:', sdk.parameters);
        console.log('SDK.parameters.installation:', sdk.parameters?.installation);
        console.log('SDK keys:', Object.keys(sdk || {}));
        
        // Try multiple methods to get installation parameters
        let parameters: AppInstallationParameters | undefined;
        
        // Method 1: Try sdk.parameters.installation (standard way for app locations)
        if (sdk.parameters?.installation) {
          parameters = sdk.parameters.installation as AppInstallationParameters;
          console.log('✅ Got parameters from sdk.parameters.installation');
        }
        
        console.log('Retrieved installation parameters:', parameters);
        
        if (parameters && parameters.githubModelsApiKey) {
          setIsConfigured(true);
        } else {
          console.warn('No installation parameters found or GitHub token not configured');
          setIsConfigured(false);
        }
      } catch (error) {
        console.error('Error checking configuration:', error);
        setIsConfigured(null);
      }
    };
    
    checkConfiguration();
  }, [sdk]);

  const fetchAllContent = async () => {
    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environment;

    try {
      // Fetch content types
      const contentTypes = await cma.contentType.getMany({
        spaceId,
        environmentId,
      });

      // Fetch entries
      const entries = await cma.entry.getMany({
        spaceId,
        environmentId,
        query: { limit: 1000 },
      });

      // Fetch assets
      const assets = await cma.asset.getMany({
        spaceId,
        environmentId,
        query: { limit: 1000 },
      });

      return {
        contentTypes: contentTypes.items,
        entries: entries.items,
        assets: assets.items,
      };
    } catch (err) {
      console.error('Error fetching content:', err);
      throw err;
    }
  };

  const generateBrandGuidelinePDF = async () => {
    setLoading(true);
    setStatus('Fetching content from space...');
    setError('');

    try {
      // Get app installation parameters
      // For Page location, use sdk.parameters.installation instead of sdk.app.getParameters()
      const parameters = sdk.parameters?.installation as AppInstallationParameters;
      
      console.log('Installation parameters:', parameters);
      
      if (!parameters) {
        setError('App configuration not found. Please ensure the app is installed and configured properly.');
        setLoading(false);
        return;
      }
      
      if (!parameters.githubModelsApiKey) {
        console.warn('No GitHub token found in parameters:', parameters);
        setError('GitHub Models API token not configured. Please configure the app by clicking the link above.');
        setLoading(false);
        return;
      }

      const data = await fetchAllContent();

      setStatus('Analyzing content with AI...');
      
      // Analyze content using AI
      const brandInsights = await analyzeBrandContent(data, parameters.githubModelsApiKey);

      setStatus('Generating PDF...');

      // Create PDF with AI-generated insights
      const doc = new jsPDF();
      let yPosition = 20;

      // Title Page
      doc.setFontSize(28);
      doc.text('Brand Guidelines', 105, 60, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Generated for: ${sdk.ids.space}`, 105, 80, { align: 'center' });
      doc.text(`Environment: ${sdk.ids.environment}`, 105, 90, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 100, { align: 'center' });

      // Add new page for content
      doc.addPage();
      yPosition = 20;

      // Executive Summary
      doc.setFontSize(20);
      doc.text('Executive Summary', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.text(`This document contains brand guidelines derived from analyzing ${data.entries.length} content`, 20, yPosition);
      yPosition += 6;
      doc.text(`entries across ${data.contentTypes.length} content types in your Contentful space.`, 20, yPosition);
      yPosition += 15;

      // Brand Voice Section
      yPosition = addSection(doc, 'Brand Voice', brandInsights.brandVoice, yPosition);
      
      // Tone Description Section
      yPosition = addSection(doc, 'Tone & Communication Style', brandInsights.toneDescription, yPosition);
      
      // Writing Style Section
      yPosition = addSection(doc, 'Writing Style Guidelines', brandInsights.writingStyle, yPosition);
      
      // Key Themes Section
      if (brandInsights.keyThemes.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 40);
        doc.setFontSize(16);
        doc.text('Key Themes', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        brandInsights.keyThemes.forEach((theme) => {
          yPosition = checkPageBreak(doc, yPosition, 10);
          doc.text(`• ${theme}`, 25, yPosition);
          yPosition += 7;
        });
        yPosition += 8;
      }
      
      // Messaging Pillars Section
      if (brandInsights.messagingPillars.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 40);
        doc.setFontSize(16);
        doc.text('Messaging Pillars', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        brandInsights.messagingPillars.forEach((pillar) => {
          yPosition = checkPageBreak(doc, yPosition, 10);
          doc.text(`• ${pillar}`, 25, yPosition);
          yPosition += 7;
        });
        yPosition += 8;
      }
      
      // Do's and Don'ts Section
      if (brandInsights.doAndDonts.dos.length > 0 || brandInsights.doAndDonts.donts.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 50);
        doc.setFontSize(16);
        doc.text('Content Do\'s and Don\'ts', 20, yPosition);
        yPosition += 10;
        
        if (brandInsights.doAndDonts.dos.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(0, 128, 0); // Green
          doc.text('DO:', 25, yPosition);
          doc.setTextColor(0, 0, 0); // Black
          yPosition += 8;
          
          doc.setFontSize(10);
          brandInsights.doAndDonts.dos.forEach((item) => {
            yPosition = checkPageBreak(doc, yPosition, 10);
            const lines = doc.splitTextToSize(`✓ ${item}`, 160);
            doc.text(lines, 30, yPosition);
            yPosition += lines.length * 6;
          });
          yPosition += 8;
        }
        
        if (brandInsights.doAndDonts.donts.length > 0) {
          yPosition = checkPageBreak(doc, yPosition, 20);
          doc.setFontSize(12);
          doc.setTextColor(255, 0, 0); // Red
          doc.text('DON\'T:', 25, yPosition);
          doc.setTextColor(0, 0, 0); // Black
          yPosition += 8;
          
          doc.setFontSize(10);
          brandInsights.doAndDonts.donts.forEach((item) => {
            yPosition = checkPageBreak(doc, yPosition, 10);
            const lines = doc.splitTextToSize(`✗ ${item}`, 160);
            doc.text(lines, 30, yPosition);
            yPosition += lines.length * 6;
          });
          yPosition += 8;
        }
      }
      
      // Content Patterns Section
      if (brandInsights.contentPatterns) {
        yPosition = addSection(doc, 'Content Patterns & Structure', brandInsights.contentPatterns, yPosition);
      }
      
      // Visual Style Notes Section
      if (brandInsights.visualStyleNotes) {
        yPosition = addSection(doc, 'Visual Style Guidelines', brandInsights.visualStyleNotes, yPosition);
      }

      // Appendix - Content Inventory
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(20);
      doc.text('Appendix: Content Inventory', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text('Content Summary', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`Total Content Types: ${data.contentTypes.length}`, 25, yPosition);
      yPosition += 7;
      doc.text(`Total Entries: ${data.entries.length}`, 25, yPosition);
      yPosition += 7;
      doc.text(`Total Assets: ${data.assets.length}`, 25, yPosition);
      yPosition += 15;

      // Content Types listing
      if (data.contentTypes.length > 0) {
        doc.setFontSize(12);
        doc.text('Content Types', 20, yPosition);
        yPosition += 8;

        doc.setFontSize(9);
        data.contentTypes.forEach((ct: any) => {
          yPosition = checkPageBreak(doc, yPosition, 15);
          doc.text(`• ${ct.name} (${ct.sys.id})`, 25, yPosition);
          yPosition += 6;
          if (ct.description) {
            const descLines = doc.splitTextToSize(ct.description, 160);
            doc.text(descLines, 30, yPosition);
            yPosition += descLines.length * 5;
          }
          yPosition += 3;
        });
      }

      // Save the PDF
      doc.save(`brand-guidelines-${sdk.ids.space}-${Date.now()}.pdf`);

      setStatus('AI-powered brand guidelines generated successfully!');
      setLoading(false);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF');
      setLoading(false);
    }
  };

  // Helper function to add a section to the PDF
  const addSection = (doc: jsPDF, title: string, content: string, yPosition: number): number => {
    if (!content) return yPosition;
    
    yPosition = checkPageBreak(doc, yPosition, 40);
    
    doc.setFontSize(16);
    doc.text(title, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content, 170);
    
    lines.forEach((line: string) => {
      yPosition = checkPageBreak(doc, yPosition, 10);
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    return yPosition;
  };

  // Helper function to check if we need a page break
  const checkPageBreak = (doc: jsPDF, yPosition: number, requiredSpace: number): number => {
    if (yPosition + requiredSpace > 280) {
      doc.addPage();
      return 20;
    }
    return yPosition;
  };

  return (
    <Box padding="spacingXl">
      <Stack flexDirection="column" spacing="spacingL">
        <Heading>AI-Powered Brand Guidelines Generator</Heading>
        <Paragraph>
          Generate comprehensive, AI-powered brand guidelines by analyzing all content in
          this Contentful space. Our AI examines your content to identify brand voice, tone,
          messaging patterns, and style recommendations.
        </Paragraph>

        {isConfigured === false && (
          <Note variant="warning" title="Configuration Required">
            This app requires a GitHub Personal Access Token to generate brand guidelines.{' '}
            <TextLink
              href={`https://app.contentful.com/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}/apps/install/${sdk.ids.app}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here to configure your GitHub token
            </TextLink>
            , or navigate to Apps → Richard Brandson → Configuration in your Contentful space.
          </Note>
        )}

        {error && (
          <Note variant="negative" title="Error">
            {error}
          </Note>
        )}

        {status && !error && (
          <Note variant="positive" title="Status">
            {status}
          </Note>
        )}

        <Box>
          <Button
            variant="primary"
            onClick={generateBrandGuidelinePDF}
            isDisabled={loading || isConfigured === false}
            startIcon={loading ? <Spinner /> : undefined}
          >
            {loading ? 'Generating PDF...' : 'Generate Brand Guidelines PDF'}
          </Button>
        </Box>

        <Box marginTop="spacingL">
          <Heading as="h3" marginBottom="spacingS">
            What's included in your brand guidelines:
          </Heading>
          <Stack as="ul" flexDirection="column" spacing="spacingXs">
            <li>AI-identified brand voice and tone analysis</li>
            <li>Writing style guidelines derived from your content</li>
            <li>Key themes and messaging pillars</li>
            <li>Content do's and don'ts recommendations</li>
            <li>Content patterns and structure insights</li>
            <li>Visual style guidelines based on your assets</li>
            <li>Complete content inventory (appendix)</li>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default Page;
