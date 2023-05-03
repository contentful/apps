import { Router } from 'express';
import { ApiController, ShopifyController } from '../controllers';
const app = Router();

app.get('/ping', ApiController.ping);
app.post('/resource/:resourceType/:id', ApiController.resource);

export default app;

/**
 * shopifyController
 * shopifyRouter
 * 
 * http call to internal provider to mock out a real-world model for the provider 
 * 
 * fetch() is not in node ig
 * 
 * axios() may be the way to go
 * 
 * two parameters are needed for the provider: URN and provider (shopify, sap etc)
 * 
 * make into a post() so we can pass body params with URN and provider
 * 
 * app.post(/provider/product, {
 *  urn: 'some-urn-id',
 *  provider: 'someProviderName'
 * }: ResourceLink);
 * 
 * /**
 * Resource link = raw field value JSON, basically the base product data (more for developers)
 * 
 * Hydrated Resource Data = "nice" data that will be shown in the card (more for content editors)
 * 
 * env var BASE_URL = 'localhost' | 'ecommerce-test.ctfapps.net' 
 * 
 * last step: add env var to serverless.yml (look to signingSecrets as an example)


{
    "sys": {
        "urn": "gid://products/8191006998814",
            "type": "ResourceLink",
                "linkType": "Ecommerce::Product",
                    "provider": "Shopify"
    }
},

{
    "sys": {
        "urn": "https://api.sap.com/foo/bar/1230978098sadlkja;lsdjk",
            "type": "ResourceLink",
                "linkType": "Ecommerce::Product",
                    "provider": "SAP"
    }
}, */
