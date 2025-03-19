import { firstLetterToLowercase, SAVED_RESPONSE } from '../utils';
import { Field } from './Field';

export class Entry {
  public id: string;
  public contentType: string;
  public fields: Field[];
  private spaceId: string;
  private contentfulToken: string;
  constructor(
    id: string,
    contentType: string,
    fields: Field[],
    spaceId: string,
    contentfulToken: string
  ) {
    this.id = id;
    this.contentType = firstLetterToLowercase(contentType);
    this.fields = fields;
    this.spaceId = spaceId;
    this.contentfulToken = contentfulToken;
  }

  generateConnectedContentCall() {
    return `{% capture body %}
    ${this.assembleQuery()}
  {% endcapture %}
  
  {% connected_content
      https://graphql.contentful.com/content/v1/spaces/${this.spaceId}
      :method post
      :headers {"Authorization": "Bearer ${this.contentfulToken}"}
      :body {{body}}
      :content_type application/json
      :save ${SAVED_RESPONSE}
  %}`;
  }

  generateLiquidTags() {
    return this.fields.flatMap((field) => field.generateLiquidTag());
  }

  async getGraphQLResponse() {
    const response = await fetch(
      `https://graphql.contentful.com/content/v1/spaces/${this.spaceId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.contentfulToken}`,
          'Content-Type': 'application/json',
        },
        body: this.assembleQuery(),
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

  private assembleQuery() {
    return `{"query":"{${this.contentType}(id:\\"${this.id}\\"){${this.assembleFieldsQuery()}}}"}`;
  }

  private assembleFieldsQuery(): string {
    return this.fields
      .filter((field) => field.selected)
      .map((field) => field.generateQuery())
      .join(' ');
  }
}
