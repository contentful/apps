/**
 * This function is used to generate a rich text model from a string
 * TODO: We should see if there are pre-existing functions that do this
 * @param text
 * @returns
 */
const richTextModel = (text: string) => {
  const textLines = text.split('\n');

  return {
    nodeType: 'document',
    data: {},
    content: textLines.map((line) => ({
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'text',
          value: line,
          marks: [],
          data: {},
        },
      ],
    })),
  };
};

export default richTextModel;
