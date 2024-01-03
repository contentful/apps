import { Dispatch } from "react";
import { Box, Flex, Form, Subheading } from "@contentful/f36-components";
import Model from "../model/Model";
import { Sections } from "../configText";
import { ParameterReducer } from "../parameterReducer";
import AccessKey from "../access-key/AccessKey";
import Region from "../region/Region";

interface Props {
  accessKeyID: string;
  secretAccessKey: string;
  isAccessKeyValid: boolean;
  region: string;
  model: string;
  dispatch: Dispatch<ParameterReducer>;
}

const ConfigSection = ({
  accessKeyID,
  secretAccessKey,
  model,
  dispatch,
  isAccessKeyValid,
  region,
}: Props) => {
  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.configHeading}</Subheading>
      <Box>
        <Form>
          <Region dispatch={dispatch} region={region} />

          <AccessKey
            accessKeyID={accessKeyID}
            secretAccessKey={secretAccessKey}
            isInvalid={!isAccessKeyValid}
            dispatch={dispatch}
          />

          <Model
            model={model}
            dispatch={dispatch}
            credentials={{ accessKeyID, secretAccessKey }}
            region={region}
            credentialsValid={isAccessKeyValid}
          />
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigSection;
