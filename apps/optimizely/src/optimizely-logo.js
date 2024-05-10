import React from "react";

const OptimizelyLogo = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    // viewBox="0 0 149.81 148.48"
    viewBox="0 0 150 150"
    {...props}
  >
    <path
      d="M50.29 81.41V99.1a49.41 49.41 0 0 0 49.35-49.35H82a31.71 31.71 0 0 1-31.71 31.66Z"
      style={{
        fill: "#3be081",
      }}
    />
    <path
      d="M50.29 130.16a31.43 31.43 0 0 1 0-62.85V49.76a49 49 0 0 0-.14 98h.14Z"
      style={{
        fill: props.arccolor,
      }}
    />
    <path
      d="M50.29 130.16v17.55a49 49 0 0 0 49-49H81.72a31.46 31.46 0 0 1-31.43 31.45Z"
      style={{
        fill: "#0cf",
      }}
    />
    <path
      d="M50.29 32.19v17.56a49 49 0 0 0 49-49H81.72a31.46 31.46 0 0 1-31.43 31.44Z"
      style={{
        fill: "#861dff",
      }}
    />
    <path
      d="M99.59 32.19v17.56a49 49 0 0 0 49-49H131a31.46 31.46 0 0 1-31.41 31.44Z"
      style={{
        fill: "#fc7f10",
      }}
    />
  </svg>
);

export default OptimizelyLogo;

