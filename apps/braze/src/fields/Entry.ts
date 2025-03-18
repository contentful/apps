import { firstLetterToLowercase, SAVED_RESPONSE } from '../utils';
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
    this.contentType = firstLetterToLowercase(contentType);
    this.fields = fields;
    this.spaceId = spaceId;
    this.contentfulToken = contentfulToken;
    this.query = this.assembleQuery();
  }

  generateConnectedContentCall(locales: string[]) {
    return `{% capture body %}
    ${locales.length > 0 ? this.localizeQuery(locales) : this.query}
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

  generateLiquidTags(locales: string[]) {
    if (locales.length > 0) {
      return locales.flatMap((locales) =>
        this.fields.flatMap((field) => field.generateLiquidTag(locales))
      );
    }
    return this.fields.flatMap((field) => field.generateLiquidTag());
  }

  async getGraphQLResponse(locales: string[]) {
    const response = await fetch(
      `https://graphql.contentful.com/content/v1/spaces/${this.spaceId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.contentfulToken}`,
          'Content-Type': 'application/json',
        },
        body: locales?.length > 0 ? this.localizeQuery(locales) : this.query,
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

  private localizeQuery(locales: string[]) {
    const body = locales.map((locale) => {
      const localWithoutHypens = locale.replace('-', '');
      return `${localWithoutHypens}: ${this.contentType}(id:\\"${
        this.id
      }\\", locale:\\"${locale}\\"){${this.assembleFieldsQuery()}}`;
    });

    return `{"query":"{${body}}"}`;
  }

  private assembleFieldsQuery(): string {
    return this.fields.map((field) => field.generateQuery()).join(' ');
  }
}
