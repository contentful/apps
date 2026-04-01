import { Note, Paragraph } from '@contentful/f36-components';
import { GoogleDocsMappingReviewScreen } from './GoogleDocsMappingReviewScreen';
import { loadGoogleDocsReviewFixture } from '../../../../fixtures/googleDocsReview';

interface SimpleReviewScreenProps {
  onBack: () => void;
}

export const SimpleReviewScreen = ({ onBack }: SimpleReviewScreenProps) => {
  const fixture = loadGoogleDocsReviewFixture();

  if (!fixture) {
    return (
      <Note
        variant="warning"
        title="Fixture not found or invalid"
        style={{ margin: '16px', maxWidth: 900 }}>
        <Paragraph marginBottom="none">
          Copy a backend debug payload into ` src/fixtures/googleDocsReview/fixture.json ` and
          reload the app.
        </Paragraph>
      </Note>
    );
  }

  return <GoogleDocsMappingReviewScreen fixture={fixture} onBack={onBack} />;
};
