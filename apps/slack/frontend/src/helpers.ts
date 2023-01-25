export function openPopup(url: string, w: number, h: number) {
  const left = screen.width / 2 - w / 2;
  const top = screen.height / 2 - h / 2;
  return window.open(url, '_blank', `popup=yes,width=${w}, height=${h}, top=${top}, left=${left}`);
}
