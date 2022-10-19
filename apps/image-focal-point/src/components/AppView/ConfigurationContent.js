import React from 'react';
import { Divider } from '../Divider';
import { styles } from './styles';

import { List, ListItem, Heading, Paragraph } from '@contentful/f36-components';

export const ConfigurationContent = () => (
  <>
    <Heading marginBottom="none" className={styles.heading}>
      Getting started
    </Heading>
    <Paragraph marginBottom="none">
      Follow the next steps to create a new image entry with focal point data:
    </Paragraph>
    <List className={styles.list}>
      <ListItem>Go to the &quot;Content&quot; page</ListItem>
      <ListItem>
        Create a new entry of type &quot;Image with Focal Point&quot; (or the name you chose during
        the installation)
      </ListItem>
      <ListItem>Fill in the required fields and publish it</ListItem>
    </List>
    <Paragraph marginBottom="none" className={styles.paragraph}>
      Follow the next steps to reference the newly created image with focal point entry in another
      content type:
    </Paragraph>
    <List className={styles.list}>
      <ListItem>Go to the &quot;Content model&quot; page</ListItem>
      <ListItem>
        Edit the content type that needs to reference the image with the focal point
      </ListItem>
      <ListItem>Create a new field of type &quot;Reference&quot;</ListItem>
      <ListItem>
        Set a validation rule requiring that the content type the reference points to is of type
        &quot;Image with Focal Point&quot;
      </ListItem>
      <ListItem>
        Optionally set the appearance of the new reference field to &quot;Entry Card&quot; in its
        settings
      </ListItem>
      <ListItem>Go back to the &quot;Content&quot; page</ListItem>
      <ListItem>
        Create/edit an entry of the content type referencing the image with the focal point
      </ListItem>
      <ListItem>
        Set the reference field you added to point to the image with focal point entry
      </ListItem>
    </List>
    <Divider />
    <Heading marginBottom="none" className={styles.heading}>
      Uninstallation and cleanup
    </Heading>
    <Paragraph marginBottom="none">
      If you uninstall the Image Focal Point app you will have to manually clean up the content type
      we created for you during the installation. To do that follow the next steps:
    </Paragraph>
    <List className={styles.list}>
      <ListItem>Go to the &quot;Content&quot; page</ListItem>
      <ListItem>
        Delete any entries of type &quot;Image with Focal Point&quot; (or the name you chose during
        installation)
      </ListItem>
      <ListItem>Go to the &quot;Content model&quot; page</ListItem>
      <ListItem>
        Edit the content type the app created, select &quot;Actions&quot; from the top menu and
        &quot;Delete&quot;
      </ListItem>
    </List>
  </>
);
