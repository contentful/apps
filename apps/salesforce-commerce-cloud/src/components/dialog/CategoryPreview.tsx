import React from 'react';

import { Text, Flex } from '@contentful/f36-components';

const CategoryPreview = (props: { category: any }) => {
  const { category } = props;
  const catalogInfo = category.paths.find((path: any) => category.catalogId === path.id);

  return (
    <>
      <Flex flexDirection="column" marginLeft="spacingS">
        <Text as="div">
          <Text as="span" fontWeight="fontWeightDemiBold">
            {category.name?.default}
          </Text>{' '}
          (Catalog: {catalogInfo?.name?.default || category.catalogId})
        </Text>
        {category.pageDescription?.default && (
          <Text as="div">{category.pageDescription.default}</Text>
        )}
      </Flex>
    </>
  );
};

export default CategoryPreview;
