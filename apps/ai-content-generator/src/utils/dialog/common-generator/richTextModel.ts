export default function RichTextModel(text: string) {
  const textLines = text.split('\n');
  console.log(JSON.stringify(textLines));

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
}
