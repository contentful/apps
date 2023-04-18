export default function prompts({ as = 'title' }) {
  const bank = {
    title: `Suggest a short one-liner for a written blog post in the language defined. Only output content in the requested language`,
    body: `Write a blog post in 400 words about "__prompt__"`,
    seo_description: `Write an optimized SEO description with max 250 characters for the following text: "__prompt__"`,
    seo_keywords: `Suggest a maximum of eight optimized comma-separated keywords for the following text: "__prompt__"`,
  };
  return bank[as];
}
