import { useContentfulAutoResizer } from '~/hooks/useContentfulAutoResizer';
import { Heading } from '@contentful/f36-typography';
import { Card } from '@contentful/f36-card';

export default function EntrySidebar() {
  useContentfulAutoResizer();

  return (
    <Card>
      <Heading>Entry Sidebar Location</Heading>
    </Card>
  );
}
