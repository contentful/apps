import React, { useState } from 'react';
import { Form, FormControl, Checkbox, TextInput } from '@contentful/f36-forms';
import { Button, Heading } from '@contentful/f36-components';
import CountryDatalist from '../countryDatalist';
import TrackList from '../TrackList/TrackList';
import { countries } from '../../util/countries';
import { Track } from '../../util/types';

interface TrackFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeleteTrack: (e: React.MouseEvent<HTMLButtonElement>) => void;
  tracks: Track[];
  type: 'caption' | 'audio';
  title: string;
  playbackId?: string;
  domain?: string;
}

const TrackForm: React.FC<TrackFormProps> = ({
  onSubmit,
  onDeleteTrack,
  tracks,
  type,
  title,
  playbackId,
  domain,
}) => {
  const [languageCode, setLanguageCode] = useState('');

  const clearForm = (form: HTMLFormElement) => {
    const urlInput = form.elements.namedItem('url') as HTMLInputElement;
    const nameInput = form.elements.namedItem('name') as HTMLInputElement;
    const languageCodeInput = form.elements.namedItem('languagecode') as HTMLInputElement;

    urlInput.value = '';
    nameInput.value = '';
    languageCodeInput.value = '';
    setLanguageCode('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    onSubmit(e);
    clearForm(e.target as HTMLFormElement);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedCountry = countries.find((country) => country.name === e.target.value);
    if (selectedCountry) {
      setLanguageCode(selectedCountry.code);
    }
  };

  return (
    <>
      <TrackList
        tracks={tracks}
        onDeleteTrack={onDeleteTrack}
        type={type}
        playbackId={playbackId}
        domain={domain}
      />
      <Form onSubmit={handleSubmit}>
        <Heading as="h3">{title}</Heading>
        <FormControl isRequired>
          <FormControl.Label>File URL</FormControl.Label>
          <TextInput type="url" name="url" />
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label>Audio Name</FormControl.Label>
          <TextInput type="text" name="name" list="countrycodes" onChange={handleNameChange} />
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label>Language Code</FormControl.Label>
          <TextInput
            type="text"
            name="languagecode"
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
          />
          <CountryDatalist used={tracks} />
        </FormControl>
        {type === 'caption' && (
          <FormControl>
            <Checkbox name="closedcaptions">Closed Captions</Checkbox>
          </FormControl>
        )}
        <Button variant="secondary" type="submit">
          Submit
        </Button>
      </Form>
    </>
  );
};

export default TrackForm;
