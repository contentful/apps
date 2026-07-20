const ASSET_RENDITIONS_KEY = 'http://ns.adobe.com/adobecloud/rel/rendition';

/**
 * Source: https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_pick
 */
export function pick(object, keys) {
  return keys.reduce((obj, key) => {
    if (object && object.hasOwnProperty(key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
}

export function getMetadata(asset, renditions) {
  const { _embedded, _links, ...copy } = asset.computedMetadata;
  const metadata = { ...copy, renditions };
  return metadata;
}

export function getRenditions(asset) {
  const renditions = asset?.computedMetadata?._links[ASSET_RENDITIONS_KEY]?.map(
    (r) => {
      return {
        href: r.href,
        height: r.height,
        width: r.width,
        type: r.type,
      };
    },
  );
  return renditions.sort((a, b) => a.width - b.width);
}

export function transformAssets(assets) {
  const transformedAssets = assets.map((asset) => {
    const renditions = getRenditions(asset);
    const thumbUrl = renditions.find(
      (r) => r.width >= 150 && r.width <= 400,
    ).href;

    const transformedAsset = {
      id: asset['repo:assetId'] || asset['repo:id'] || asset.id,
      name: asset['repo:name'] || asset.name || '',
      url: thumbUrl,
      metadata: getMetadata(asset, renditions),
      // path: asset['repo:path'] || asset.path || '',
      // size: asset['repo:size'] || 0,
      // mimetype: asset['dc:format'] || asset.mimetype || '',
      // width: asset['tiff:imageWidth'] || asset.width || 0,
      // height: asset['tiff:imageLeength'] || asset.height || 0,
      // state: asset['repo:state'] || '',
      // isExpired: asset.isExpired || false,
      // renditions: renditions,
    };

    return transformedAsset;
  });

  return transformedAssets;
}
