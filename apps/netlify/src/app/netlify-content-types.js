import React from 'react';
import PropTypes from 'prop-types';

import {
  Note,
  TextLink,
  Heading,
  Paragraph,
  Checkbox,
} from '@contentful/f36-components';

export default class NetlifyContentTypes extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool.isRequired,
    space: PropTypes.string.isRequired,
    environment: PropTypes.string.isRequired,
    contentTypes: PropTypes.array.isRequired,
    enabledContentTypes: PropTypes.array.isRequired,
    onEnabledContentTypesChange: PropTypes.func.isRequired,
  };

  onToggleSelect = () => {
    const { contentTypes, enabledContentTypes } = this.props;
    const allSelected = contentTypes.length === enabledContentTypes.length;
    if (allSelected) {
      this.props.onEnabledContentTypesChange([]);
    } else {
      this.props.onEnabledContentTypesChange(contentTypes.map(([id]) => id));
    }
  };

  onChange = (checked, id) => {
    const enabled = this.props.enabledContentTypes;
    this.props.onEnabledContentTypesChange(
      checked ? enabled.concat([id]) : enabled.filter((cur) => cur !== id)
    );
  };

  render() {
    const { disabled, contentTypes, enabledContentTypes, space, environment } = this.props;

    const allSelected = contentTypes.length === enabledContentTypes.length;

    let contentToRender;
    if (contentTypes.length === 0) {
      contentToRender = (
        <Note variant="warning">
          There are <strong>no content types</strong> in this environment. You can add a{' '}
          <TextLink
            variant="primary"
            target="_blank"
            rel="noopener noreferrer"
            href={
              environment === 'master'
                ? `https://app.contentful.com/spaces/${space}/content_types`
                : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
            }
          >
            content type
          </TextLink>{' '}
          and assign it to the app from this screen.
        </Note>
      );
    } else {
      contentToRender = (
        <div>
          <Checkbox.Group>
            <Checkbox
              id="selectAll"
              disabled={disabled}
              onChange={this.onToggleSelect}
              checked={allSelected}
            >
              Select all
            </Checkbox>
            {contentTypes.map(([id, name]) => (
              <Checkbox
                key={id}
                id={`ct-box-${id}`}
                onChange={(e) => this.onChange(e.target.checked, id)}
                disabled={disabled}
                checked={enabledContentTypes.includes(id)}
              >
                {name}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
      );
    }

    return (
      <>
        <Heading>Assign to sidebars</Heading>
        <Paragraph>
          Select which content types will show the Netlify functionality in the sidebar.
        </Paragraph>
        {contentToRender}
      </>
    );
  }
}
