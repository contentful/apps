import { useEffect, useState } from 'react';
import { Card } from '@contentful/f36-components';
import { styles } from './ResourceCard.styles';
import { ExternalResource } from 'types';
import ResourceCardHeader from './ResourceCardHeader';
import ResourceCardBody from './ResourceCardBody';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';

export interface ResourceCardProps {
  resource: ExternalResource;
  cardHeader: string;
  onSelect?: (resource: ExternalResource) => void;
  selectedResources?: ExternalResource[];
  dragHandleRender?: RenderDragFn;
  isLoading: boolean;
  index: number;
  total: number;
  externalResourceLink?: string;
  showHeaderMenu: boolean;
}

const ResourceCard = (props: ResourceCardProps) => {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);

  const {
    index,
    total,
    isLoading,
    resource,
    cardHeader,
    onSelect,
    selectedResources,
    dragHandleRender,
    externalResourceLink,
    showHeaderMenu,
  } = props;

  useEffect(() => {
    if (selectedResources) {
      const isSelectedResource = selectedResources.find((item) => {
        return item.id === resource.id;
      });

      setIsSelected(!!isSelectedResource);
    }
  }, [selectedResources, resource.id]);

  return (
    <Card
      padding="none"
      className={styles.resourceCard}
      isSelected={isSelected}
      onClick={() => {
        onSelect && onSelect(resource);
      }}
      isLoading={isLoading}
      withDragHandle={!!dragHandleRender}
      dragHandleRender={dragHandleRender}>
      <ResourceCardHeader
        headerTitle={cardHeader}
        status={resource.status ?? ''}
        handleRemove={() => ''}
        index={index}
        total={total}
        showJson={showJson}
        handleShowJson={setShowJson}
        externalResourceLink={externalResourceLink ?? ''}
        handleMoveToBottom={() => ''}
        handleMoveToTop={() => ''}
        showHeaderMenu={showHeaderMenu}
      />
      <ResourceCardBody
        name={resource.name ?? ''}
        description={resource.description ?? ''}
        image={resource.image ?? ''}
        id={resource.id ?? ''}
      />
    </Card>
  );
};

export default ResourceCard;
