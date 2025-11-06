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

      // Create PDF with AI-generated insights and enhanced styling
      const doc = new jsPDF();
      let yPosition = 20;

      // Define colors (inspired by brand guideline aesthetics)
      const colors = {
        primary: [41, 98, 255] as [number, number, number], // Blue
        secondary: [102, 102, 102] as [number, number, number], // Gray
        accent: [0, 168, 107] as [number, number, number], // Green
        warning: [255, 91, 91] as [number, number, number], // Red
        dark: [26, 26, 26] as [number, number, number], // Dark gray
        light: [245, 245, 245] as [number, number, number], // Light gray
      };

      // Title Page with better styling
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, 210, 80, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('Brand Guidelines', 105, 40, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Generated Content Style Guide', 105, 55, { align: 'center' });
      
      // Info section
      doc.setTextColor(...colors.secondary);
      doc.setFontSize(10);
      doc.text(`Space: ${sdk.ids.space}`, 105, 95, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 105, { align: 'center' });
      
      // Add footer note on first page
      doc.setFontSize(9);
      doc.setTextColor(...colors.secondary);
      doc.text('Generated using AI analysis of your content', 105, 270, { align: 'center' });
      doc.text('Inspired by best practices from Contentful, Slack, and MailChimp', 105, 277, { align: 'center' });

      // Add new page for content
      doc.addPage();
      yPosition = 20;

      // Table of Contents background
      doc.setFillColor(...colors.light);
      doc.rect(15, 15, 180, 35, 'F');
      
      doc.setTextColor(...colors.dark);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('About This Guide', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.secondary);
      doc.text(`This brand guideline was generated by analyzing ${data.entries.length} content entries`, 20, 35);
      doc.text(`across ${data.contentTypes.length} content types in your Contentful space.`, 20, 42);
      yPosition = 60;

      // Brand Voice & Personality Section (with enhanced styling)
      yPosition = addStyledSection(doc, colors, 'Brand Voice & Personality', brandInsights.brandVoice, yPosition, true);
      
      // Tone Spectrum Section
      yPosition = addStyledSection(doc, colors, 'Tone Spectrum', brandInsights.toneDescription, yPosition);
      
      // Writing Principles Section
      if (brandInsights.writingPrinciples && brandInsights.writingPrinciples.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 50);
        doc.setFillColor(...colors.primary);
        doc.rect(15, yPosition - 3, 3, 10, 'F');
        doc.setTextColor(...colors.dark);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Writing Principles', 22, yPosition + 5);
        yPosition += 15;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.secondary);
        brandInsights.writingPrinciples.forEach((principle, idx) => {
          yPosition = checkPageBreak(doc, yPosition, 15);
          doc.setTextColor(...colors.primary);
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}.`, 20, yPosition);
          doc.setTextColor(...colors.dark);
          doc.setFont('helvetica', 'normal');
          const lineCount = renderTextWithBold(doc, principle, 28, yPosition, 165);
          yPosition += lineCount * 6 + 3;
        });
        yPosition += 10;
      }
      
      // Grammar & Mechanics Section
      if (brandInsights.grammarAndMechanics) {
        yPosition = addStyledSection(doc, colors, 'Grammar & Mechanics', brandInsights.grammarAndMechanics, yPosition);
      }
      
      // Vocabulary Guidance
      if (brandInsights.vocabularyGuidance) {
        yPosition = addStyledSection(doc, colors, 'Vocabulary & Word Choice', brandInsights.vocabularyGuidance, yPosition);
      }
      
      // Key Themes Section
      if (brandInsights.keyThemes.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 40);
        doc.setFontSize(16);
        doc.text('Key Themes', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        brandInsights.keyThemes.forEach((theme) => {
          yPosition = checkPageBreak(doc, yPosition, 10);
          doc.text('• ', 25, yPosition);
          const lineCount = renderTextWithBold(doc, theme, 30, yPosition, 165);
          yPosition += lineCount * 6 + 1;
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
          doc.text('• ', 25, yPosition);
          const lineCount = renderTextWithBold(doc, pillar, 30, yPosition, 165);
          yPosition += lineCount * 6 + 1;
        });
        yPosition += 8;
      }
      
      // Do's and Don'ts Section with enhanced styling
      if (brandInsights.doAndDonts.dos.length > 0 || brandInsights.doAndDonts.donts.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 60);
        doc.setFillColor(...colors.primary);
        doc.rect(15, yPosition - 3, 3, 10, 'F');
        doc.setTextColor(...colors.dark);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Content Do\'s and Don\'ts', 22, yPosition + 5);
        yPosition += 18;
        
        // DO section with green styling
        if (brandInsights.doAndDonts.dos.length > 0) {
          doc.setFillColor(230, 255, 230); // Light green background
          doc.rect(15, yPosition - 5, 180, 10, 'F');
          
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.accent); // Green
          doc.text('✓ DO', 20, yPosition + 2);
          yPosition += 12;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...colors.dark);
          brandInsights.doAndDonts.dos.forEach((item) => {
            yPosition = checkPageBreak(doc, yPosition, 12);
            doc.text('• ', 25, yPosition);
            const lineCount = renderTextWithBold(doc, item, 30, yPosition, 165);
            yPosition += lineCount * 5.5 + 2;
          });
          yPosition += 8;
        }
        
        // DON'T section with red styling
        if (brandInsights.doAndDonts.donts.length > 0) {
          yPosition = checkPageBreak(doc, yPosition, 25);
          doc.setFillColor(255, 230, 230); // Light red background
          doc.rect(15, yPosition - 5, 180, 10, 'F');
          
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.warning); // Red
          doc.text('✗ DON\'T', 20, yPosition + 2);
          yPosition += 12;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...colors.dark);
          brandInsights.doAndDonts.donts.forEach((item) => {
            yPosition = checkPageBreak(doc, yPosition, 12);
            doc.text('• ', 25, yPosition);
            const lineCount = renderTextWithBold(doc, item, 30, yPosition, 165);
            yPosition += lineCount * 5.5 + 2;
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
        yPosition = addStyledSection(doc, colors, 'Visual Style Guidelines', brandInsights.visualStyleNotes, yPosition);
      }
      
      // Content Type Guidelines
      if (brandInsights.contentTypeGuidelines) {
        yPosition = addStyledSection(doc, colors, 'Content Type Guidelines', brandInsights.contentTypeGuidelines, yPosition);
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
    
    // Split content by paragraphs and render with bold support
    const paragraphs = content.split('\n');
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim()) {
        yPosition = checkPageBreak(doc, yPosition, 10);
        const lineCount = renderTextWithBold(doc, paragraph, 20, yPosition, 170);
        yPosition += lineCount * 6;
      }
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

  // Helper function to clean markdown formatting from text
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/^#{1,6}\s+\d*\.?\s*/gm, '') // Remove markdown headers like "## 6." or "### Section"
      .replace(/^#{1,6}\s+/gm, '') // Remove remaining headers
      .trim();
  };

  // Helper function to render text with markdown bold formatting
  const renderTextWithBold = (doc: jsPDF, text: string, x: number, y: number, maxWidth?: number): number => {
    // Clean markdown headers first
    text = cleanMarkdown(text);
    
    // Split text by **bold** markers
    const parts: Array<{ text: string; bold: boolean }> = [];
    const regex = /(\*\*.*?\*\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), bold: false });
      }
      // Add bold part (without the ** markers)
      parts.push({ text: match[1].replace(/\*\*/g, ''), bold: true });
      lastIndex = regex.lastIndex;
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), bold: false });
    }

    // If no bold markers found, render as normal
    if (parts.length === 0) {
      if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return lines.length;
      } else {
        doc.text(text, x, y);
        return 1;
      }
    }

    // Render each part with appropriate styling and handle line wrapping
    let currentX = x;
    let currentY = y;
    let lineCount = 1;
    const currentFont = doc.getFont();
    const lineHeight = 6;
    
    parts.forEach((part) => {
      if (part.text) {
        // Set font style
        doc.setFont(currentFont.fontName, part.bold ? 'bold' : 'normal');
        
        // Split part into words for proper wrapping
        const words = part.text.split(' ');
        
        words.forEach((word, idx) => {
          const wordWithSpace = idx < words.length - 1 ? word + ' ' : word;
          const wordWidth = doc.getTextWidth(wordWithSpace);
          
          // Check if we need to wrap to next line
          if (maxWidth && currentX + wordWidth > x + maxWidth && currentX > x) {
            currentY += lineHeight;
            currentX = x;
            lineCount++;
          }
          
          doc.text(wordWithSpace, currentX, currentY);
          currentX += wordWidth;
        });
      }
    });
    
    // Reset to normal font
    doc.setFont(currentFont.fontName, 'normal');
    
    return lineCount;
  };

  // Helper function to add a styled section (inspired by modern brand guidelines)
  const addStyledSection = (
    doc: jsPDF,
    colors: {
      primary: [number, number, number];
      secondary: [number, number, number];
      dark: [number, number, number];
    },
    title: string,
    content: string,
    yPosition: number,
    isFirst: boolean = false
  ): number => {
    if (!content) return yPosition;
    
    yPosition = checkPageBreak(doc, yPosition, isFirst ? 60 : 40);
    
    // Section header with accent bar
    doc.setFillColor(...colors.primary);
    doc.rect(15, yPosition - 3, 3, 10, 'F');
    
    doc.setTextColor(...colors.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 22, yPosition + 5);
    yPosition += 15;
    
    // Content with better spacing and bold markdown support
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.secondary);
    
    // Split content by lines and render with bold support
    const paragraphs = content.split('\n');
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim()) {
        yPosition = checkPageBreak(doc, yPosition, 10);
        const lineCount = renderTextWithBold(doc, paragraph, 20, yPosition, 175);
        yPosition += lineCount * 5.5;
      }
    });
    
    yPosition += 12;
    return yPosition;
  };

  return (
    <Box padding="spacingL" paddingLeft="spacingXl" paddingRight="spacingXl">
      <Stack flexDirection="column" spacing="spacingL" alignItems="flex-start">
        <Box>
          <Heading marginBottom="spacingS">AI-Powered Brand Guidelines Generator</Heading>
          <Paragraph>
            Generate comprehensive, AI-powered brand guidelines by analyzing all content in
            this Contentful space. Our AI examines your content to identify brand voice, tone,
            messaging patterns, and style recommendations.
          </Paragraph>
        </Box>

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
          <Note variant="positive">
            <strong>Status:</strong> {status}
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

        <Note variant="primary" title="What's included in your brand guidelines">
          <Stack as="ul" flexDirection="column" spacing="spacingXs" style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
            <li>AI-identified brand voice and tone analysis</li>
            <li>Writing style guidelines derived from your content</li>
            <li>Key themes and messaging pillars</li>
            <li>Content do's and don'ts recommendations</li>
            <li>Content patterns and structure insights</li>
            <li>Visual style guidelines based on your assets</li>
            <li>Complete content inventory (appendix)</li>
          </Stack>
        </Note>
      </Stack>
    </Box>
  );
};

export default Page;
