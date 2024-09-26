import { useContentfulAutoResizer } from '~/hooks/useContentfulAutoResizer';
import { Heading } from '@contentful/f36-typography';
import { Card } from '@contentful/f36-card';

export default function Sidebar() {
  useContentfulAutoResizer();

  return (
    <Card>
      <Heading>Sidebar Location</Heading>
    </Card>
  );
}
