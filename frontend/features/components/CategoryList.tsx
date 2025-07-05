import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const CategoryList = ({ categories }: any) => {
  const [fcategory, setFcategories] = useState<string[]>([]);

  useEffect(() => {
    if (!categories) return;

    if (
      Array.isArray(categories) &&
      categories.length === 1 &&
      typeof categories[0] === 'string' &&
      categories[0].startsWith('[')
    ) {
      // Case: stringified array
      try {
        const parsed = JSON.parse(categories[0]);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          setFcategories(parsed);
        }
      } catch (err) {
        console.warn('Invalid category format:', err);
      }
    } else if (Array.isArray(categories) && categories.every(item => typeof item === 'string')) {
      // Already in correct format
      setFcategories(categories);
    }
  }, [categories]);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {fcategory.map((category: string, index: number) => (
          <View key={index} style={styles.badge}>
            <Text style={styles.badgeText}>{category}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft:-10
  },
  badge: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 6,
    padding: 12,
    borderRadius: 20,
    marginRight: 8,
    marginTop:20
  },
  badgeText: {
    color: '#3730A3',
    fontWeight: '500',
  },
});

export default CategoryList;
