// V1
export default function RichTextModel(text: string) {
  return {
    nodeType: 'document',
    data: {},
    content: [
      {
        nodeType: 'paragraph',
        data: {},
        content: [
          {
            nodeType: 'text',
            value: text.replace(/^\n+/, ''),
            data: {},
            marks: [],
          },
        ],
      },
    ],
  };
}
