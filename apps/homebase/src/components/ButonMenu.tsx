import { Menu, Button, MenuProps, ButtonProps } from '@contentful/f36-components';

const ButtonMenu = ({
  children,
  buttonLabel,
  isDisabled,
  buttonProps,
  ...props
}: MenuProps & {
  children: React.ReactNode;
  buttonLabel: string;
  isDisabled: boolean;
  buttonProps?: ButtonProps;
  menuProps?: MenuProps;
}) => {
  return isDisabled ? (
    <Button isDisabled>{buttonLabel}</Button>
  ) : (
    <Menu {...props}>
      <Menu.Trigger>
        <Button {...buttonProps}>{buttonLabel}</Button>
      </Menu.Trigger>
      {children}
    </Menu>
  );
};

export default ButtonMenu;
