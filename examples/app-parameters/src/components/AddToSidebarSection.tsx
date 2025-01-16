import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Checkbox,
  Flex,
  Form,
  FormControl,
  Note,
  Paragraph,
  Subheading,
  Table,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { styles } from './AddToSidebarSection.styles';

export type SidebarEditorInterface = {
  sidebar?: {
    position: number;
    settings?: Record<string, any>;
  };
};

export interface ContentTypesWithEditorInterface extends ContentTypeProps {
  position?: number;
  settings?: Record<string, any>;
}

export interface SelectedContentTypes {
  [key: string]: string;
}

interface Props {
  allContentTypes: ContentTypesWithEditorInterface[];
  selectedContentTypes: SelectedContentTypes;
  handleCheckboxChange: (contentType: ContentTypeProps, isChecked: boolean) => void;
  handleColorChange: (contentType: ContentTypeProps, color: string) => void;
}

const AddToSidebarSection = (props: Props) => {
  const { allContentTypes, selectedContentTypes, handleCheckboxChange, handleColorChange } = props;
  const sdk = useSDK<ConfigAppSDK>();
  const space = sdk.ids.space;
  const environment = sdk.ids.environment;

  const link =
    environment === 'master'
      ? `https://${sdk.hostnames.webapp}/spaces/${space}/content_types`
      : `https://${sdk.hostnames.webapp}/spaces/${space}/environments/${environment}/content_types`;

  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{'Add to sidebar views'}</Subheading>
      <Paragraph>
        {
          'Assign the app to content types and optionally add a hex code to assign a color to that content type.'
        }
      </Paragraph>
      <Box className={styles.wrapper}>
        {allContentTypes.length ? (
          <Form>
            <FormControl as="fieldset" marginBottom="none">
              <Table className={styles.table}>
                <Table.Body>
                  {allContentTypes.map((contentType) => {
                    const isChecked = Object.keys(selectedContentTypes).includes(
                      contentType.sys.id
                    );
                    return (
                      <Table.Row key={contentType.sys.id}>
                        <Table.Cell>
                          <Checkbox
                            id={contentType.sys.id}
                            isChecked={isChecked}
                            onChange={() => handleCheckboxChange(contentType, isChecked)}>
                            {contentType.name}
                          </Checkbox>
                        </Table.Cell>
                        <Table.Cell>
                          <TextInput
                            value={selectedContentTypes[contentType.sys.id] ?? ''}
                            name="hex"
                            placeholder="Enter a valid hex code"
                            isDisabled={!isChecked}
                            onChange={(e) => handleColorChange(contentType, e.target.value)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </FormControl>
          </Form>
        ) : (
          <Note variant="warning">
            <Paragraph>
              There are no content types available in this environment. You can{' '}
              <TextLink
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkIcon />}
                alignIcon="end">
                add a content type
              </TextLink>{' '}
              and then assign it to the app from this screen.
            </Paragraph>
          </Note>
        )}
      </Box>
    </Flex>
  );
};

export default AddToSidebarSection;
