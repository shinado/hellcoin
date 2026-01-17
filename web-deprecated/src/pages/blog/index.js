import Link from 'next/link'
import { getAllPosts } from '../../lib/posts'

export default function Blog({ posts }) {
  // Separate featured and regular posts
  const featuredPosts = posts.filter(post => post.featured)
  const regularPosts = posts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Featured Posts Section */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-white">Featured Posts</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredPosts.map((post) => (
                <Link 
                  href={`/blog/${post.slug}`}
                  key={post.slug}
                  className="block group relative"
                >
                  <article className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-700">
                    {post.coverImage && (
                      <div className="aspect-[2/1] w-full overflow-hidden">
                        <img 
                          src={post.coverImage} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-amber-900/60 text-amber-200 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        Featured
                      </span>
                    </div>
                    <div className="p-6">
                      {post.categories && (
                        <div className="flex gap-2 mb-3">
                          {post.categories.map((category) => (
                            <span 
                              key={category}
                              className="bg-blue-900/50 text-blue-200 text-xs px-2 py-1 rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-2xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-gray-300 mb-4 line-clamp-2">
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {post.author?.avatar && (
                            <img 
                              src={post.author.avatar}
                              alt={post.author.name}
                              className="w-8 h-8 rounded-full mr-2 ring-2 ring-gray-700"
                            />
                          )}
                          <span className="text-sm text-gray-300">{post.author?.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
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
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts Section */}
        <div>
          <h2 className="text-3xl font-bold mb-8 text-white">All Posts</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <Link 
                href={`/blog/${post.slug}`}
                key={post.slug}
                className="block group"
              >
                <article className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full border border-gray-700">
                  {post.coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={post.coverImage} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {post.categories && (
                      <div className="flex gap-2 mb-3">
                        {post.categories.map((category) => (
                          <span 
                            key={category}
                            className="bg-blue-900/50 text-blue-200 text-xs px-2 py-1 rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-300 mb-4 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center">
                        {post.author?.avatar && (
                          <img 
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-8 h-8 rounded-full mr-2 ring-2 ring-gray-700"
                          />
                        )}
                        <span className="text-sm text-gray-300">{post.author?.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
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
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps() {
  const posts = getAllPosts()
  return {
    props: {
      posts,
    },
  }
}