const findLineWithTextData = (line: string, i: number) => {
  const trimmedLine = line.trim();

  if (trimmedLine === '' || trimmedLine === '[DONE]') {
    return false;
  }

  const parsedLine = JSON.parse(trimmedLine);
  return parsedLine.choices[0].delta?.content?.length > 0;
};

const getContentFromParsedLine = (parsedLine: any): string => {
  const { choices } = parsedLine;
  const { delta } = choices[0];

  return delta.content;
};

export { findLineWithTextData, getContentFromParsedLine };
