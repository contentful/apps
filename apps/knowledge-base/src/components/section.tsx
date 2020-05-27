import styled from '@emotion/styled';

const Section = styled.section<{ isDisabled: boolean }>`
  &:not(:last-child) {
    padding-bottom: 24px;
    margin-bottom: 24px;

    border-bottom: 1px solid #d3dce0;
  }

  ${(props) =>
    props.isDisabled &&
    `
    position: relative;
    pointer-events: none;

    &:after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      z-index: 100;

      width: 100%;
      height: 100%;

      background: rgba(255, 255, 255, 0.5);
    }
  `}
`;

export default Section;
