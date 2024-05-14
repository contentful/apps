// Import and instantiate a sentiment analysis library
import Sentiment from 'sentiment';
const sentiment = new Sentiment();

export const handler = (event, context) => {
  // Extract the 'description' field from the body and analyze its sentiment
  const description = event.body.fields.description['en-US'];
  const { score } = sentiment.analyze(description);
  console.log('Sentiment score:', score);

  // Discard events if their 'description' field has a negative sentiment
  const isHappy = score > 0;
  return { result: isHappy };
};
