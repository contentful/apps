import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';

import tokens from '@contentful/f36-tokens';
import { Heading, Select, FormControl } from '@contentful/f36-components';

const styles = {
  section: css({
    marginTop: tokens.spacingM,
  }),
};

export default function Projects({ allProjects = [], selectedProject, onProjectChange }) {
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
          <Select.Option value="">Select Optimizely Project</Select.Option>
          {!!allProjects.length &&
            allProjects.map((p) => (
              <Select.Option key={p.id} value={p.id.toString()}>
                {p.name}
              </Select.Option>
            ))}
        </Select>
      </FormControl>
    </>
  );
}

Projects.propTypes = {
  allProjects: PropTypes.array,
  selectedProject: PropTypes.string,
  onProjectChange: PropTypes.func.isRequired,
};
