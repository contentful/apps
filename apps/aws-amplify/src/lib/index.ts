export function buildAppUrl(branchName: string, defaultDomain: string): string {
  return `https://${branchName}.${defaultDomain}`;
}

export function formatLastDeployedTime(date: Date | undefined | null): string | null {
  return date ? `${date.toDateString()} at ${date.toLocaleTimeString()}` : null;
}
