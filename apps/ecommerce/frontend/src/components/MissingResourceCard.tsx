import {
  Badge,
  Box,
  Card,
  Flex,
  IconButton,
  SectionHeading,
  Tooltip,
} from '@contentful/f36-components';
import { CloseTrimmedIcon, HelpCircleTrimmedIcon } from '@contentful/f36-icons';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';

interface MissingResourceCardProps {
  onRemove: Function;
  dragHandleRender?: RenderDragFn;
  error: string;
  errorMessage?: string;
  errorStatus?: number;
  index?: number;
  isLoading?: boolean;
}

const MissingResourceCard = (props: MissingResourceCardProps) => {
  return (
    <Card
      isLoading={props.isLoading}
      withDragHandle={!!props.dragHandleRender}
      dragHandleRender={props.dragHandleRender}
      padding="none"
      isHovered={false}>
      <Box paddingTop="spacingM" paddingBottom="spacingM" paddingLeft="spacingM">
        <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
          <Flex alignItems="center" isInline={true}>
            <SectionHeading marginBottom="none">Resource missing or inaccessible</SectionHeading>
            <Tooltip
              content={props.errorMessage ? `${props.errorMessage} - ${props.error}` : props.error}>
              <IconButton
                size="small"
                icon={<HelpCircleTrimmedIcon size="tiny" />}
                aria-label="More information"
              />
            </Tooltip>
          </Flex>
          <Flex alignItems="center" isInline={true}>
            <Badge variant={props.errorStatus === 404 ? 'warning' : 'negative'}>
              {props.errorMessage}
            </Badge>
            <IconButton
              icon={<CloseTrimmedIcon />}
              onClick={() => props.onRemove(props.index)}
              aria-label="Remove"
            />
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
};

export default MissingResourceCard;
