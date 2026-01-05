# Schema Convention Examples

This document provides practical examples of using schema markers in Google Docs for different use cases.

## Example 1: Blog Post with Author and Tags

**Use Case:** Create a blog post entry with references to an author and multiple tags.

**Google Doc Content:**
```
**!CT:blogPost!**
Getting Started with AI
Artificial intelligence is transforming industries...
Author: **!REF:author_1!** Sarah Johnson
Tags: **!REF:tag_1!** Technology, **!REF:tag_2!** AI, **!REF:tag_3!** Machine Learning
**!CT:author!**
Sarah Johnson
Bio: Sarah is a data scientist with expertise in machine learning and AI applications.
Email: sarah@example.com
**!CT:tag!**
Technology
Description: Posts related to technology trends
**!CT:tag!**
AI
Description: Posts about artificial intelligence
**!CT:tag!**
Machine Learning
Description: Posts about machine learning techniques
```

**Result:** 
- 1 blogPost entry with title "Getting Started with AI"
- 1 author entry (Sarah Johnson) with tempId `author_1`
- 3 tag entries with tempIds `tag_1`, `tag_2`, `tag_3`
- Blog post references author_1 and all three tags

## Example 2: Multiple Blog Posts

**Use Case:** Create multiple blog post entries from a single document.

**Google Doc Content:**
```
**!CT:blogPost!**
Introduction to React
React is a popular JavaScript library...
**!END!**
**!CT:blogPost!**
Advanced React Patterns
Learn about higher-order components...
**!END!**
**!CT:blogPost!**
React Performance Optimization
Tips for optimizing React applications...
```

**Result:**
- 3 separate blogPost entries
- Each entry has its own complete set of fields

## Example 3: Product Catalog

**Use Case:** Create multiple product entries with categories.

**Google Doc Content:**
```
**!CT:product!**
Widget Pro
Price: $99.99
Description: Professional-grade widget for advanced users
Category: **!REF:category_1!** Electronics
**!END!**
**!CT:product!**
Widget Basic
Price: $49.99
Description: Entry-level widget for beginners
Category: **!REF:category_1!** Electronics
**!END!**
**!CT:category!**
Electronics
Description: Electronic products and accessories
```

**Result:**
- 2 product entries (Widget Pro and Widget Basic)
- 1 category entry (Electronics) with tempId `category_1`
- Both products reference the same category

## Example 4: Mixed Content Types

**Use Case:** Create entries for different content types in one document.

**Google Doc Content:**
```
**!CT:author!**
John Smith
Bio: John is a software engineer with 15 years of experience...
Location: San Francisco, CA
**!CT:product!**
CodeMaster IDE
Price: $199.99
Description: Professional IDE for modern development
Features: Syntax highlighting, Git integration, AI assistance
**!CT:blogPost!**
Why CodeMaster is the Best IDE
Author: **!REF:author_1!** John Smith
Content: After using CodeMaster for 6 months, I can confidently say...
Related Product: **!REF:product_1!** CodeMaster IDE
```

**Result:**
- 1 author entry (John Smith) with tempId `author_1`
- 1 product entry (CodeMaster IDE) with tempId `product_1`
- 1 blogPost entry that references both author_1 and product_1

## Example 5: Document with Rich Formatting

**Use Case:** Create entries while preserving formatting.

**Google Doc Content:**
```
**!CT:blogPost!**
My Journey with **Bold Text** and *Italic Text*
This paragraph has formatting preserved.
- Bullet point 1
- Bullet point 2
- Bullet point 3
**!END!**
```

**Result:**
- 1 blogPost entry with RichText field containing:
  - Bold text preserved
  - Italic text preserved
  - Bullet list preserved

## Example 6: Table-Based Entries

**Use Case:** Create multiple entries from a table structure.

**Google Doc Content:**
```
**!CT:product!**
Product Name: Widget A
Price: $10
Description: Basic widget
**!END!**
**!CT:product!**
Product Name: Widget B
Price: $20
Description: Standard widget
**!END!**
**!CT:product!**
Product Name: Widget C
Price: $30
Description: Premium widget
```

**Result:**
- 3 separate product entries
- Each entry extracted from its marked section

## Example 7: Nested References

**Use Case:** Create entries with complex reference relationships.

**Google Doc Content:**
```
**!CT:author!**
Jane Doe
Bio: Jane is a content strategist...
**!CT:tag!**
Marketing
Description: Marketing-related content
**!CT:tag!**
Strategy
Description: Strategic content
**!CT:blogPost!**
Content Strategy Guide
Author: **!REF:author_1!** Jane Doe
Tags: **!REF:tag_1!** Marketing, **!REF:tag_2!** Strategy
Related Posts: **!REF:blogPost_2!** Advanced Marketing
**!CT:blogPost!**
Advanced Marketing Techniques
Author: **!REF:author_1!** Jane Doe
Tags: **!REF:tag_1!** Marketing
```

**Result:**
- 1 author entry (Jane Doe) with tempId `author_1`
- 2 tag entries with tempIds `tag_1` and `tag_2`
- 2 blogPost entries
- First blog post references author, tags, and second blog post
- Second blog post references author and first tag

## Example 8: Minimal Schema Usage

**Use Case:** Use minimal markers for simple cases.

**Google Doc Content:**
```
**!CT:blogPost!**
Simple Blog Post
Just the content here. No references needed.
```

**Result:**
- 1 blogPost entry
- No references created

## Tips for Success

1. **Test with Simple Examples First**: Start with a single entry, then add complexity
2. **Verify Content Type IDs**: Ensure your content type IDs match exactly (case-sensitive)
3. **Use Consistent Naming**: Use consistent tempId patterns (`author_1`, `tag_1`, etc.)
4. **Check References**: Ensure referenced entries are defined before being referenced
5. **Use End Markers**: When creating multiple entries, use `**!END!**` for clarity

## Common Patterns

### Pattern 1: Single Entry with Multiple References
```
**!CT:mainEntry!**
Content...
Ref1: **!REF:ref_1!**
Ref2: **!REF:ref_2!**
**!CT:referencedType!**
Reference 1
**!CT:referencedType!**
Reference 2
```

### Pattern 2: Multiple Entries Sharing References
```
**!CT:sharedRef!**
Shared Content
**!CT:entry!**
Entry 1
Ref: **!REF:sharedRef_1!**
**!CT:entry!**
Entry 2
Ref: **!REF:sharedRef_1!**
```

### Pattern 3: Sequential Entries
```
**!CT:entry!**
Entry 1
**!END!**
**!CT:entry!**
Entry 2
**!END!**
**!CT:entry!**
Entry 3
```

## Troubleshooting Examples

### Issue: References Not Working

**Problem:**
```
**!CT:blogPost!**
Post
Author: **!REF:author_1!** John
**!CT:author!**
John Doe
```

**Solution:** Define referenced entries before using them:
```
**!CT:author!**
John Doe
**!CT:blogPost!**
Post
Author: **!REF:author_1!** John
```

### Issue: Multiple Entries Combined

**Problem:** Multiple entries being created as one.

**Solution:** Use `**!END!**` markers:
```
**!CT:blogPost!**
Post 1
**!END!**
**!CT:blogPost!**
Post 2
```
