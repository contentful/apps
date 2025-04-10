import { removeHypens, firstLetterToLowercase, SAVED_RESPONSE } from '../utils';
import { Field } from './Field';

export class Entry {
  public id: string;
  public contentType: string;
  public title: string;
  public fields: Field[];
  private spaceId: string;
  private environment: string;
  private contentfulToken: string;
  constructor(
    id: string,
    contentType: string,
    title: string,
    fields: Field[],
    spaceId: string,
    environment: string,
    contentfulToken: string
  ) {
    this.id = id;
    this.contentType = firstLetterToLowercase(contentType);
    this.title = title;
    this.fields = fields;
    this.spaceId = spaceId;
    this.environment = environment;
    this.contentfulToken = contentfulToken;
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
      return field.getAllFields();
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
}
