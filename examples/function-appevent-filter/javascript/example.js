const appEventFilteringHandler = (event, context) => {
  // Filter out all events that are not of type 'Entry' (Assets, etc.)
  return {
    result: event.entityType === 'Entry',
  };
};

export const handler = (event, context) => {
  if (event.type === 'appevent.filter') {
    return appEventFilteringHandler(event, context);
  }
  throw new Error('Unknown Event');
};
