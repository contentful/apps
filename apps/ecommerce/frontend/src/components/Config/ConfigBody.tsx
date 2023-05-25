import {
  Box,
  Button,
  Heading,
  Paragraph,
  Form,
  FormControl,
  Flex,
  TextInput,
  Subheading,
  Skeleton,
} from '@contentful/f36-components';
import { ParameterDefinition, ProviderConfig } from 'types';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { styles } from './ConfigPage.styles';
import ErrorDisplay from './ErrorDisplay';

interface Props {
  baseUrl: string;
  error: Error | undefined;
  isLoading: boolean;
  onCredentialCheck: (baseUrl: string) => void;
  onParameterChange: (key: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  parameters: KeyValueMap;
  providerConfig: ProviderConfig;
}

const ConfigBody = (props: Props) => {
  const {
    baseUrl,
    error,
    onCredentialCheck,
    isLoading,
    onParameterChange,
    parameters,
    providerConfig,
  } = props;

  const configBodyComponent = () => {
    if (isLoading) {
      return (
        <Skeleton.Container ariaLabel="Loading app config">
          <Skeleton.BodyText numberOfLines={5} offsetTop={20} />
        </Skeleton.Container>
      );
    }

    if (error) return <ErrorDisplay error={error} />;
    else {
      return (
        <>
          <Heading>Authorize {providerConfig.name}</Heading>
          <Paragraph>{providerConfig.description}</Paragraph>
          <hr className={styles.splitter} />
          <Subheading>Configuration</Subheading>
          <Form>
            {providerConfig.parameterDefinitions &&
              providerConfig.parameterDefinitions.map((def: ParameterDefinition) => {
                const key = `config-input-${def.id}`;

                return (
                  <FormControl key={key} id={key}>
                    <FormControl.Label>{def.name}</FormControl.Label>
                    <TextInput
                      name={key}
                      width={def.type === 'Symbol' ? 'large' : 'medium'}
                      type={def.type === 'Symbol' ? 'text' : 'number'}
                      maxLength={255}
                      isRequired={def.required}
                      placeholder={def.placeholder}
                      value={parameters?.[def.id] ?? ''}
                      onChange={onParameterChange.bind(this, def.id)}
                    />
                    <Flex justifyContent="space-between">
                      <FormControl.HelpText>{def.description}</FormControl.HelpText>
                      <FormControl.Counter />
                    </Flex>
                  </FormControl>
                );
              })}
          </Form>
          {Object.keys(parameters).length ? (
            <Button onClick={() => onCredentialCheck(baseUrl)}>Check Credentials</Button>
          ) : null}
        </>
      );
    }
  };

  return <Box className={styles.body}>{configBodyComponent()}</Box>;
};

export default ConfigBody;
