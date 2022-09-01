import * as React from 'react';
import { countries } from '../util/countries';
import { type Captions } from '../util/types';

interface countryDatalistProps {
  used: Array<Captions> | undefined;
}

class CountryDatalist extends React.Component<countryDatalistProps, {}> {
  render() {
    return (
      <datalist id="countrycodes">
        {countries.map((country) => {
          if (!this.props.used?.find((elm) => elm.language_code === country.code)) {
            return <option key={country.code} value={country.name} label={country.name} />;
          } else {
            return false;
          }
        })}
      </datalist>
    );
  }
}

export default CountryDatalist;
