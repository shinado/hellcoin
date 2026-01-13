import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { getPostBySlug } from '../../../data/posts';

const markdownStyles = {
  body: {
    color: '#E5E7EB',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginTop: 24,
    marginBottom: 12,
  },
  heading2: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginTop: 20,
    marginBottom: 10,
  },
  heading3: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    color: '#D1D5DB',
    marginBottom: 12,
  },
  list_item: {
    color: '#D1D5DB',
    marginBottom: 8,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  code_inline: {
    backgroundColor: '#374151',
    color: '#FBBF24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: '#1F2937',
    color: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  fence: {
    backgroundColor: '#1F2937',
    color: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  link: {
    color: '#60A5FA',
  },
  blockquote: {
    backgroundColor: '#1F2937',
    borderLeftColor: '#FF6384',
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  strong: {
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
  },
  em: {
    color: '#D1D5DB',
    fontStyle: 'italic' as const,
  },
  hr: {
    backgroundColor: '#374151',
    height: 1,
    marginVertical: 16,
  },
};

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-white text-xl">Post not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: post.title }} />
      <ScrollView className="flex-1 bg-gray-900">
        {post.coverImage && (
          <Image
            source={{ uri: post.coverImage }}
            className="w-full h-48"
            resizeMode="cover"
          />
        )}

        <View className="px-4 py-6">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {post.categories.map((category) => (
                <View
                  key={category}
                  className="bg-blue-900/50 px-3 py-1 rounded-full"
                >
                  <Text className="text-blue-200 text-sm">{category}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Title */}
          <Text className="text-3xl font-bold text-white mb-4">
            {post.title}
          </Text>

          {/* Meta */}
          <View className="flex-row items-center mb-6 pb-6 border-b border-gray-700">
            {post.author?.avatar && (
              <Image
                source={{ uri: post.author.avatar }}
                className="w-10 h-10 rounded-full mr-3"
              />
            )}
            <View className="flex-1">
              <Text className="text-white font-medium">
                {post.author?.name || 'Unknown'}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-gray-400 text-sm">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                {post.readingTime && (
                  <Text className="text-gray-400 text-sm ml-2">
                    • {post.readingTime} min read
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Content */}
          <Markdown style={markdownStyles}>{post.content}</Markdown>
        </View>
      </ScrollView>
    </>
  );
}
