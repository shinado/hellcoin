import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getAllPosts, BlogPost } from '../../../data/posts';

function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const { t } = useLanguage();

  return (
    <Link href={`/blog/${post.slug}`} asChild>
      <TouchableOpacity
        className={`bg-gray-800 rounded-2xl overflow-hidden mb-4 border border-gray-700 ${
          featured ? 'mb-6' : ''
        }`}
      >
        {post.coverImage && (
          <Image
            source={{ uri: post.coverImage }}
            className={featured ? 'w-full h-48' : 'w-full h-32'}
            resizeMode="cover"
          />
        )}

        {featured && (
          <View className="absolute top-4 right-4 bg-amber-900/60 px-3 py-1 rounded-full">
            <Text className="text-amber-200 text-sm">{t('blog.featured')}</Text>
          </View>
        )}

        <View className="p-4">
          {post.categories && post.categories.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-2">
              {post.categories.map((category) => (
                <View
                  key={category}
                  className="bg-blue-900/50 px-2 py-1 rounded-full"
                >
                  <Text className="text-blue-200 text-xs">{category}</Text>
                </View>
              ))}
            </View>
          )}

          <Text
            className={`font-semibold text-white mb-2 ${
              featured ? 'text-2xl' : 'text-lg'
            }`}
            numberOfLines={2}
          >
            {post.title}
          </Text>

          <Text className="text-gray-300 mb-3" numberOfLines={2}>
            {post.description}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {post.author?.avatar && (
                <Image
                  source={{ uri: post.author.avatar }}
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              <Text className="text-gray-300 text-sm">
                {post.author?.name || t('blog.unknown')}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Text className="text-gray-400 text-sm">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              {post.readingTime && (
                <Text className="text-gray-400 text-sm ml-2">
                  • {t('blog.readingTime', { time: post.readingTime })}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export default function BlogListScreen() {
  const { t } = useLanguage();

  const allPosts = getAllPosts();
  const featuredPosts = allPosts.filter((post) => post.featured);
  const regularPosts = allPosts.filter((post) => !post.featured);

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-4 py-6">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white mb-4">
              {t('blog.featuredPosts')}
            </Text>
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} featured />
            ))}
          </View>
        )}

        {/* All Posts */}
        <View>
          <Text className="text-2xl font-bold text-white mb-4">{t('blog.allPosts')}</Text>
          {regularPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
