declare module '*.svg' {
  import React = require('react');
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default content;
}
