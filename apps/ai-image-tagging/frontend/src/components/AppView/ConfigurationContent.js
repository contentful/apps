import React from 'react';
import { List, ListItem, Heading, Paragraph } from '@contentful/forma-36-react-components';
import { Divider } from '../Divider';
import { styles } from './styles';

export const ConfigurationContent = () => (
  <>
    <Heading className={styles.heading}>Getting started</Heading>
    <Paragraph>Follow the next steps to create a new image entry with AI generated tags:</Paragraph>
    <List className={styles.list}>
      <ListItem>Go to the &quot;Content&quot; page</ListItem>
      <ListItem>
        Create a new entry of type &quot;AI Image Tagging&quot; (or the name you chose during the
        installation)
      </ListItem>
      <ListItem>Fill in the required fields and publish</ListItem>
    </List>
    <Paragraph className={styles.paragraph}>
      Follow the next steps to reference the newly created image with AI Image Tagging in another
      content type:
    </Paragraph>
    <List className={styles.list}>
      <ListItem>Go to the &quot;content model&quot; page</ListItem>
      <ListItem>Edit the content type that needs to reference the image with the AI tags</ListItem>
      <ListItem>Create a new field of type &quot;reference&quot;</ListItem>
      <ListItem>
        Set a validation rule requiring that the content type the reference points to is of type
        &quot;AI Image Tagging&quot;
      </ListItem>
      <ListItem>
        Optionally set the appearance of the new reference field to &quot;entry card&quot; in its
        settings
      </ListItem>
      <ListItem>Go back to the &quot;content&quot; page</ListItem>
      <ListItem>
        Create/edit an entry of the content type referencing the image with the AI tags
      </ListItem>
      <ListItem>
        Set the reference field you added to point to the image with AI tags entry
      </ListItem>
    </List>
    <Divider />
    <Heading className={styles.heading}>Uninstallation and cleanup</Heading>
    <Paragraph>
      If you uninstall the AI Image Tagging app you will have to manually clean up the content type
      we created for you during the installation. To do that follow the next steps:
    </Paragraph>
    <List className={styles.list}>
      <ListItem>Go to the &quot;content&quot; page</ListItem>
      <ListItem>
        Delete any entries of type &quot;AI Image Tagging&quot; (or the name you chose during
        installation)
      </ListItem>
      <ListItem>Go to the &quot;content model&quot; page</ListItem>
      <ListItem>
        Edit the content type the app created, select &quot;actions&quot; from the top menu and
        &quot;delete&quot;
      </ListItem>
    </List>
  </>
);
