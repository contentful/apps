interface ParsedLine {
  choices: {
    delta: {
      content: string;
    };
  }[];
}

/**
 * A filter function that checks if a line has text data or
 * is the end of a conversation.
 * @param line
 * @returns
 */
const findLineWithTextData = (line: string) => {
  const trimmedLine = line.trim();

  if (trimmedLine === "" || trimmedLine === "[DONE]") {
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
const getContentFromParsedLine = (parsedLine: ParsedLine): string => {
  const { choices } = parsedLine;
  const { delta } = choices[0];

  return delta.content;
};

/**
 * A filter function that checks if a line has text data or
 * is the end of a conversation.
 * @param line
 * @returns
 */
const isEmptyOrDone = (line: string) => line === "" || line === "[DONE]";

export { findLineWithTextData, getContentFromParsedLine };
