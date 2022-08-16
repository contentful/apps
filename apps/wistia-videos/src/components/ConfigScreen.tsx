import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { 
  Button, 
  Heading, 
  Flex, 
  Workbench,
  Paragraph,
  TextField, 
  TextLink, 
  Notification, 
  Dropdown, 
  DropdownList, 
  DropdownListItem, 
  Pill 
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { fetchProjects } from "../functions/getVideos"

export interface AppInstallationParameters {
  apiBearerToken?: string;
  excludedProjects?: WistiaItem[];
}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

export interface WistiaItem {
  id: number;
  name: string;
  hashedId: string;
  hashed_id?: string;
  duration?: string;
  thumbnail: {
    url: string;
  }
}


const Config = (props: ConfigProps) => {
  const [requiredMessage, setRequiredMessage] = useState('');
  const [showButton, setShowButton] = useState(true);
  const [fetchedProjects, setFetchedProjects] = useState<WistiaItem[]>();
  const [parameters, setParameters] = useState<AppInstallationParameters>(
    {
      apiBearerToken: '',
      excludedProjects: []
    }
  );
  const [loading, setLoadingStatus] = useState(false);

  // Updates app configuration by calling this function as a callback in the app.sdk.onConfigure function
  const configureApp = useCallback(async () => {
    const currentState = await props.sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, props.sdk]);
  
  // Called whenever the config changes
  useEffect(() => {
    props.sdk.app.onConfigure(() => configureApp());
  }, [props.sdk, configureApp, parameters]);

  // Called whenever the parameters.apiBearerToken in the config changes
  useEffect(() => {
    if (parameters.apiBearerToken) {
      getProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters.apiBearerToken]);
  
  // Initial load for config page
  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = 
      await props.sdk.app.getParameters();
      
      // Set local parameter state based on the installation params
      if (currentParameters) {
        setParameters(currentParameters);
      } else {
        setParameters({
          apiBearerToken:'',
          excludedProjects: []
        })
      }

      props.sdk.app.setReady();
    })()
  }, [props.sdk])

  const getInputValue:() => void = async () => {
    const tokenField = document.getElementById("apiBearerTokenInput") as HTMLInputElement | null;;
    if (tokenField !== null) {
      const value = tokenField?.value;
      if (!value) {
        setRequiredMessage("Please, provide a bearer token value");
      } else {
        const newParameters:{[key:string]: any} = {
          ...parameters
        }
        newParameters["apiBearerToken"] = value;
        
        // in case the value provided is the same as the one stored, tries to fetch the projects anyway
        // and the buttons will disappear in both the scenarios (succesful or error response)
        if (newParameters["apiBearerToken"] === parameters.apiBearerToken) {
          getProjects(); 
        } else {
          setParameters(newParameters);
        }
      }
    }
  }

  const getProjects:() => void = async () => {
    setLoadingStatus(true);
    const response = await fetchProjects(parameters.apiBearerToken);
    if (response.success) {
      Notification.success("Your connection to the Wistia Data API is working.")
      // set the projects in the state (don't save all the projects in the config parameters to prevent
      // the config object to become very large and reach the size limit)
      setFetchedProjects(response.projects)
      setShowButton(false);
      setRequiredMessage('');
    } else {
      Notification.error(`Connection to Wistia Data API failed: ${response.error}`)
      console.log(`Connection to Wistia Data API failed: ${response.error}`);
      setFetchedProjects([])
      if (response?.code && response?.error) {
        setRequiredMessage(response?.error);
      }
    }
    setLoadingStatus(false)
  }

  const removeExcludedProject = (id:string) => {
    const newExcludedProjects = 
      parameters.excludedProjects ? [...parameters.excludedProjects].filter(
        item => id !== item.hashedId
      ) : []
    
    setParameters({
      ...parameters, 
      excludedProjects: newExcludedProjects
    })

    return;
  }
  
  const addExcludedProject = (item:WistiaItem) => {
    if(
      parameters.excludedProjects?.findIndex(project => project.hashedId === item.hashedId
    ) !== -1) {
      removeExcludedProject(item.hashedId);
      return;
    }
    const newExcludedProjects = 
      parameters.excludedProjects ? [...parameters.excludedProjects, item] : [item]
    
    setParameters({
      ...parameters, 
      excludedProjects: newExcludedProjects
    })

    return;
  }

  return (
    <>
      <Workbench className={css({ margin: '80px 80px 0px 80px'})}>
        <Flex flexDirection="column" fullHeight fullWidth>
          <Heading>Wistia Videos App Configuration</Heading>
          <Paragraph>
            Please provide your access bearer token for the Wistia Data API. 
          </Paragraph>
            <Flex flexDirection="column" marginTop="spacingM">
              <div style={{ marginBottom: "20px" }}>
                <TextField 
                  required 
                  validationMessage={requiredMessage || ""}
                  name="apiBearerTokenInput" 
                  id="apiBearerTokenInput" 
                  labelText="Wistia Data API access bearer token" 
                  onChange={() => setShowButton(true)} 
                  value={parameters.apiBearerToken}
                />
              </div>
              <div style={{ marginBottom: "5px" }}>
              <Paragraph>
                It's very important to provide a bearer token with "read only" permissions and the "all 
                project and video data" options enabled. The token saved in this app will be accessible 
                by the users of this Contentful space.
              </Paragraph>
              </div>
              <TextLink
                href="https://wistia.com/support/account-and-billing/setup#api-access" 
                target="_blank" 
                rel="noreferrer">
                  How to find your access bearer token
              </TextLink>
            </Flex>
            {(!fetchedProjects?.length || showButton) && (
              <Flex marginTop="spacingL">
                <Button
                  onClick={() => getInputValue()}
                  loading={loading}
                >
                  Display Wistia projects
                </Button>
              </Flex>
            )}
          <Flex 
            flexDirection="column" 
            marginTop={"spacingXl"} 
            fullHeight
          >
            {!!fetchedProjects?.length && (
              <>
                <Flex marginBottom="spacingXs">
                  <Heading element="h2">
                    Choose projects to exclude from the app.
                  </Heading>
                </Flex>
                <Flex marginBottom="spacingL">
                  <Paragraph>
                    Choose any projects that you think aren't relevant to what editors are doing in this Contentful space.
                  </Paragraph>
                </Flex>
                {!!parameters.excludedProjects?.length && (
                  <Flex marginBottom="spacingM" flexWrap="wrap" fullHeight>
                    {
                      parameters.excludedProjects.map(item => 
                        <Pill 
                          style={{width: 200, marginRight: 10, marginBottom: 10}} 
                          label={item.name} 
                          onClose={() => removeExcludedProject(item.hashedId)} 
                          key={item.id}
                        />
                      )
                    }
                  </Flex>
                )}
                {fetchedProjects.length > 0 ? (
                <Dropdown
                  isOpen
                  isFullWidth
                  isAutoalignmentEnabled={false}
                  position={"bottom-left"}
                >
                  <DropdownList className={"dropdown-list"} maxHeight={500}>
                    {fetchedProjects.map((item) => (
                      <DropdownListItem 
                        onClick={() => addExcludedProject(item)} 
                        isActive={
                          parameters.excludedProjects?.findIndex(
                            project => project.hashedId === item?.hashedId
                          ) !== -1
                        } 
                        key={`key-${item.id}`}
                      >
                        {item.name}
                      </DropdownListItem>
                    ))}
                  </DropdownList>
                </Dropdown>
                ) : null}
              </>
            )}
          </Flex>
        </Flex>
      </Workbench>
    </>
  );
}

export default Config;
