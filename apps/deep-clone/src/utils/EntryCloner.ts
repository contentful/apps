import { ContentTypeProps, CreateEntryProps, EntryProps } from 'contentful-management';
import { CMAClient } from '@contentful/app-sdk';
import { AppParameters } from '@/vite-env';

type ReferenceMap = Record<string, EntryProps>;

class EntryCloner {
  private references: ReferenceMap = {};
  private referencesTree: ReferenceMap = {};
  private clones: ReferenceMap = {};
  private contentTypes: { [id: string]: ContentTypeProps } = {};
  private updates: number = 0;

  private _shouldCloneComponents: string[] = [];
  set shouldCloneComponents(components: string[]) {
    this._shouldCloneComponents = components;
  }

  get shouldCloneComponents(): string[] {
    return this._shouldCloneComponents;
  }

  constructor(
    private cma: CMAClient,
    private parameters: AppParameters,
    private entryId: string,
    private setReferencesCount: (_count: number) => void,
    private setClonesCount: (_count: number) => void,
    private setUpdatesCount: (_count: number) => void
  ) {}

  async cloneEntry(): Promise<EntryProps> {
    await this.createClones();
    await this.updateReferenceTree();
    return this.clones[this.entryId] as EntryProps;
  }

  async getReferencesQty(): Promise<number> {
    await this.findReferences(this.entryId);
    return Object.keys(this.references).length;
  }

  async getReferencesTree(): Promise<Record<string, EntryProps>> {
    await this.findReferences(this.entryId);
    this.referencesTree = this.references;
    return this.referencesTree;
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
    Object.entries(this.references)
      .filter(([entryId, _]) => !this.shouldCloneComponents.includes(entryId))
      .forEach(([entryId, entry]) => {
        this.clones[entryId] = entry;
      });

    const cloneComponents = Object.entries(this.references).filter(
      ([entryId, _]) => entryId === this.entryId || this.shouldCloneComponents.includes(entryId)
    );
    const clonePromises = cloneComponents.map(async ([entryId, entry]) => {
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

    if (this.isReferenceArray(fieldValue)) {
      await Promise.all(
        fieldValue.map((f: any) => {
          return this.inspectField(f);
        })
      );
      return;
    }

    if (this.isReference(fieldValue)) {
      await this.findReferences(fieldValue.sys.id);
    }
  }

  private async updateReferencesOnField(fieldValue: any): Promise<boolean> {
    if (!fieldValue) return false;

    if (this.isReferenceArray(fieldValue)) {
      const didUpdateArray = await Promise.all(
        fieldValue.map((f: any) => {
          return this.updateReferencesOnField(f);
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

    const titleField = contentType.fields.find((field) => field.id === contentType.displayField);

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

  private isReferenceArray(fieldValue: any): boolean {
    return Array.isArray(fieldValue) && fieldValue.some((f: any) => this.isReference(f));
  }

  private isReference(fieldValue: any): boolean {
    return fieldValue.sys && fieldValue.sys.type === 'Link' && fieldValue.sys.linkType === 'Entry';
  }
}

export default EntryCloner;
