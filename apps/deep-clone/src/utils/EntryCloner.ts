import { ContentTypeProps, CreateEntryProps, EntryProps } from 'contentful-management';
import { CMAClient } from '@contentful/app-sdk';
import { AppParameters } from '@/vite-env';

type ReferenceMap = Record<string, EntryProps>;
type EntryLink = {
  sys: {
    type: 'Link';
    linkType: 'Entry';
    id: string;
  };
};
type RichTextNode = {
  nodeType?: string;
  data?: {
    target?: {
      sys?: {
        type?: string;
        linkType?: string;
        id?: string;
      };
    };
  };
  content?: unknown[];
};

class EntryCloner {
  private references: ReferenceMap = {};
  private clones: ReferenceMap = {};
  private contentTypes: { [id: string]: ContentTypeProps } = {};
  private updates: number = 0;
  private parameters: AppParameters;
  private cma: CMAClient;
  private entryId: string;
  private setReferencesCount: (count: number) => void;
  private setClonesCount: (count: number) => void;
  private setUpdatesCount: (count: number) => void;

  constructor(
    cma: CMAClient,
    parameters: AppParameters,
    entryId: string,
    setReferencesCount: (count: number) => void,
    setClonesCount: (count: number) => void,
    setUpdatesCount: (count: number) => void
  ) {
    this.cma = cma;
    this.parameters = parameters;
    this.entryId = entryId;
    this.setReferencesCount = setReferencesCount;
    this.setClonesCount = setClonesCount;
    this.setUpdatesCount = setUpdatesCount;
  }

  async cloneEntry(): Promise<EntryProps> {
    if (Object.keys(this.references).length === 0) {
      await this.findReferences(this.entryId);
    }
    await this.createClones();
    await this.updateReferenceTree();
    return this.clones[this.entryId] as EntryProps;
  }

  async getReferencesQty(): Promise<number> {
    await this.findReferences(this.entryId);
    return Object.keys(this.references).length;
  }

  private async findReferences(entryId: string): Promise<void> {
    if (this.references[entryId]) {
      return;
    }

    let entry;
    try {
      entry = await this.cma.entry.get({ entryId: entryId });
    } catch (_error) {
      // Deleted entries are not found
    }

    if (entry !== undefined) {
      this.references[entryId] = entry;
      this.setReferencesCount(Object.keys(this.references).length);

      for (const fieldName in entry.fields) {
        const field = entry.fields[fieldName];

        for (const locale in field) {
          const fieldValue = field[locale];
          await this.inspectField(fieldValue);
        }
      }
    }
  }

  private async createClones(): Promise<void> {
    const clonePromises = Object.entries(this.references).map(async ([entryId, entry]) => {
      try {
        const entryFields = await this.getFieldsForClone(entry);
        const createProps: CreateEntryProps = {
          fields: entryFields,
          ...(entry.metadata ? { metadata: entry.metadata } : {}),
        };
        const clone = await this.cma.entry.create(
          { contentTypeId: entry.sys.contentType.sys.id },
          createProps
        );
        this.clones[entryId] = clone;
        this.setClonesCount(Object.keys(this.clones).length);
      } catch (error) {
        console.warn('Error creating clone', error);
      }
    });

    await Promise.all(clonePromises);
  }

  private async updateReferenceTree(): Promise<void> {
    const updatePromises = Object.values(this.clones).map(async (clone) => {
      let cloneWasUpdated = false;
      for (const fieldId in clone.fields) {
        const field = clone.fields[fieldId];

        for (const locale in field) {
          const fieldValue = field[locale];
          const fieldWasUpdated = await this.updateReferencesOnField(fieldValue);
          cloneWasUpdated ||= fieldWasUpdated;
        }
      }

      if (cloneWasUpdated) {
        let latestClone = clone;
        for (let retryCount = 0; retryCount < 3; retryCount++) {
          try {
            await this.cma.entry.update(
              { entryId: latestClone.sys.id },
              {
                sys: { ...latestClone.sys, version: latestClone.sys.version },
                fields: clone.fields,
              }
            );
            this.updates++;
            this.setUpdatesCount(this.updates);
            break;
          } catch (error: any) {
            if (error.code === 'VersionMismatch') {
              console.warn('Error updating clone, retrying...', error);
              latestClone = await this.cma.entry.get({ entryId: clone.sys.id });
            } else {
              console.warn('Error updating clone.', error);
              break;
            }
          }
        }
      }
    });

    await Promise.all(updatePromises);
  }

