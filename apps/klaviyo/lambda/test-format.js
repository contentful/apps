const app = require('./app');

// Test fields data
const testFields = [
  {
    fieldId: 'Title',
    fieldType: 'text',
    value: 'This is a test title',
  },
  {
    fieldId: 'Description',
    fieldType: 'text',
    value: 'This is a test description with <strong>HTML</strong> that should be escaped',
  },
  {
    fieldId: 'Rich Text Content',
    fieldType: 'richText',
    value: '<p>This is rich text content with <strong>bold</strong> and <em>italic</em> text</p>',
  },
];

// Access the exported formatter function directly from app.js
// Since the function isn't exported, this won't work without modification
// We need to modify app.js to expose the function for testing

// Test with manually formatted data
console.log('Test formatFieldsToHtml function:');
console.log('=================================');
console.log('Input fields:', JSON.stringify(testFields, null, 2));

// Call the function with a mock payload
const result = app.testFormatFieldsToHtml
  ? app.testFormatFieldsToHtml(testFields)
  : "Function not exported. Add 'exports.testFormatFieldsToHtml = formatFieldsToHtml;' to app.js";

console.log('\nGenerated HTML output:');
console.log('=====================');
console.log(result);

// If function is not available, log instructions
if (!app.testFormatFieldsToHtml) {
  console.log('\nTo make the function testable, add this line to the end of app.js:');
  console.log('exports.testFormatFieldsToHtml = formatFieldsToHtml;');
}
