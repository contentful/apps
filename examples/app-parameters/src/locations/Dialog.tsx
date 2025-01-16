import { DialogAppSDK } from '@contentful/app-sdk';
import { Badge, Flex, MissingContent, Table, Text } from '@contentful/f36-components';
import { CheckCircleIcon } from '@contentful/f36-icons';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ContentFields, Control } from 'contentful-management';
import { getFieldAppearance, getFieldStatus, getFieldType } from '../utils';
import { styles } from './Dialog.styles';

interface DialogInvocationParameters {
  fieldDetails: string;
}

export type FieldDetails = ContentFields & Control & { isTitle: boolean };

export type getFieldStatusParams = {
  deleted?: boolean;
  disabled?: boolean;
  omitted?: boolean;
  isTitle?: boolean;
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const parameters = sdk.parameters.invocation as unknown as DialogInvocationParameters;
  const fieldDetails = JSON.parse(parameters.fieldDetails) as FieldDetails[];

  useAutoResizer();

  return (
    <div className={styles.dialog}>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Name</Table.Cell>
            <Table.Cell>Field Type</Table.Cell>
            <Table.Cell>Localization</Table.Cell>
            <Table.Cell>Validation</Table.Cell>
            <Table.Cell>Appearance</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {fieldDetails.map((field) => {
            const fieldStatus = getFieldStatus({
              deleted: field.deleted,
              disabled: field.disabled,
              omitted: field.omitted,
              isTitle: field.isTitle,
            });
            const fieldType = getFieldType(field);
            const fieldAppearance = getFieldAppearance(field);
            return (
              <Table.Row key={field.id}>
                <Table.Cell>
                  <Flex gap="spacingXs">
                    <Text fontWeight="fontWeightDemiBold" fontColor="gray900">
                      {field.name}
                    </Text>
                    {fieldStatus && <Badge variant="secondary">{fieldStatus}</Badge>}
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  {fieldType ? (
                    <Text fontColor="gray700">{fieldType}</Text>
                  ) : (
                    <MissingContent
                      label="Field type is missing"
                      className={styles.missingContent}
                    />
                  )}
                </Table.Cell>
                <Table.Cell>
                  {field.localized ? (
                    <CheckCircleIcon variant="positive" label="Localization is enabled" />
                  ) : (
                    <MissingContent
                      label="Localization is disabled"
                      className={styles.missingContent}
                    />
                  )}
                </Table.Cell>
                <Table.Cell>
                  {field.validations?.length ? (
                    <CheckCircleIcon variant="positive" label="Field has validations" />
                  ) : (
                    <MissingContent
                      label="Localization is disabled"
                      className={styles.missingContent}
                    />
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Text fontColor="gray700">{fieldAppearance}</Text>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
};

export default Dialog;
