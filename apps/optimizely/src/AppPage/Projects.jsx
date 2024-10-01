import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';

import tokens from '@contentful/f36-tokens';
import { Heading, Select, Option, FormControl } from '@contentful/f36-components';

const styles = {
  section: css({
    marginTop: tokens.spacingM,
  }),
};

export default function Projects({ allProjects, selectedProject, onProjectChange }) {
  return (
    <>
      <Heading>Optimizely Project</Heading>
      <FormControl>
        <FormControl.Label>Project</FormControl.Label>
        <Select
          name="project"
          id="project"
          isRequired={true}
          className={styles.section}
          value={selectedProject ? selectedProject.toString() : ''}
          onChange={onProjectChange}
          isDisabled={!allProjects}
          width="large">
          <Option value="">Select Optimizely Project</Option>
          {!!allProjects.length &&
            allProjects.map((p) => (
              <Option key={p.id} value={p.id.toString()}>
                {p.name}
              </Option>
            ))}
        </Select>
      </FormControl>
    </>
  );
}

Projects.defaultProps = {
  allProjects: [],
};

Projects.propTypes = {
  allProjects: PropTypes.array,
  selectedProject: PropTypes.string,
  onProjectChange: PropTypes.func.isRequired,
};
