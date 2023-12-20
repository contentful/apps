const contentPrompt = (prompt: string) =>
  `You have to write the content of a blog post in 400 words or less about ${prompt}. ONLY generate the body content for the blog post! Do not include a title or header in the response! Pretend that you are just writing the article, and someone else is writing the title.`;

export default contentPrompt;
