import HyperLink from "@components/common/HyperLink/HyperLink";
import { regions } from "@configs/aws/region";
import { FormControl, Select } from "@contentful/f36-components";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import { ChangeEvent, Dispatch } from "react";
import { ConfigErrors, RegionText } from "../configText";
import { ParameterAction, ParameterReducer } from "../parameterReducer";

interface Props {
  dispatch: Dispatch<ParameterReducer>;
  region: string;
}

const Region = ({ region, dispatch }: Props) => {
  const regionList = regions.map((region) => (
    <Select.Option key={region.id} value={region.id}>
      {region.name}
    </Select.Option>
  ));

  const isInvalid = !region;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: ParameterAction.UPDATE_REGION, value: e.target.value });
  };

  return (
    <FormControl isRequired isInvalid={isInvalid}>
      <FormControl.Label>{RegionText.title}</FormControl.Label>
      <Select value={region} onChange={handleChange} title="Select a region">
        {regionList}
      </Select>

      <FormControl.HelpText>
        <HyperLink
          body={RegionText.helpText}
          substring={RegionText.linkSubstring}
          hyperLinkHref={RegionText.link}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </FormControl.HelpText>
      {isInvalid && (
        <FormControl.ValidationMessage>
          {ConfigErrors.missingModel}
          {/* TODO: Configure correct error */}
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
};

export default Region;
