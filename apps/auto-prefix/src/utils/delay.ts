export const MAX_RETRIES = 4;
export const INITIAL_DELAY_MS = 500;
export const MAX_DELAY_MS = 2000;

export const delay = (attempt: number): Promise<void> => {
  const delay = Math.min(INITIAL_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);

  return new Promise((resolve) => setTimeout(resolve, delay));
};
