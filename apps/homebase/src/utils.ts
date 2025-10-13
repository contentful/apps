export const replaceMailtoAmp = (string: string) => {
  return string.replace(/href="mailto:[^"]*&amp;/g, function (match) {
    return match.replace(/&amp;/g, '&');
  });
};
