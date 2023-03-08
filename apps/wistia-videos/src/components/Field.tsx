import React, { useState, useEffect } from 'react';
import {
  Grid,
  GridItem,
  Flex,
  Paragraph,
  Pill,
  TextInput,
  Spinner,
  Card,
  Button,
} from '@contentful/forma-36-react-components';
import styled from 'styled-components';
// import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { WistiaItem } from './ConfigScreen';
import { fetchProjects, fetchVideos } from '../functions/getVideos';
import { Project, WistiaError } from '../components/helpers/types';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const StyledImageContainer = styled.div`
  img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    object-position: top;
    border-radius: 6px;
  }
`;

const Field = (props: FieldProps) => {
  const { sdk } = props;
  const [data, updateData] = useState<WistiaItem[] | []>([]);
  const [selectedIds, setIds] = useState<number[]>([]);
  const [dropdownData, filterDropdownData] = useState<WistiaItem[] | []>([]);
  const [loading, updateLoadingStatus] = useState(true);
  const [error, setError] = useState(null || '');
  sdk.window.startAutoResizer();

  // Set inital state based on field values
  useEffect(() => {
    const fetchPagedVideos = async () => {
      const page = 1;
      try {
        const projectIds = await getProjectIds(
          parameters.excludedProjects,
          parameters.apiBearerToken
        );
        const videos = await fetchVideos(projectIds, parameters.apiBearerToken);
        if (videos.length) {
          updateData(videos || []);
          filterDropdownData(videos || []);
          updateLoadingStatus(false);
        } else {
          setError('There are no videos in your Wistia space');
        }
      } catch (error) {
        console.log(error);
        debugger;
        if (error instanceof WistiaError) {
          setError(error.message);
        }
        updateLoadingStatus(false);
      }
    };

    const fieldValues = sdk.field.getValue();
    setIds(
      fieldValues !== undefined && fieldValues.items.length > 0
        ? fieldValues.items.map((item: WistiaItem) => item.id)
        : []
    );

    const parameters: any = sdk.parameters.installation;

    fetchPagedVideos();
  }, [sdk.field, sdk.parameters.installation]);

  // Function to update selected video ids
  const updateVideoIds = (id: any) => {
    const updatedIds =
      selectedIds.findIndex((selectedId) => selectedId === id) === -1
        ? [...selectedIds, id]
        : [...selectedIds.filter((selectedId) => selectedId !== id)];

    setIds(updatedIds);
    setNewValues(updatedIds);
  };

  const getProjectIds = async (
    excludedProjects: Project[],
    bearerToken: string
  ): Promise<string[]> => {
    const projectsResponse = await fetchProjects(bearerToken);
    let projectIds = [];
    if (projectsResponse) {
      console.info('Succesfully fetched the Wistia projects.');
      const { projects } = projectsResponse;
      // Map through projects and return ids to retrieve all the videos from each project. Filter out the projects selected to be excluded
      projectIds = projects
        .map((item: Project) => item.hashedId)
        .filter((id: string) => {
          const include =
            excludedProjects.findIndex((project: Project) => project.hashedId === id) === -1;
          return include;
        });
    } else {
      console.info(`Impossible to fetch the projects: ${projectsResponse}`);
    }
    return projectIds; // need to figure out error handling
  };

  const getVideos = async (excludedProjects: Project[], bearerToken: string, page?: number) => {
    const videos = await fetchVideos([], bearerToken, page);
  };

  // set field value with updated state
  const setNewValues = (updatedIds: number[]) => {
    sdk.field.setValue({
      items: data
        .filter((item) => updatedIds.findIndex((updatedId) => item.id === updatedId) !== -1)
        .map((item) => {
          const values = {
            hashed_id: item.hashed_id,
            id: item.id,
            duration: item.duration,
            thumbnail: item.thumbnail,
          };
          return values;
        }),
    });
  };

  const getDropdownData = (searchTerm: string) => {
    const newDropdownData = [...data].filter((item: WistiaItem) =>
      item.name.toLowerCase().includes(searchTerm.toLocaleLowerCase())
    );
    return newDropdownData;
  };

  return (
    <>
      {loading ? (
        <Paragraph>
          Loading Wistia videos <Spinner color="primary" />
        </Paragraph>
      ) : (
        <>
          {data?.length > 0 && !error ? (
            <Flex flexDirection={'column'} fullHeight={true}>
              <Flex marginBottom={'spacingS'}>
                <TextInput
                  onChange={(event) => filterDropdownData(getDropdownData(event.target.value))}
                  placeholder="Search for a video"
                />
              </Flex>
              <Flex style={{ width: '100%', height: '380px', overflow: 'scroll' }}>
                <Grid columns={3} columnGap={'spacingS'} rowGap={'spacingS'}>
                  {[...dropdownData].map((item) => (
                    <GridItem key={item.id}>
                      <Card
                        onClick={() => updateVideoIds(item.id)}
                        style={{ height: '100px', padding: '7px' }}
                        selected={selectedIds.findIndex((id) => item.id === id) !== -1}>
                        <StyledImageContainer>
                          <img src={item.thumbnail.url} alt={item.name} />
                        </StyledImageContainer>
                      </Card>
                      <Paragraph>{item.name}</Paragraph>
                    </GridItem>
                  ))}
                </Grid>
              </Flex>
              <Flex>
                <Button>Load More Videos</Button>
              </Flex>

              {sdk.field.getValue() && sdk.field.getValue().items.length > 0 && (
                <Flex flexDirection={'column'} marginTop={'spacingL'}>
                  <Paragraph style={{ marginBottom: 10 }}>Selected Videos</Paragraph>
                  <Flex flexWrap={'wrap'}>
                    {sdk.field.getValue().items.map((item: WistiaItem) => {
                      const fullItem = data.find((i) => item.id === i.id);
                      return (
                        <Pill
                          style={{ width: 300, marginRight: 10, marginBottom: 10 }}
                          label={fullItem?.name || 'Could not find video title'}
                          onClose={() => updateVideoIds(item.id)}
                          key={item.id}
                        />
                      );
                    })}
                  </Flex>
                </Flex>
              )}
            </Flex>
          ) : (
            <Paragraph>Connection to Wistia Data API failed: {error}</Paragraph>
          )}
        </>
      )}
    </>
  );
};

export default Field;
