import { Box, CommonProps, MarginProps, PaddingProps } from '@contentful/f36-components';
import { cx, css } from 'emotion';
import tokens from '@contentful/f36-tokens';

interface SplitterProps extends CommonProps, MarginProps, PaddingProps {}
const Splitter = (props: SplitterProps) => {
  const { className, ...otherProps } = props;

  return (
    <Box
      {...otherProps}
      as={'hr'}
      className={cx(
        css({
          border: 0,
          height: '1px',
          backgroundColor: tokens.gray300,
        }),
        className
      )}
    />
  );
};
export default Splitter;
