import { ChangeEvent } from 'react';
import {
  Box,
  FormControl,
  Heading,
  Paragraph,
  Subheading,
  TextInput,
} from '@contentful/f36-components';
import { headerSection, accessSection } from '@constants/configCopy';
import { styles } from './AccessSection.styles';

interface Props {
  tenantId: string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const AccessSection = (props: Props) => {
  const { tenantId, handleChange } = props;

  return (
    <Box className={styles.box}>
      <Heading>{headerSection.title}</Heading>
      <Paragraph>{headerSection.description}</Paragraph>
      <hr className={styles.splitter} />
      <Subheading>{accessSection.title}</Subheading>
      <FormControl data-test-id="tenant-id-section">
        <FormControl.Label>{accessSection.fieldName}</FormControl.Label>
        <TextInput value={tenantId} type="text" name="tenantId" onChange={handleChange} />
      </FormControl>
    </Box>
  );
};

export default AccessSection;
