import React from 'react';
import { Track } from '../util/types';
import { countries } from '../util/countries';

interface countryDatalistProps {
  used: Track[];
}

const CountryDatalist: React.FC<countryDatalistProps> = ({ used }) => {
  const usedCodes = used.map((track) => track.language_code);

  return (
    <datalist id="countrycodes">
      {countries.map((country) => (
        <option
          key={country.code}
          value={country.name}
          disabled={usedCodes.includes(country.code)}
        />
      ))}
    </datalist>
  );
};

export default CountryDatalist;
