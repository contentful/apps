/**
 * @description - defines the max number of content types to be fetched via SDK per call.
 * This is used for pagination. The SDK defines a max of 1000, and default of 100. Abstracting
 * this to a const makes unit testing/configuration *hopefully* easier.
 */

export const CONTENT_TYPE_LIMIT = 100;
