import { Paragraph, Flex, Box } from '@contentful/f36-components';

import { styles } from './InfoTable.styles';

interface Props {
  headers: string[];
  rows: { example: JSX.Element; description: string }[];
}

export const InfoTable = ({ headers, rows }: Props) => {
  return (
    <Box data-testid="info-table">
      <Flex data-testid="info-table-headers" className={styles.headersWrapper}>
        {headers.map((header, index) => (
          <Paragraph key={index} className={index != 0 ? styles.headerWithBorder : styles.header}>
            {header}
          </Paragraph>
        ))}
      </Flex>
      {rows.map((row) => (
        <Flex
          key={row.description}
          data-testid="info-table-row"
          alignItems="center"
          className={styles.rowWrapper}>
          <div>{row.example}</div>
          <div className={styles.rowDescriptionWrapper}>
            <Paragraph className={styles.rowDescription}>{row.description}</Paragraph>
          </div>
        </Flex>
      ))}
    </Box>
  );
};
