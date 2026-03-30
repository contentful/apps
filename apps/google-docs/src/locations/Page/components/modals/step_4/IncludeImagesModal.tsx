import { useState } from 'react';
import { Button, FormControl, Modal, Paragraph, Radio } from '@contentful/f36-components';

interface IncludeImagesModalProps {
  includeImages: boolean | null;
  setIncludeImages: (includeImages: boolean) => void;
  onContinue: (includeImages: boolean) => void;
  onClose: () => void;
}

export const IncludeImagesModal = ({
  includeImages,
  setIncludeImages,
  onContinue,
  onClose,
}: IncludeImagesModalProps) => {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handleContinue = () => {
    if (includeImages === null) {
      setHasAttemptedSubmit(true);
      return;
    }
    onContinue(includeImages);
  };

  return (
    <>
      <Modal.Header title="Images" onClose={onClose} />
      <Modal.Content>
        <Paragraph>
          The selected document contains images. Should the images be imported from your document?
        </Paragraph>
        <FormControl
          as="fieldset"
          isRequired
          isInvalid={hasAttemptedSubmit && includeImages === null}>
          <Radio.Group
            name="include-images"
            value={includeImages === null ? '' : String(includeImages)}
            onChange={(event) => setIncludeImages(event.target.value === 'true')}>
            <Radio value="true">Yes, include images</Radio>
            <Radio value="false">No, do not include images</Radio>
          </Radio.Group>
          {hasAttemptedSubmit && includeImages === null && (
            <FormControl.ValidationMessage>
              You must select an option.
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Modal.Content>
      <Modal.Controls>
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
