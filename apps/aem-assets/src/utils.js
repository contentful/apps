const ASSET_RENDITIONS_KEY = 'http://ns.adobe.com/adobecloud/rel/rendition';
const ADOBE_EXPERIENCE_URL = 'https://experience.adobe.com/';

/**
 * Source: https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_pick
 */
export function pick(object, keys) {
  return keys.reduce((result, key) => {
    if (object && object.hasOwnProperty.call(object, key)) {
      result[key] = object[key];
    }
    return result;
  }, {});
}

function getAssetId(asset) {
  return asset['repo:assetId'] || asset['repo:id'] || asset.id;
}

export function getMetadata(asset, renditions) {
  const computed = asset?.computedMetadata || {};
  const { _embedded, _links, ...copy } = computed;
  return { ...copy, renditions };
}

export function getRenditions(asset) {
  const links = asset?.computedMetadata?._links?.[ASSET_RENDITIONS_KEY] ?? [];
  return links
    .filter((r) => typeof r?.href === 'string' && r.href.length > 0)
    .map((r) => ({ href: r.href, height: r.height, width: r.width, type: r.type }))
    .sort((a, b) => Number(a.width) - Number(b.width));
}

export function getThumbUrl(asset, config) {
  const assetRootUrl = config.assetsUrlRoot || null;
  const assetId = getAssetId(asset);
  const assetName = asset['repo:name'] || asset.name || '';

  let thumbUrl = '';
  if (assetRootUrl) {
    const slash = assetRootUrl.endsWith('/') ? '' : '/';
    thumbUrl = `${assetRootUrl}${slash}${assetId}`;
  } else {
    const renditions = getRenditions(asset);
    if (Array.isArray(renditions) && renditions.length > 0) {
      thumbUrl = getSafeRenditionUrl(asset, renditions);
    } else {
      thumbUrl = `${ADOBE_EXPERIENCE_URL}${assetId}`;
    }
  }
  return thumbUrl;
}

export function getSafeRenditionUrl(asset, renditions) {
  const usable = renditions.filter((r) => Number.isFinite(Number(r.width)));
  const preferred = usable.find((r) => r.width >= 150 && r.width <= 400);
  const nearest = usable[0];
  return preferred?.href ?? nearest?.href ?? asset?.url ?? '';
}

export function transformAssets(assets, config) {
  const source = Array.isArray(assets) ? assets : [];
  return source
    .filter((asset) => asset?.id)
    .map((asset) => {
      const renditions = getRenditions(asset);
      return {
        id: asset['repo:assetId'] || asset['repo:id'] || asset.id,
        name: asset['repo:name'] || asset.name || '',
        url: getThumbUrl(asset, config),
        metadata: getMetadata(asset, renditions),
      };
    });
}
