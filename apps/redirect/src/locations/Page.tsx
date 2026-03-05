import { PageAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Heading, Box } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GearSixIcon } from '@contentful/f36-icons';
import { useEffect, useMemo, useState } from 'react';
import { styles } from './Page.styles';
import { RedirectsTable } from '../components/RedirectsTable';
import { RedirectMetrics } from '../components/RedirectMetrics';
import { useRedirects } from '../hooks/useRedirects';
import { VANITY_URL_CONTENT_TYPE_ID } from '../utils/consts';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { VanityUrlEntry } from '../utils/types';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const { redirects, allRedirects, isFetchingRedirects, fetchingRedirectsError, refetchRedirects } =
    useRedirects(currentPage, itemsPerPage);

  const [vanityUrls, setVanityUrls] = useState<VanityUrlEntry[]>([]);

  useEffect(() => {
    const loadVanityUrls = async () => {
      try {
        const res = await sdk.cma.entry.getMany({
          query: { limit: 100, content_type: VANITY_URL_CONTENT_TYPE_ID },
        });
        setVanityUrls(res.items as unknown as VanityUrlEntry[]);
      } catch (error) {
        console.error('Error fetching vanity urls:', error);
        setVanityUrls([]);
      }
    };
    loadVanityUrls();
  }, [sdk]);

  const metricsItems = useMemo(() => {
    const locale = sdk.locales.default;
    const active = allRedirects.filter((r) => r.fields.active[locale]).length;
    const inactive = allRedirects.filter((r) => !r.fields.active[locale]).length;
    const permanent = allRedirects.filter(
      (r) => r.fields.redirectType[locale] === 'Permanent (301)'
    ).length;
    const temporary = allRedirects.filter(
      (r) => r.fields.redirectType[locale] === 'Temporary (302)'
    ).length;

    return [
      { label: 'Total Redirects', value: allRedirects.length },
      { label: 'Active Redirects', value: active },
      { label: 'Inactive Redirects', value: inactive },
      { label: "Vanity URL's", value: vanityUrls.length ?? '—' },
      { label: '301 Permanent', value: permanent },
      { label: '302 Temporary', value: temporary },
    ];
  }, [allRedirects, sdk.locales.default, vanityUrls]);

  return (
    <Flex flexDirection="column" style={styles.container}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
        <Heading>Redirects manager</Heading>
        <Button
          variant="secondary"
          startIcon={<GearSixIcon />}
          onClick={() => {
            sdk.navigator.openAppConfig();
          }}
          isDisabled={false}>
          App configuration
        </Button>
      </Flex>

      <Box padding="spacingL">
        <RedirectMetrics metrics={metricsItems} isLoading={isFetchingRedirects} />
        <RedirectsTable
          redirects={redirects}
          isFetchingRedirects={isFetchingRedirects}
          fetchingRedirectsError={fetchingRedirectsError}
          refetchRedirects={refetchRedirects}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Box>
    </Flex>
  );
};

export default Page;
