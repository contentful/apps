const generateRandomString = (length: number): string => {
  return window.btoa(Math.random().toString() + Math.random().toString()).slice(0, length);
};

export { generateRandomString };
