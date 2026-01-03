# Schema Convention Implementation Summary

## Overview

This document summarizes the implementation of the schema convention feature for the Google Docs app, which allows users to explicitly mark entry boundaries, content types, and references in their Google Docs to improve AI extraction accuracy.

## What Was Implemented

### 1. Schema Convention Parser (`schemaConvention.ts`)

**Location:** `functions/agents/documentParserAgent/schemaConvention.ts`

**Features:**
- Parses schema markers from Google Docs text
- Supports multiple marker formats:
  - Primary: `**!CT:contentTypeId!**` and `**!REF:tempId!**`
  - Alternative formats: `[[CT:...]]`, `{{CT:...}}`, `[CF:CT:...]`
- Extracts entry boundaries and reference mappings
- Generates AI guidance based on detected schema markers

**Key Functions:**
- `parseSchemaMarkers()` - Parses all schema markers from document text
- `removeSchemaMarkers()` - Removes markers from text (for clean extraction)
- `extractTextWithSchema()` - Extracts text and parses schema markers
- `generateSchemaGuidance()` - Creates AI prompt guidance from schema

### 2. Document Parser Integration

**Location:** `functions/agents/documentParserAgent/documentParser.agent.ts`

**Changes:**
- Integrated schema convention parser into document processing flow
- Extracts schema markers before building AI prompt
- Includes schema guidance in system prompt when markers are detected
- Logs schema detection for debugging

**Key Updates:**
- `createPreviewWithAgent()` - Now extracts and uses schema markers
- `buildSystemPrompt()` - Includes schema guidance when present
- `buildExtractionPrompt()` - Receives schema information and includes it in prompt

### 3. User Documentation

**Files Created:**
- `SCHEMA_CONVENTION.md` - Complete guide to using schema markers
- `SCHEMA_EXAMPLES.md` - Practical examples for different use cases
- `README.md` - Updated to reference schema convention docs

**Documentation Includes:**
- Marker format specifications
- Complete examples for various use cases
- Best practices and troubleshooting
- Pattern examples

## Schema Marker Format

### Primary Format (Recommended)

- **Entry Marker:** `**!CT:contentTypeId!**`
- **Reference Marker:** `**!REF:tempId!**`
- **End Marker:** `**!END!**`

### Alternative Formats (For Testing)

- Simple brackets: `[[CT:contentTypeId]]`, `[[REF:tempId]]`
- Double braces: `{{CT:contentTypeId}}`, `{{REF:tempId}}`
- Contentful prefix: `[CF:CT:contentTypeId]`, `[CF:REF:tempId]`

## How It Works

1. **Document Fetching**: Google Doc JSON is fetched via API
2. **Text Extraction**: Plain text is extracted from JSON structure
3. **Schema Parsing**: Schema markers are detected and parsed
4. **AI Guidance**: Schema information is included in AI prompt
5. **Content Extraction**: AI follows schema markers to extract entries
6. **Marker Removal**: Schema markers are removed from final content

## Benefits

✅ **Higher Accuracy**: Explicit markers eliminate ambiguity  
✅ **Better Reference Mapping**: Clear reference markers ensure proper relationships  
✅ **Multiple Entry Support**: Easy to create multiple entries from one document  
✅ **Content Type Clarity**: Explicit content type assignments prevent confusion  
✅ **Predictable Results**: Consistent behavior across different document structures  

## Testing Recommendations

### Test Cases to Validate

1. **Single Entry with References**
   - Create a blog post with author and tags
   - Verify references are correctly mapped

2. **Multiple Entries of Same Type**
   - Create multiple blog posts in one document
   - Verify each is created as separate entry

3. **Multiple Different Content Types**
   - Create author, product, and blog post entries
   - Verify all content types are extracted

4. **Complex Reference Chains**
   - Create entries with nested references
   - Verify all references resolve correctly

5. **Edge Cases**
   - Documents without schema markers (should still work)
   - Invalid content type IDs (should warn)
   - Missing referenced entries (should handle gracefully)

## Implementation Details

### Schema Marker Detection

The parser uses regex patterns to detect markers:
- `ENTRY_MARKER_REGEX`: `/\*\*!CT:([a-zA-Z0-9_-]+)!\*\*/g`
- `REFERENCE_MARKER_REGEX`: `/\*\*!REF:([a-zA-Z0-9_-]+)!\*\*/g`
- `END_MARKER_REGEX`: `/\*\*!END!\*\*/g`

### Text Extraction

The `extractPlainText()` function recursively extracts text from:
- Paragraphs (including nested elements)
- Tables (with cell separators)
- Section breaks

### AI Integration

Schema information is passed to the AI in two ways:
1. **System Prompt**: High-level guidance about schema markers
2. **Extraction Prompt**: Detailed schema guidance with entry boundaries and references

## Future Enhancements

Potential improvements for future iterations:

1. **Visual Marker Support**: UI to insert markers without typing
2. **Schema Validation**: Pre-validate schema markers before processing
3. **Template Support**: Pre-built templates with schema markers
4. **Marker Suggestions**: AI suggests where to add markers
5. **Schema Preview**: Preview how schema markers will be interpreted

## Files Modified

- `functions/agents/documentParserAgent/documentParser.agent.ts` - Integrated schema parsing
- `functions/agents/documentParserAgent/schemaConvention.ts` - New schema parser module
- `README.md` - Added schema convention reference
- `SCHEMA_CONVENTION.md` - New user guide
- `SCHEMA_EXAMPLES.md` - New examples document

## Testing Checklist

- [ ] Single entry extraction with schema markers
- [ ] Multiple entries extraction with schema markers
- [ ] Reference mapping with schema markers
- [ ] Documents without schema markers (backward compatibility)
- [ ] Invalid schema markers (error handling)
- [ ] Edge cases (empty markers, duplicate markers, etc.)

## Notes

- Schema markers are optional - documents without markers still work
- The primary format `**!CT:...!**` is recommended for uniqueness
- Alternative formats are supported for testing and flexibility
- Schema markers are removed from final extracted content
- The implementation is backward compatible with existing documents

