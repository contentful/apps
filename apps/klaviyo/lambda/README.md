# Klaviyo Lambda Function

Serverless function for handling Klaviyo API integration.

## Authentication

This lambda uses OAuth client credentials flow for authentication. You must provide:

* `clientId` - Your Klaviyo client ID
* `clientSecret` - Your Klaviyo client secret

These credentials should be passed in the request body.

## API Reference

### Track Event

Sends an event to Klaviyo.

```json
{
  "action": "track",
  "clientId": "your-klaviyo-client-id",
  "clientSecret": "your-klaviyo-client-secret",
  "data": {
    "event": "Made Purchase",
    "customerProperties": {
      "$email": "customer@example.com",
      "$first_name": "John",
      "$last_name": "Doe"
    },
    "properties": {
      "OrderId": "12345",
      "Total": 99.99
    }
  }
}
```

### Identify Profile

Identifies a profile in Klaviyo.

```json
{
  "action": "identify",
  "clientId": "your-klaviyo-client-id",
  "clientSecret": "your-klaviyo-client-secret",
  "data": {
    "properties": {
      "$email": "customer@example.com",
      "$first_name": "John",
      "$last_name": "Doe",
      "$phone_number": "+1234567890"
    }
  }
}
```

## Deployment

This function is designed to be deployed to AWS Lambda. 