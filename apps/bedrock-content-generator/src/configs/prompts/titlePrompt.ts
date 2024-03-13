const titlePrompt = (blog: string) =>
  `Suggest a short one-liner for a written blog post in the language defined. Output ONLY the title, nothing else, not even quotation marks. Only output content in the requested language. Here is the blog post: '${blog}'`;

export default titlePrompt;
