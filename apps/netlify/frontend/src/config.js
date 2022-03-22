const readCsvParam = (csv) =>
  (csv || '')
    .split(',')
    .map((val) => val.trim())
    .filter((val) => val.length > 0);

export function configToParameters(config) {
  const flat = {
    notificationHookIds: config.netlifyHookIds,
    ...config.sites.reduce((acc, site) => {
      const result = {
        buildHookIds: (acc.buildHookIds || []).concat([site.buildHookId]),
        names: (acc.names || []).concat([site.name]),
        siteIds: (acc.siteIds || []).concat([site.netlifySiteId]),
        siteNames: (acc.siteNames || []).concat([site.netlifySiteName]),
        siteUrls: (acc.siteUrls || []).concat([site.netlifySiteUrl]),
        events: {
          ...(acc.events || {}),
          [site.buildHookId]: {
            cts: site.selectedContentTypes,
            assets: site.assetDeploysOn,
          },
        },
      };

      if (!site.selectedContentTypes || site.selectedContentTypes.length === 0) {
        delete result.events[site.buildHookId].cts;
      }

      if (!site.assetDeploysOn) {
        delete result.events[site.buildHookId].assets;
      }

      return result;
    }, {}),
  };

  return Object.keys(flat).reduce((acc, key) => {
    if (key === 'events') {
      const flatEvents = Object.keys(flat.events).reduce((flatEvents, buildHookId) => {
        const contentTypes = flat.events[buildHookId].cts;
        return {
          ...flatEvents,
          [buildHookId]: {
            cts: Array.isArray(contentTypes)
              ? flat.events[buildHookId].cts.join(',')
              : contentTypes,
            assets: flat.events[buildHookId].assets,
          },
        };
      }, {});
      acc = { ...acc, events: flatEvents };
    } else {
      acc = { ...acc, [key]: flat[key].join(',') };
    }

    return acc;
  }, {});
}

export function parametersToConfig(parameters) {
  parameters = parameters || {};
  const buildHookIds = readCsvParam(parameters.buildHookIds);
  const names = readCsvParam(parameters.names);
  const siteIds = readCsvParam(parameters.siteIds);
  const siteNames = readCsvParam(parameters.siteNames);
  const siteUrls = readCsvParam(parameters.siteUrls);

  // Older installations don't have an events property, so we default
  // to an empty object if the key is falsey
  const events = parameters.events || {};

  return {
    netlifyHookIds: readCsvParam(parameters.notificationHookIds),
    sites: buildHookIds.map((buildHookId, i) => {
      const selectedContentTypes =
        events[buildHookId]?.cts === '*'
          ? events[buildHookId]?.cts
          : readCsvParam(events[buildHookId]?.cts);

      return {
        buildHookId,
        name: names[i],
        netlifySiteId: siteIds[i],
        netlifySiteName: siteNames[i],
        netlifySiteUrl: siteUrls[i],
        selectedContentTypes,
        assetDeploysOn: events[buildHookId]?.assets || false,
      };
    }),
  };
}
