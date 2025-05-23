import { removeHypens, firstLetterToLowercase, SAVED_RESPONSE, EntryStatus } from '../utils';
import { Field } from './Field';
import { FieldRegistry } from './fieldRegistry';

export class Entry {
  public id: string;
  public contentType: string;
  public title: string;
  public fields: Field[];
  private spaceId: string;
  private environment: string;
  private contentfulToken: string;
  public updatedAt: string | undefined;
  public state: EntryStatus;
  constructor(
    id: string,
    contentType: string,
    title: string = 'Untitled',
    fields: Field[],
    spaceId: string,
    environment: string,
    contentfulToken: string,
    publishedAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.contentType = firstLetterToLowercase(contentType);
    this.title = title;
    this.fields = fields;
    this.spaceId = spaceId;
    this.environment = environment;
    this.contentfulToken = contentfulToken;
    this.updatedAt = updatedAt;
    this.state = this.getEntryState(publishedAt, updatedAt);
  }

  static fromSerialized(serializedEntry: any): Entry {
    return new Entry(
      serializedEntry['id'],
      serializedEntry['contentType'],
      serializedEntry['title'],
      serializedEntry['fields'].map((field: any) => FieldRegistry.deserializeField(field)),
      serializedEntry['spaceId'],
      serializedEntry['environment'],
      serializedEntry['contentfulToken'],
      serializedEntry['updatedAt'],
      serializedEntry['state']
    );
  }

  serialize() {
    return {
      id: this.id,
      contentType: this.contentType,
      title: this.title,
      fields: this.fields.map((field) => field.serialize()),
      spaceId: this.spaceId,
      environment: this.environment,
      contentfulToken: this.contentfulToken,
      updatedAt: this.updatedAt,
      state: this.state,
    };
  }

  generateConnectedContentCall(locales: string[]) {
    return `{% capture body %}
  ${this.assembleQuery(locales)}
{% endcapture %}
  
{% connected_content
  https://graphql.contentful.com/content/v1/spaces/${this.spaceId}/environments/${this.environment}
  :method post
  :headers {"Authorization": "Bearer ${this.contentfulToken}"}
  :body {{body}}
  :content_type application/json
  :save ${SAVED_RESPONSE}
  :retry
%}

{% if response.__http_status_code__ != 200 %}
  {% abort_message('Could not connect to Contentful') %}
{% endif %}`;
  }

  generateLiquidTags(locales: string[]) {
    return locales.length > 0 ? this.localizedLiquidTags(locales) : this.liquidTags();
  }

  async getGraphQLResponse(locales: string[]) {
    const response = await fetch(
      `https://graphql.contentful.com/content/v1/spaces/${this.spaceId}/environments/${this.environment}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.contentfulToken}`,
          'Content-Type': 'application/json',
        },
        body: this.assembleQuery(locales),
      }
    );
    return response.json();
  }

  anyFieldIsLocalized() {
    return this.fields.some((field) => field.localized);
  }

  getAllFields(): Field[] {
    return this.fields.flatMap((field) => {
      return [field, ...field.getChildren()];
    });
  }

  assembleQuery(locales: string[]) {
    const body = locales.length > 0 ? this.localizedQueryBody(locales) : this.queryBody();

    return `{"query":"{${body}}"}`;
  }

  private queryBody() {
    return `${this.contentType}(id:\\"${this.id}\\"){${this.assembleFieldsQuery()}}`;
  }

  private localizedQueryBody(locales: string[]) {
    return locales.map(
      (locale) =>
        `${removeHypens(locale)}: ${this.contentType}(id:\\"${
          this.id
        }\\", locale:\\"${locale}\\"){${this.assembleFieldsQuery()}}`
    );
  }

  private assembleFieldsQuery(): string {
    return this.selectedFields()
      .map((field) => field.generateQuery())
      .join(' ');
  }

  private liquidTags() {
    return this.selectedFields().flatMap((field) => field.generateLiquidTag());
  }

  private localizedLiquidTags(locales: string[]) {
    return locales.flatMap((locale) =>
      this.selectedFields().flatMap((field) => field.generateLiquidTag(locale))
    );
  }

  private selectedFields() {
    return this.fields.filter((field) => field.selected);
  }

  private getEntryState = (publishedAt: string | undefined, updatedAt: string | undefined) => {
    if (!publishedAt) {
      return EntryStatus.Draft;
    }

    if (publishedAt !== updatedAt) {
      return EntryStatus.Changed;
    }

    return EntryStatus.Published;
  };
}
