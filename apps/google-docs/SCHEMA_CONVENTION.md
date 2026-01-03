# Google Docs Schema Convention

This document explains how to use schema markers in your Google Docs to improve AI accuracy when extracting structured content for Contentful.

## Overview

The Google Docs app supports an optional schema convention that allows you to explicitly mark:
- **Entry boundaries** - Where each Contentful entry starts and ends
- **Content type assignments** - Which content type each entry should use
- **Reference mappings** - How entries reference each other

Using schema markers makes the AI extraction **significantly more accurate** and reliable, especially when:
- Creating multiple entries from a single document
- Mapping references between entries
- Working with multiple content types

## Schema Marker Format

We use a unique marker format that's highly unlikely to appear in normal documents: `**!...!**`

### Entry Markers

Mark the start of a new entry with:
```
**!CT:contentTypeId!**
```

**Example:**
```
**!CT:blogPost!**
My Blog Post Title

This is the content of my blog post...
```

### Reference Markers

Mark references to other entries with:
```
**!REF:tempId!**
```

**Example:**
```
**!CT:blogPost!**
My Blog Post Title

Author: **!REF:author_1!** John Doe
Tags: **!REF:tag_1!** Technology, **!REF:tag_2!** AI
```

### Entry End Markers (Optional)

Optionally mark the end of an entry with:
```
**!END!**
```

**Example:**
```
**!CT:blogPost!**
My Blog Post Title

This is the content...

**!END!**

**!CT:product!**
Product Name: Widget Pro
...
```

## Complete Examples

### Example 1: Single Entry with References

```
**!CT:blogPost!**
My Journey into AI

This is my story about learning AI...

Author: **!REF:author_1!** John Doe
Tags: **!REF:tag_1!** Technology, **!REF:tag_2!** AI

**!CT:author!**
John Doe
Bio: John is a software engineer with 10 years of experience...

**!CT:tag!**
Technology
Description: Posts about technology trends

**!CT:tag!**
AI
Description: Posts about artificial intelligence
```

**Result:** Creates 1 blogPost entry, 1 author entry, and 2 tag entries with proper references.

### Example 2: Multiple Entries of Same Type

```
**!CT:blogPost!**
Blog Post 1: Introduction to AI

Content about AI basics...

**!END!**

**!CT:blogPost!**
Blog Post 2: Machine Learning Fundamentals

Content about ML...

**!END!**

**!CT:blogPost!**
Blog Post 3: Deep Learning Explained

Content about deep learning...
```

**Result:** Creates 3 separate blogPost entries.

### Example 3: Multiple Different Content Types

```
**!CT:author!**
John Doe
Bio: John is a software engineer...

**!CT:product!**
Widget Pro
Price: $99.99
Description: The best widget ever made

**!CT:blogPost!**
My Journey
Author: **!REF:author_1!** John Doe
Content: This is my story...
```

**Result:** Creates 1 author entry, 1 product entry, and 1 blogPost entry (with reference to author).

## Alternative Formats (For Testing)

We also support these alternative formats for testing:

### Simple Brackets
```
[[CT:blogPost]]
[[REF:author_1]]
```

### Double Braces
```
{{CT:blogPost}}
{{REF:author_1}}
```

### Contentful Prefix
```
[CF:CT:blogPost]
[CF:REF:author_1]
```

**Note:** The primary format `**!CT:...!**` is recommended as it's the most unique and least likely to conflict with normal document content.

## Best Practices

### 1. Place Entry Markers at the Start
Place `**!CT:contentTypeId!**` markers at the beginning of each entry section, ideally on their own line or as the first element in a heading.

### 2. Use Consistent tempIds for References
When creating references, use consistent tempId patterns:
- `author_1`, `author_2` for authors
- `tag_1`, `tag_2` for tags
- `category_1`, `category_2` for categories

The format is: `contentTypeId_number`

### 3. Define Referenced Entries Before Using Them
Define entries that will be referenced (like authors, tags) before the entries that reference them:

```
**!CT:author!**
John Doe
...

**!CT:blogPost!**
My Post
Author: **!REF:author_1!** John Doe
```

### 4. Use End Markers for Clarity
While optional, `**!END!**` markers help clearly separate entries, especially when you have multiple entries of the same type.

### 5. Keep Markers Visible
Schema markers are removed from the final extracted content, so you can keep them visible in your document for documentation purposes.

## How It Works

1. **Document Processing**: When you process a Google Doc, the app scans for schema markers
2. **Marker Detection**: All markers are extracted and parsed
3. **AI Guidance**: The markers are used to provide explicit instructions to the AI
4. **Content Extraction**: The AI follows the schema markers to extract entries accurately
5. **Marker Removal**: Schema markers are removed from the final extracted content

## Benefits

Using schema markers provides several benefits:

✅ **Higher Accuracy**: Explicit markers eliminate ambiguity  
✅ **Better Reference Mapping**: Clear reference markers ensure proper relationships  
✅ **Multiple Entry Support**: Easy to create multiple entries from one document  
✅ **Content Type Clarity**: Explicit content type assignments prevent confusion  
✅ **Predictable Results**: Consistent behavior across different document structures  

## Troubleshooting

### Markers Not Detected
- Ensure you're using the exact format: `**!CT:contentTypeId!**`
- Check for typos in the marker format
- Verify the content type ID matches your Contentful content type ID exactly

### References Not Working
- Ensure referenced entries are defined before being referenced
- Use consistent tempId format: `contentTypeId_number`
- Verify the tempId matches exactly (case-sensitive)

### Multiple Entries Not Created
- Use `**!END!**` markers to clearly separate entries
- Ensure each entry has its own `**!CT:...!**` marker
- Check that content type IDs are correct

## Where to Learn More

- [Contentful Content Types Documentation](https://www.contentful.com/developers/docs/concepts/data-model/)
- [Google Docs App Documentation](./README.md)

## Feedback

If you have suggestions for improving the schema convention or encounter issues, please provide feedback through your Contentful support channel.

