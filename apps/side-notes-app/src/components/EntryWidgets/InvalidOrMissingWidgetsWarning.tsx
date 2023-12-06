import { Note, TextLink } from '@contentful/f36-components';

interface Props {
  openAppConfig?: () => void;
  location: 'sidebar' | 'field';
}

export function InvalidOrMissingWidgetsWarning({ openAppConfig, location }: Props) {
  return (
    <Note variant="warning" title="Invalid or missing widgets configuration">
      Could not find a valid widgets configuration
      {location === 'field' && ' — rendering the built-in editor instead'}.
      {openAppConfig && (
        <>
          <br />
          Visit the{' '}
          <TextLink as="button" onClick={() => openAppConfig()}>
            config screen
          </TextLink>{' '}
          to configure the widget for this location or change the appearance of this field to a
          built-in editor.
        </>
      )}
    </Note>
  );
}
