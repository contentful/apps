export const serializeText = (data: any, text: string) => {
  const matches = text.match(/\{(.*?)\}/);

  if (matches) {
    const submatch = matches[1].trim();
    const keyChain = submatch.split('/');
    const filteredKeyChain = keyChain.filter((key) => key.length > 0);

    try {
      const finalized = filteredKeyChain.reduce(
        (acc, key) => {
          if (acc[key]) {
            acc = acc[key];

            return acc;
          } else {
            throw new Error(key);
          }
        },
        { ...data }
      );

      const filteredText = text;
      return filteredText.replace(matches[0], finalized);
    } catch (e) {
      // @ts-ignore
      console.warn(`${e.message} not found`);
      return text;
    }
  }
  return text;
};
