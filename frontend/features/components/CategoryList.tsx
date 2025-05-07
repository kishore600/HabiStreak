import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const CategoryList = ({ categories }:any) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories?.map((category:any, index:any) => (
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
    // marginTop: ,
    // paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  badge: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  badgeText: {
    color: '#3730A3',
    fontWeight: '500',
  },
});

export default CategoryList;
