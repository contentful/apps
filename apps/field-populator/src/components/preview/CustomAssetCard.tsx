import { DialogAppSDK } from '@contentful/app-sdk';
import { AssetCard, Skeleton } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AssetProps } from 'contentful-management';
import { useEffect, useState } from 'react';

interface CustomAssetCardProps {
  assetId: string;
  locale: string;
}

const CustomAssetCard = ({ assetId, locale }: CustomAssetCardProps) => {
  const sdk = useSDK<DialogAppSDK>();
  const [asset, setAsset] = useState<AssetProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        const fetchedAsset = await sdk.cma.asset.get({ assetId });
        setAsset(fetchedAsset);
      } catch (err) {
        console.error('Error fetching asset:', err);
        setError('Asset not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [assetId, sdk.cma.asset]);

  if (loading) {
    return (
      <Skeleton.Container>
        <Skeleton.Image width={150} height={100} />
      </Skeleton.Container>
    );
  }

  if (error || !asset) {
    return <AssetCard title="Asset not found" size="small" />;
  }

  const title =
    asset.fields.title?.[locale] || asset.fields.title?.[sdk.locales.default] || 'Untitled';
  const file = asset.fields.file?.[locale] || asset.fields.file?.[sdk.locales.default];
  const src = file?.url ? `https:${file.url}` : undefined;

  return <AssetCard title={title} size="small" src={src} />;
};

export default CustomAssetCard;
