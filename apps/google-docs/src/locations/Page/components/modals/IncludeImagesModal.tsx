import { useState } from 'react';
import { Button, FormControl, Modal, Paragraph, Radio } from '@contentful/f36-components';

interface IncludeImagesModalProps {
  onConfirm: (includeImages: boolean) => void;
  onCancel: () => void;
}

export const IncludeImagesModal = ({ onConfirm, onCancel }: IncludeImagesModalProps) => {
  const [includeImages, setIncludeImages] = useState<boolean | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handleConfirm = () => {
    if (includeImages === null) {
      setHasAttemptedSubmit(true);
      return;
    }
    onConfirm(includeImages);
  };

  return (
    <>
      <Modal.Header title="Images" onClose={onCancel} />
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
              You must choose an option.
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Modal.Content>
      <Modal.Controls>
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="primary">
          Next
        </Button>
      </Modal.Controls>
    </>
  );
};
