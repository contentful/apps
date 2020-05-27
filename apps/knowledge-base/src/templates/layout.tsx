import * as React from 'react';
import { css } from 'emotion';

const layout = css`
  height: auto;
  min-height: 65vh;
  max-width: 768px;
  padding: 2rem 3rem;
  margin: 30px auto;

  background-color: #fff;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 20px;

  &:before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;

    width: 100%;
    height: 100%;

    background-image: linear-gradient(to bottom, #274f7b 40%, #fff 40%);
  }
`;

const Layout: React.FC = (props) => {
  return <section className={layout}>{props.children}</section>;
};

export default Layout;
