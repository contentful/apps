export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const scripts = document.getElementsByTagName('script')[0];
    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.src = src;

    script.addEventListener('load', () => resolve());
    script.addEventListener('error', (e) => reject(e));

    scripts.parentNode.insertBefore(script, scripts);
  });
}
