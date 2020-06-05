import * as React from 'react';
import styled from '@emotion/styled';
import Logo from '~/components/logo';

const Container = styled.section`
  height: auto;
  min-height: 65vh;
  max-width: 768px;
  padding: 2rem 3rem;
  margin: 30px auto;

  background-color: #fff;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 20px;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;

    width: 100%;
    height: 100%;

    background-image: linear-gradient(to bottom, #274f7b 40%, #fff 40%);
  }
`;

const Footer = styled.footer`
  margin: 32px auto;
  max-width: 768px;

  text-align: center;
`;

const Layout: React.FC = (props) => {
  return (
    <div>
      <Container>{props.children}</Container>

      <Footer>
        <Logo />
      </Footer>
    </div>
  );
};

export default Layout;
