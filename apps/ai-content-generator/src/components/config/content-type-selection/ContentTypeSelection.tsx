import { Dispatch, useState, useEffect } from 'react';
import { Checkbox, FormControl, Table } from '@contentful/f36-components';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeText } from '@components/config/configText';
import { ContentTypeAction, ContentTypeReducer } from '@components/config/contentTypeReducer';
import { styles } from './ContentTypeSelection.styles';

interface Props {
  allContentTypes: ContentTypeProps[];
  selectedContentTypes: Set<string>;
  dispatch: Dispatch<ContentTypeReducer>;
}

const ContentTypeSelection = (props: Props) => {
  const { allContentTypes, selectedContentTypes, dispatch } = props;
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  useEffect(() => {
    const areAllItemsChecked = allContentTypes.length === selectedContentTypes.size;
    setIsSelectAllChecked(areAllItemsChecked);
  }, [allContentTypes.length, selectedContentTypes.size]);

  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      dispatch({ type: ContentTypeAction.REMOVE_ALL });
    } else {
      const allContentTypeIds = allContentTypes.map((ct) => ct.sys.id);
      dispatch({ type: ContentTypeAction.ADD_ALL, value: allContentTypeIds });
    }
  };

  const handleCheckboxChange = (contentType: ContentTypeProps, isChecked: boolean) => {
    const action = isChecked ? ContentTypeAction.REMOVE : ContentTypeAction.ADD;
    dispatch({ type: action, value: contentType.sys.id });
  };

  const isChecked = (contentTypeId: string) => {
    return selectedContentTypes.has(contentTypeId);
  };

  return (
    <FormControl as="fieldset">
      <Table css={styles.table}>
        <Table.Head>
          <Table.Row>
            <Table.Cell>
              <Checkbox
                id="select-all"
                isChecked={isSelectAllChecked}
                onChange={() => handleSelectAll()}
                css={
                  styles.selectAll
                }>{`${ContentTypeText.allText} (${allContentTypes.length})`}</Checkbox>
            </Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {allContentTypes.map((contentType) => (
            <Table.Row key={contentType.sys.id}>
              <Table.Cell>
                <Checkbox
                  id={contentType.sys.id}
                  isChecked={isChecked(contentType.sys.id)}
                  onChange={() => handleCheckboxChange(contentType, isChecked(contentType.sys.id))}>
                  {contentType.name}
                </Checkbox>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </FormControl>
  );
};

export default ContentTypeSelection;
