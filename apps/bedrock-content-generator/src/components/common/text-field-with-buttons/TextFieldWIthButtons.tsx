import { ChangeEvent, ReactNode } from "react";
import { Flex, Textarea, Paragraph } from "@contentful/f36-components";
import { ContentTypeFieldValidation } from "contentful-management";
import TextCounter from "../text-counter/TextCounter";
import HyperLink from "../HyperLink/HyperLink";
import { styles } from "./TextFieldWithButtons.styles";
import { TokenWarning } from "@configs/token-warning/tokenWarning";
import {
  ErrorCircleOutlineIcon,
  ExternalLinkIcon,
} from "@contentful/f36-icons";
import { errorMessages } from "@components/app/dialog/common-generator/errorMessages";
import { useSDK } from "@contentful/react-apps-toolkit";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { css } from "@emotion/react";
import tokens from "@contentful/f36-tokens";

const errorIconStyles = css({
  flexShrink: 0,
});

const warningStyles = css({
  color: tokens.colorWarning,
});

interface Props {
  inputText: string;
  onFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
  sizeValidation?: ContentTypeFieldValidation["size"] | null;
  isDisabled?: boolean;
  placeholder?: string;
  helpText?: string;
  warningMessage?: TokenWarning;
  hasError?: boolean;
  errorMessage?: string | ReactNode;
}

const TextFieldWithButtons = (props: Props) => {
  const {
    inputText,
    onFieldChange,
    children,
    sizeValidation,
    isDisabled,
    placeholder,
    helpText,
    warningMessage,
    hasError,
    errorMessage,
  } = props;

  const sdk = useSDK<SidebarAppSDK>();
  const openConfigPage = () => sdk.navigator.openAppConfig();

  return (
    <Flex
      flexDirection="column"
      fullWidth
      paddingLeft="spacing2Xl"
      paddingRight="spacing2Xl"
      css={styles.container}
    >
      <Textarea
        resize="none"
        css={styles.textarea}
        value={inputText}
        onChange={onFieldChange}
        isDisabled={isDisabled}
        placeholder={placeholder}
      ></Textarea>
      <TextCounter
        text={inputText}
        maxLength={sizeValidation?.max}
        minLength={sizeValidation?.min}
      />
      {hasError ? (
        <>
          <Flex marginBottom="spacingM">
            <ErrorCircleOutlineIcon
              css={errorIconStyles}
              variant="negative"
              marginRight="spacing2Xs"
              data-testid="error-icon"
              size="small"
            />

            <Flex flexDirection="column">
              {errorMessage}
              <Paragraph css={warningStyles}>
                <HyperLink
                  body={errorMessages.openSettingsMessage}
                  substring={errorMessages.openSettingsSubstring}
                  onClick={openConfigPage}
                />
              </Paragraph>
            </Flex>
          </Flex>
        </>
      ) : null}

      <Flex alignSelf="flex-end">
        {helpText && <Paragraph css={styles.helpText}>{helpText}</Paragraph>}
        {warningMessage && (
          <Flex css={styles.warningContainer}>
            <Paragraph css={styles.warningMessage} marginBottom="none">
              <HyperLink
                body={warningMessage.warningText}
                substring={warningMessage.substring}
                hyperLinkHref={warningMessage.link}
                icon={<ExternalLinkIcon />}
                alignIcon="end"
                textLinkStyle={styles.warningLink}
              />
            </Paragraph>
          </Flex>
        )}
        {children}
      </Flex>
    </Flex>
  );
};

export default TextFieldWithButtons;
