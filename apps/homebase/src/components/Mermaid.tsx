import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid with manual rendering (prevents auto-scanning for diagrams on page load)
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  themeVariables: {
    primaryColor: '#f4f6f8',
    primaryTextColor: '#333',
    primaryBorderColor: '#ddd',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    nodeSpacing: 80,
    rankSpacing: 60,
    curve: 'basis',
    padding: 20,
  },
  sequence: {
    useMaxWidth: true,
  },
  // Increase default text size and node dimensions
  fontSize: 14,
  fontFamily: 'Arial, sans-serif',
});

export default function Mermaid({ code }: { code: string }) {
  // Ref to the DOM element where the rendered SVG will be injected
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Early return if the ref hasn't been attached to a DOM element yet
    if (!ref.current) return;

    //generate a unique identifier for this diagram instance
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;

    // call Mermaid's async render method with the unique ID and diagram code
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        // destructure the SVG string from the render result
        // and check if component is still mounted before DOM manipulation
        if (ref.current) {
          // Inject the rendered SVG directly into the DOM element
          ref.current.innerHTML = svg;
        }
      })
      .catch((e) => {
        if (ref.current) {
          // show error message in a preformatted block for debugging
          ref.current.innerHTML = `<pre>${e instanceof Error ? e.message : String(e)}</pre>`;
        }
      });
  }, [code]); // re-run effect whenever the diagram code changes

  // return a div element that will contain the rendered diagram or error message
  return <div ref={ref} />;
}
