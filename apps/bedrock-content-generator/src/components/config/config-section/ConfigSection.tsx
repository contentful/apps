import { Box, Flex, Form, Subheading } from "@contentful/f36-components";
import { Dispatch } from "react";
import AccessKey from "../access-key/AccessKey";
import { Sections } from "../configText";
import Model from "../model/Model";
import { ParameterReducer } from "../parameterReducer";
import Region from "../region/Region";

interface Props {
  accessKeyID: string;
  secretAccessKey: string;
  isAccessKeyValid: boolean;
  region: string;
  model: string;
  modelValid: boolean;
  dispatch: Dispatch<ParameterReducer>;
}

const ConfigSection = ({
  accessKeyID,
  secretAccessKey,
  model,
  modelValid,
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
            region={region}
            isInvalid={!isAccessKeyValid}
            dispatch={dispatch}
          />

          <Model
            model={model}
            modelValid={modelValid}
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
