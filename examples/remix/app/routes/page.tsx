import { Card } from '@contentful/f36-card';
import { Heading, Subheading } from '@contentful/f36-typography';
import { useInBrowserSdk } from '~/hooks/useInBrowserSdk';
import { useWithContentfulUsers } from '~/hooks/useWithContentfulUsers';

export default function Page() {
  const { sdk } = useInBrowserSdk();
  const { data } = useWithContentfulUsers([{ userId: sdk?.ids.user || '' }]);
  return (
    <Card>
      <Heading>Page Location</Heading>
      <Subheading>Hello {data[0]?.user?.firstName}</Subheading>
    </Card>
  );
}
