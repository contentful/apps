import { SAVED_RESPONSE } from '../utils';
import { Field } from './Field';

export class Entry {
  public id: string;
  public contentType: string;
  public fields: Field[];
  private spaceId: string;
  private contentfulToken: string;
  private query: string;
  constructor(
    id: string,
    contentType: string,
    fields: Field[],
    spaceId: string,
    contentfulToken: string
  ) {
    this.id = id;
    this.contentType = contentType;
    this.fields = fields;
    this.spaceId = spaceId;
    this.contentfulToken = contentfulToken;
    this.query = this.assembleQuery();
  }

  generateConnectedContentCall() {
    return `{% capture body %}
    ${this.query}
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
        body: this.query,
      }
    );
    return response.json();
  }

  anyFieldIsLocalized() {
    return this.fields.some((field) => field.localized);
  }

  private assembleQuery() {
    return `{"query":"{${this.contentType}(id:\\"${this.id}\\"){${this.assembleFieldsQuery()}}}"}`;
  }

  private assembleFieldsQuery(): string {
    return this.fields.map((field) => field.generateQuery()).join(' ');
  }
}
