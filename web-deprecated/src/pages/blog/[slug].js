import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { getAllPosts, getPostBySlug } from '../../lib/posts'
import remarkGfm from 'remark-gfm'

export default function Post({ post }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-700">
          <header className="mb-8">
            {post.categories && (
              <div className="flex gap-2 justify-center mb-4">
                {post.categories.map((category) => (
                  <span 
                    key={category}
                    className="bg-blue-900/50 text-blue-200 text-sm px-3 py-1 rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
              {post.title}
            </h1>
            {/* {post.description && (
              <p className="text-xl text-gray-300 mb-6 text-center">
                {post.description}
              </p>
            )} */}
            
            {/* Author and Post Meta */}
            <div className="flex items-center justify-center space-x-4">
              {post.author && (
                <div>
                <div className="flex items-center">
                  {post.author.avatar && (
                    <img 
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full mr-3 ring-2 ring-gray-700"
                    />
                  )}
                  <div className="text-left">
                    <div className="font-medium text-gray-200">{post.author.name}</div>
                    {post.author.title && (
                      <div className="text-sm text-gray-400">{post.author.title}</div>
                    )}
                  </div>
                </div>

              <span className="text-gray-600">|</span>
              </div>
              )}

              <div className="text-gray-400 text-sm">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                {post.readingTime && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{post.readingTime} min read</span>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img 
                src={post.coverImage}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content - Updated prose classes for better markdown rendering */}
          <div className="prose prose-lg prose-invert max-w-none 
            prose-headings:text-gray-100 
            prose-h1:text-3xl
            prose-h2:text-2xl
            prose-h3:text-xl
            prose-p:text-gray-300 
            prose-a:text-blue-400 
            prose-strong:text-gray-100
            prose-code:text-blue-300
            prose-pre:bg-gray-900
            prose-pre:border
            prose-pre:border-gray-700
            prose-blockquote:border-l-4
            prose-blockquote:border-gray-700
            prose-blockquote:pl-4
            prose-blockquote:text-gray-300
            prose-ul:text-gray-300
            prose-ol:text-gray-300
            prose-li:text-gray-300">
            <MDXRemote 
            {...post.content} 
            />
          </div>

          {/* Tags */}
          {post.tags && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

export async function getStaticPaths() {
  const posts = getAllPosts()
  return {
    paths: posts.map((post) => ({
      params: {
        slug: post.slug,
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug)
  const mdxSource = await serialize(post.content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      format: 'mdx',
    },
  })

  return {
    props: {
      post: {
        ...post,
        content: mdxSource,
      },
    },
  }
}