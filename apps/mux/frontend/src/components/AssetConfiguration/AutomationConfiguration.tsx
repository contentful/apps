import { FC } from 'react';
import { Box, Checkbox, FormControl, List, Note, Text } from '@contentful/f36-components';
import ExternalLink from '../ExternalLink';
import DirectiveId from '../DirectiveId';
import { ROBOTS_DOCS_URL } from '../../util/robots';
import { ROBOTS_DIRECTIVES_SET_BY_ADMIN } from '../../util/robotsAccess';

/**
 * The Automation section of the upload modal: which configured Robots directives run on this
 * upload.
 *
 * Directives are chosen once in the app configuration and pre-selected here, so automation does
 * not depend on anyone remembering. Deselecting is per upload — an editor who does not want to
 * spend units on this particular file can say so before it is created, which is the only moment
 * it can be said: a directive attaches at asset creation and there is no later opt-out. Someone
 * who cannot run Robots gets the same directives as a read-only list, and they still run: an admin
 * chose them (ADR-0016).
 *
 * Names, with the id underneath. It used to render the raw id as the whole label, on the
 * reasoning that resolving names costs a Mux call not worth paying on every modal open. That
 * reasoning does not survive contact with the thing being asked: `drv_01H8X...` is not a
 * question anyone can answer, and the editor is being asked to decide whether to spend money on
 * it. The listing is one call, on a modal opened deliberately, it is not awaited, and the id is
 * what renders until it lands — so the cost is one request and the failure mode is exactly the
 * old behaviour. The id stays visible as help text because it is what the configuration screen
 * and the Mux dashboard identify a directive by.
 */

interface AutomationConfigurationProps {
  /** Directive ids from the installation parameters. */
  availableDirectiveIds: string[];
  /** Directive ids selected for this upload. */
  selectedDirectiveIds: string[];
  /** Configured ids Mux says it does not have. Shown, and not selectable. */
  missingDirectiveIds?: string[];
  /** id → name, already falling back to the id. See `useRobotsDirectiveNames`. */
  directiveNames?: Record<string, string>;
  /** Lists the directives without checkboxes, for someone who cannot run Robots. */
  isReadOnly?: boolean;
  onChange: (directiveIds: string[]) => void;
}

interface DirectiveRow {
  id: string;
  name: string;
  isMissing: boolean;
}

const DirectiveLabel: FC<{ directive: DirectiveRow }> = ({ directive }) =>
  directive.name === directive.id ? <DirectiveId id={directive.id} /> : <>{directive.name}</>;

/**
 * What goes under a directive's label, with or without a checkbox beside it. `isIndented` lines it
 * up with a checkbox's label text.
 */
const DirectiveDetails: FC<{ directive: DirectiveRow; isIndented?: boolean }> = ({
  directive,
  isIndented = false,
}) => {
  const marginLeft = isIndented ? 'spacingL' : undefined;
  return (
    <>
      {/* The Checkbox's own `helpText` is a string, which cannot wrap an id with no spaces in it;
          the same tokens and indent, by hand. Omitted when the label already is the id, so an
          unresolved directive does not render the same string twice. */}
      {directive.name !== directive.id && (
        <Text as="p" fontColor="gray500" marginLeft={marginLeft} isWordBreak>
          {directive.id}
        </Text>
      )}
      {directive.isMissing && (
        <Text as="p" fontColor="gray500" marginLeft={marginLeft}>
          Mux does not have this directive, so it will not run. It was deleted, or the app&apos;s
          configuration changed after this page loaded — reloading picks that up.
        </Text>
      )}
    </>
  );
};

const AutomationConfiguration: FC<AutomationConfigurationProps> = ({
  availableDirectiveIds,
  selectedDirectiveIds,
  missingDirectiveIds = [],
  directiveNames,
  isReadOnly = false,
  onChange,
}) => {
  if (availableDirectiveIds.length === 0) {
    return (
      <Note variant="neutral">
        No default Robots directives are configured. An admin can add them in this app&apos;s
        configuration so every new upload runs them automatically.{' '}
        <ExternalLink href={`${ROBOTS_DOCS_URL}-directives`}>About directives</ExternalLink>
      </Note>
    );
  }

  const directives: DirectiveRow[] = availableDirectiveIds.map((id) => ({
    id,
    name: directiveNames?.[id] || id,
    isMissing: missingDirectiveIds.includes(id),
  }));

  if (isReadOnly) {
    return (
      <FormControl>
        <FormControl.HelpText>{ROBOTS_DIRECTIVES_SET_BY_ADMIN}</FormControl.HelpText>
        <Box marginTop="spacingS">
          <List>
            {directives.map((directive) => (
              <List.Item key={directive.id}>
                <DirectiveLabel directive={directive} />
                <DirectiveDetails directive={directive} />
              </List.Item>
            ))}
          </List>
        </Box>
      </FormControl>
    );
  }

  const toggle = (directiveId: string, isChecked: boolean) => {
    onChange(
      isChecked
        ? [...selectedDirectiveIds, directiveId]
        : selectedDirectiveIds.filter((id) => id !== directiveId)
    );
  };

  return (
    <FormControl>
      <FormControl.HelpText>
        These Robots directives run once this video is ingested and consume Mux AI units. Uncheck
        any you do not want for this upload.
      </FormControl.HelpText>
      <Box marginTop="spacingS">
        {directives.map((directive) => (
          <Box key={directive.id} marginBottom="spacingXs">
            <Checkbox
              id={`mux-directive-${directive.id}`}
              name={`mux-directive-${directive.id}`}
              isDisabled={directive.isMissing}
              isChecked={!directive.isMissing && selectedDirectiveIds.includes(directive.id)}
              onChange={(event) =>
                toggle(directive.id, (event.target as HTMLInputElement).checked)
              }>
              <DirectiveLabel directive={directive} />
            </Checkbox>
            <DirectiveDetails directive={directive} isIndented />
          </Box>
        ))}
      </Box>
    </FormControl>
  );
};

export default AutomationConfiguration;
