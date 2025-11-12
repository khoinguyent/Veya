import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Library } from '../screens/library/Library';
import { LibraryTopicsScreen } from '../screens/library/LibraryTopics';
import { LibraryArticleScreen } from '../screens/library/LibraryArticle';

export type LibraryStackParamList = {
  LibraryCategories: undefined;
  LibraryTopics: { categoryId: string };
  LibraryArticle: { articleSlug: string };
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export const LibraryNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryCategories" component={Library} />
      <Stack.Screen name="LibraryTopics" component={LibraryTopicsScreen} />
      <Stack.Screen name="LibraryArticle" component={LibraryArticleScreen} />
    </Stack.Navigator>
  );
};
