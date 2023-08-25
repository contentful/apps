import { Dispatch, useState, useMemo } from 'react';
import { FormControl, Checkbox, Table } from '@contentful/f36-components';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeText } from '../configText';
import { ContentTypeAction, ContentTypeReducer } from '../contentTypeReducer';
import { styles } from './ContentTypeSelection.styles';

interface Props {
  allContentTypes: ContentTypeProps[];
  selectedContentTypes: { [key: string]: boolean };
  dispatch: Dispatch<ContentTypeReducer>;
}

const ContentTypeSelection = (props: Props) => {
  const { allContentTypes, selectedContentTypes, dispatch } = props;
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  const formattedAllContentTypes = useMemo(() => {
    const newState: { [key: string]: boolean } = {};
    allContentTypes.forEach((contentType) => {
      newState[contentType.sys.id] = true;
    });
    return newState;
  }, [allContentTypes]);

  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      dispatch({ type: ContentTypeAction.REMOVE_ALL });
    } else {
      dispatch({ type: ContentTypeAction.ADD_ALL, value: formattedAllContentTypes });
    }

    setIsSelectAllChecked(!isSelectAllChecked);
  };

  const handleCheckboxChange = (contentType: ContentTypeProps, isChecked: boolean) => {
    const action = isChecked ? ContentTypeAction.REMOVE : ContentTypeAction.ADD;
    dispatch({ type: action, value: contentType.sys.id });
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
                  isChecked={Boolean(selectedContentTypes[contentType.sys.id])}
                  onChange={() =>
                    handleCheckboxChange(
                      contentType,
                      Boolean(selectedContentTypes[contentType.sys.id])
                    )
                  }>
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
