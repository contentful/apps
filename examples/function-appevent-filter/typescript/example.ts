import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import { AppEventEntry } from '@contentful/node-apps-toolkit/lib/requests/typings';

// Import and instantiate a sentiment analysis library
import Sentiment from 'sentiment';
const sentiment = new Sentiment();

// Since our function only accepts filter events,
// we can safely assume the event is of type appevent.filter
export const handler: FunctionEventHandler<'appevent.filter'> = (event, context) => {
  // Since our app event subscription only reacts to Entry publish events,
  // we can safely assume that the event is an AppEventEntry
  const { body } = event as AppEventEntry;

  // Extract the 'description' field from the body and analyze its sentiment
  const description = body.fields.description['en-US'];
  const { score } = sentiment.analyze(description);
  console.log('Sentiment score:', score);

  // Discard events if their 'description' field has a negative sentiment
  const isHappy = score > 0;
  return { result: isHappy };
};