  private async inspectField(fieldValue: any): Promise<void> {
    if (!fieldValue) return;

    if (Array.isArray(fieldValue)) {
      await Promise.all(
        fieldValue.map((nestedValue) => {
          return this.inspectField(nestedValue);
        })
      );
      return;
    }

    if (this.isReference(fieldValue)) {
      await this.findReferences(fieldValue.sys.id);
      return;
    }

    if (this.isRichTextNode(fieldValue)) {
      const embeddedEntryTarget = this.getEmbeddedEntryTarget(fieldValue);
      if (embeddedEntryTarget) {
        await this.findReferences(embeddedEntryTarget.sys.id);
      }

      if (Array.isArray(fieldValue.content)) {
        await Promise.all(
          fieldValue.content.map((nestedValue) => {
            return this.inspectField(nestedValue);
          })
        );
      }
    }
  }

  private async updateReferencesOnField(fieldValue: any): Promise<boolean> {
    if (!fieldValue) return false;

    if (Array.isArray(fieldValue)) {
      const didUpdateArray = await Promise.all(
        fieldValue.map((nestedValue) => {
          return this.updateReferencesOnField(nestedValue);
        })
      );
      return didUpdateArray.some((didUpdate) => didUpdate);
    }

    if (this.isReference(fieldValue)) {
      const clone = this.clones[fieldValue.sys.id];
      if (clone !== undefined) {
        fieldValue.sys.id = clone.sys.id;
        return true;
      }
      return false;
    }

    if (this.isRichTextNode(fieldValue)) {
      let didUpdate = false;
      const embeddedEntryTarget = this.getEmbeddedEntryTarget(fieldValue);
      if (embeddedEntryTarget) {
        const clone = this.clones[embeddedEntryTarget.sys.id];
        if (clone !== undefined) {
          embeddedEntryTarget.sys.id = clone.sys.id;
          didUpdate = true;
        }
      }

      if (Array.isArray(fieldValue.content)) {
        const didUpdateChildren = await Promise.all(
          fieldValue.content.map((nestedValue) => {
            return this.updateReferencesOnField(nestedValue);
          })
        );
        didUpdate ||= didUpdateChildren.some((childDidUpdate) => childDidUpdate);
      }

      return didUpdate;
    }

    return false;
  }

  private async getFieldsForClone(entry: EntryProps): Promise<any> {
    // Create a deep copy of the entry fields to avoid modifying the original
    const entryFields = JSON.parse(JSON.stringify(entry.fields));

    const contentTypeId = entry.sys.contentType.sys.id;
    const contentType =
      this.contentTypes[contentTypeId] ||
      (await this.cma.contentType.get({ contentTypeId: contentTypeId }));
    this.contentTypes[contentTypeId] = contentType;

    const titleField = contentType.fields.find(
      (field: ContentTypeProps['fields'][number]) => field.id === contentType.displayField
    );

    // Update title field for the clone
    if (titleField && entryFields[titleField.id]) {
      const titleFieldValues = entryFields[titleField.id];
      for (const locale in titleFieldValues) {
        const title = titleFieldValues[locale];
        titleFieldValues[locale] = this.parameters.cloneTextBefore
          ? `${this.parameters.cloneText} ${title}`
          : `${title} ${this.parameters.cloneText}`;
      }
    }

    return entryFields;
  }

  private isRichTextNode(fieldValue: unknown): fieldValue is RichTextNode {
    return typeof fieldValue === 'object' && fieldValue !== null && 'nodeType' in fieldValue;
  }

  private getEmbeddedEntryTarget(node: RichTextNode): EntryLink | undefined {
    const target = node.data?.target;
    if (target && this.isReference(target)) {
      return target;
    }

    return undefined;
  }

  private isReference(fieldValue: any): fieldValue is EntryLink {
    return fieldValue.sys && fieldValue.sys.type === 'Link' && fieldValue.sys.linkType === 'Entry';
  }
}

export default EntryCloner;
