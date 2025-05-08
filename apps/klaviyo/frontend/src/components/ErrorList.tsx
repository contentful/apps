import React from 'react';
import { Note, Text, Stack } from '@contentful/f36-components';

interface ErrorListProps {
  errors: string[];
}

export const ErrorList: React.FC<ErrorListProps> = ({ errors }) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <Note variant="negative">
      <Stack spacing="spacingXs">
        {errors.length === 1 ? (
          <Text fontWeight="fontWeightMedium">{errors[0]}</Text>
        ) : (
          <>
            <Text fontWeight="fontWeightDemiBold">Errors:</Text>
            {errors.map((error, index) => (
              <Text key={index}>
                {index + 1}. {error}
              </Text>
            ))}
          </>
        )}
      </Stack>
    </Note>
  );
};
