import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await Astro.glob('../blog/*.md');
  const sortedPosts = posts.sort((a, b) => 
    new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
  );

  return rss({
    title: 'Автоблог',
    description: 'Блог, созданный из сессий с Claude Code',
    site: context.site,
    items: sortedPosts.map(post => ({
      title: post.frontmatter.title,
      pubDate: new Date(post.frontmatter.date),
      description: post.frontmatter.description,
      link: post.url,
    })),
  });
}
