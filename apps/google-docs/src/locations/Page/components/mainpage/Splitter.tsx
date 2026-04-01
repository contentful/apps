import { Box, CommonProps, MarginProps, PaddingProps } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { cx, css } from '@emotion/css';

interface SplitterProps extends CommonProps, MarginProps, PaddingProps {}

const Splitter = (props: SplitterProps) => {
  const { className, ...otherProps } = props;

  return (
    <Box
      {...otherProps}
      as="hr"
      className={cx(
        css({
          width: '100%',
          border: 0,
          borderTop: `1px solid ${tokens.gray300}`,
          height: 0,
          margin: 0,
        }),
        className
      )}
    />
  );
};

export default Splitter;
