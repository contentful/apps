import { Card } from '@contentful/f36-card';
import { Heading, Subheading } from '@contentful/f36-typography';
import { useInBrowserSdk } from '~/hooks/useInBrowserSdk';
import { useWithContentfulUsers } from '~/hooks/useWithContentfulUsers';

export default function Home() {
  return (
    <Card>
      <Heading>Home Location</Heading>
    </Card>
  );
}
