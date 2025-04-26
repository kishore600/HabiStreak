import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useConvo} from '../context/ConvoContext';

const HomeScreen = () => {
  const {convos, loading} = useConvo();

const renderItem = ({ item }: any) => (
  <View style={styles.convoContainer}>
    {/* User Info */}
    <View style={styles.userContainer}>
      <Image source={{ uri: item.user.image }} style={styles.userImage} />
      <View>
        <Text style={styles.userName}>{item.user.name}</Text>
        <Text style={styles.userId}>ID: {item.user._id}</Text>
      </View>
    </View>

    {/* Conversation Image & Description */}
    <Image source={{ uri: item.image }} style={styles.convoImage} />
    <Text style={styles.description}>{item.description}</Text>

    {/* Comments Section */}
    <View style={styles.commentsContainer}>
      <Text style={styles.commentsTitle}>Comments:</Text>
      {item.comments.length > 0 ? (
        item.comments.map((comment: any, index: number) => (
          <Text key={index} style={styles.commentText}>
            {comment.text}
          </Text>
        ))
      ) : (
        <Text style={styles.noComments}>No comments yet</Text>
      )}
    </View>

    {/* Timestamp */}
    <Text style={styles.timestamp}>
      {new Date(item.createdAt).toLocaleString()}
    </Text>
  </View>
);

  console.log(convos)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {loading ? (
         <View style={styles.loaderContainer}>
         <ActivityIndicator size="large" color="#007bff" />
       </View>
      ) : (
        <FlatList
          data={convos}
          renderItem={renderItem}
          keyExtractor={item => item._id}
        />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10, backgroundColor: '#f8f9fa', top: 50},
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  
  image: {width: '100%', height: 200, borderRadius: 8},
  timestamp: {fontSize: 12, color: 'gray', marginTop: 5, textAlign: 'right'},
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convoContainer: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userId: {
    fontSize: 12,
    color: "#666",
  },
  convoImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: "#333",
  },
  commentsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  commentsTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: "#555",
  },
  noComments: {
    fontSize: 12,
    color: "#999",
  },

});
