/**
 * A filter function that checks if a line has text data or
 * is the end of a conversation.
 * @param line
 * @param i
 * @returns
 */
const findLineWithTextData = (line: string, i: number) => {
  const trimmedLine = line.trim();

  if (trimmedLine === '' || trimmedLine === '[DONE]') {
    return false;
  }

  const parsedLine = JSON.parse(trimmedLine);
  return parsedLine.choices[0].delta?.content?.length > 0;
};

/**
 * Gets the content from a parsed line.
 * @param parsedLine
 * @returns
 */
const getContentFromParsedLine = (parsedLine: any): string => {
  const { choices } = parsedLine;
  const { delta } = choices[0];

  return delta.content;
};

export { findLineWithTextData, getContentFromParsedLine };
