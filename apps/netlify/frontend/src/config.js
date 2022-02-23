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
        },
      };

      if (!site.selectedContentTypes || site.selectedContentTypes.length === 0) {
        return result;
      }

      result.events = {
        ...result.events,
        [site.buildHookId]: site.selectedContentTypes,
      }

      return result;
    }, {}),
  };

  return Object.keys(flat).reduce((acc, key) => {
    if (key === 'events') {
      const flatEvents = Object.keys(flat.events).reduce((flatEvents, buildHookId) => {
        const contentTypes = flat.events[buildHookId];
        return {
          ...flatEvents,
          [buildHookId]: Array.isArray(contentTypes) ? flat.events[buildHookId].join(',') : contentTypes
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

  return {
    netlifyHookIds: readCsvParam(parameters.notificationHookIds),
    sites: buildHookIds.map((buildHookId, i) => {
      const selectedContentTypes = parameters.events[buildHookId] === '*' ?
      parameters.events[buildHookId] :
      readCsvParam(parameters.events[buildHookId]);

      return {
        buildHookId,
        name: names[i],
        netlifySiteId: siteIds[i],
        netlifySiteName: siteNames[i],
        netlifySiteUrl: siteUrls[i],
        selectedContentTypes,
      };
    }),
  };
}
