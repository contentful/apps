import { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  Modal,
  Paragraph,
  Pill,
  Multiselect,
  Radio,
} from '@contentful/f36-components';
import {
  modalControls,
  multiselect,
  multiselectOption,
  pillsContainer,
} from './SelectTabsModal.styles';
import { useMultiselectScrollReflow } from '../../../../../hooks/useMultiselectReflow';
import { TabOption } from '../../../../../utils/types';
import { truncateLabel } from '../../../../../utils/utils';

interface SelectTabsModalProps {
  onContinue: (selectedTabs: TabOption[]) => void;
  onClose: () => void;
  availableTabs: TabOption[];
  selectedTabs: TabOption[];
  setSelectedTabs: (tabs: TabOption[]) => void;
  useAllTabs: boolean | null;
  setUseAllTabs: (value: boolean | null) => void;
}

export const SelectTabsModal = ({
  onContinue,
  onClose,
  availableTabs,
  selectedTabs,
  setSelectedTabs,
  useAllTabs,
  setUseAllTabs,
}: SelectTabsModalProps) => {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const multiselectListRef = useMultiselectScrollReflow(selectedTabs);

  const isInvalidSelection = useMemo(
    () => useAllTabs === null || (!useAllTabs && selectedTabs.length === 0),
    [useAllTabs, selectedTabs]
  );
  const hasNoRadioSelected = useAllTabs === null;
  const isInvalidSelectionError = useMemo(
    () => isInvalidSelection && hasAttemptedSubmit,
    [isInvalidSelection, hasAttemptedSubmit]
  );
  const showNoRadioSelectedError = hasNoRadioSelected && hasAttemptedSubmit;

  useEffect(() => {
    setHasAttemptedSubmit(false);
  }, [availableTabs]);

  const handleSelectTab = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasAttemptedSubmit(false);

    const { checked, value } = e.target;
    if (checked) {
      const tab = availableTabs.find((t) => t.id === value);
      if (tab) setSelectedTabs([...selectedTabs, tab]);
    } else {
      setSelectedTabs(selectedTabs.filter((t) => t.id !== value));
    }
  };

  const handleContinue = () => {
    if (isInvalidSelection) {
      setHasAttemptedSubmit(true);
      return;
    }
    const tabsToUse = useAllTabs ? availableTabs : selectedTabs;
    onContinue(tabsToUse);
  };

  return (
    <>
      <Modal.Header title="Document tabs" onClose={onClose} />
      <Modal.Content>
        <Paragraph marginBottom="spacingM" color="gray700">
          The selected document contains multiple document tabs. Would you like to select which tabs
          should be used from your document? If no, all tabs will be imported.
        </Paragraph>

        <Flex flexDirection="column" gap="spacingS" marginBottom="spacingM">
          <Radio.Group
            name="tab-selection-mode"
            value={useAllTabs === null ? '' : String(useAllTabs)}
            onChange={(e) => setUseAllTabs(e.target.value === 'true')}>
            <Radio value="false">Yes, select specific tabs</Radio>
            {useAllTabs === false && (
              <Flex flexDirection="column" gap="spacingS" marginLeft="spacingL" fullWidth>
                <FormControl isRequired isInvalid={isInvalidSelectionError} marginBottom="none">
                  <FormControl.Label>Document tabs</FormControl.Label>
                  <Checkbox.Group name="document-tabs" value={selectedTabs.map((t) => t.id)}>
                    <Multiselect
                      className={multiselect}
                      currentSelection={selectedTabs.map((tab) => tab.title)}
                      placeholder={'Select one or more'}
                      popoverProps={{
                        listMaxHeight: 300,
                        listRef: multiselectListRef,
                      }}>
                      {availableTabs.map((tab) => (
                        <Multiselect.Option
                          className={multiselectOption}
                          key={tab.id}
                          value={tab.id}
                          itemId={tab.id}
                          isChecked={selectedTabs.some((selected) => selected.id === tab.id)}
                          onSelectItem={handleSelectTab}>
                          {tab.title}
                        </Multiselect.Option>
                      ))}
                    </Multiselect>
                  </Checkbox.Group>
                  {isInvalidSelectionError && (
                    <FormControl.ValidationMessage>
                      You must select at least one tab.
                    </FormControl.ValidationMessage>
                  )}
                </FormControl>
                {selectedTabs.length > 0 && (
                  <Flex flexWrap="wrap" gap="spacingXs" className={pillsContainer}>
                    {selectedTabs.map((tab) => (
                      <Pill
                        key={tab.id}
                        label={truncateLabel(tab.title)}
                        onClose={() => setSelectedTabs(selectedTabs.filter((t) => t.id !== tab.id))}
                      />
                    ))}
                  </Flex>
                )}
              </Flex>
            )}
            <Radio value="true">No, import all tabs</Radio>
          </Radio.Group>
          {showNoRadioSelectedError && (
            <FormControl.ValidationMessage>
              You must select an option.
            </FormControl.ValidationMessage>
          )}
        </Flex>
      </Modal.Content>
      <Modal.Controls className={modalControls}>
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleContinue} variant="primary">
          Next
        </Button>
      </Modal.Controls>
    </>
  );
};
