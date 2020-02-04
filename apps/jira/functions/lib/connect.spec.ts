import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'

import { handleConnectLambdaEvent } from './connect'

chai.use(sinonChai)
const expect = chai.expect
const mockBaseUrl = 'http://my.test.domain'

describe('/connect.json resource', () => {
  beforeEach(() => {
    process.env.BASE_URL = mockBaseUrl
  })

  it('should return a connect.json with a valid base url', async () => {
    const result = await handleConnectLambdaEvent()

    expect(result.statusCode).to.eql(200)
    expect(result.body.baseUrl).to.eql(mockBaseUrl)
  })
})
