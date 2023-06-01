#!/bin/sh

RELEASE=$(git rev-parse --short HEAD)
ENDPOINT_URL=https://d2yxs6lnwogcmh.cloudfront.net/$RELEASE/
aws apigateway update-integration --rest-api-id pqgnkbnj79 --http-method GET --resource-id le6u99m1x7 --patch-operations "op=replace,path=/uri,value='$ENDPOINT_URL'"
aws apigateway update-integration --rest-api-id pqgnkbnj79 --http-method ANY --resource-id bwg0i2 --patch-operations "op=replace,path=/uri,value='$ENDPOINT_URL{proxy}'"
DEPLOYMENT_ID=$(aws apigateway create-deployment --rest-api-id pqgnkbnj79 --stage-name default --query id --output text)
aws apigateway update-stage --rest-api-id pqgnkbnj79 --stage-name default --patch-operations "op='replace',path='/deploymentId',value='$DEPLOYMENT_ID'"
