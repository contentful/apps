"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// backend/src/actions/braze-handler.ts
var braze_handler_exports = {};
__export(braze_handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(braze_handler_exports);
var handler = async (event, context) => {
  if (event.headers["X-Contentful-Topic"].includes("Entry")) {
    event = event;
    await brazeExample(event);
    await brazeUpdateExample(event);
  }
  return;
};
var brazeExample = async (event) => {
  try {
    const url = "https://rest.iad-03.braze.com/content_blocks/list";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `123`,
        "Content-Type": "application/json"
      }
    });
    console.log(response.body);
  } catch (error) {
    console.error("Failed to send sys and metadata to audit log server", error);
  }
};
var brazeUpdateExample = async (event) => {
  const body = JSON.stringify({
    content_block_id: "123",
    name: "Entry-field-A",
    description: "Contrary to popular belief, Lorem Ipsum is not simply random",
    content: "<h1>Hola use una app function para actualizar este contenido</h1>",
    state: "active",
    tags: []
  });
  try {
    const url = "https://rest.iad-03.braze.com/content_blocks/update";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `1234`,
        "Content-Type": "application/json"
      },
      body
    });
    console.log(response);
  } catch (error) {
    console.error("Failed to send sys and metadata to audit log server", error);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
