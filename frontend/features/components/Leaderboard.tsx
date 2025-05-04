import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useGroup } from '../context/GroupContext';

interface LeaderboardProps {
  groupId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ groupId }) => {
  const { leaderboard, loadingLeaderboard, fetchLeaderboard } = useGroup();

  useEffect(() => {
    if (groupId) {
      fetchLeaderboard(groupId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  if (loadingLeaderboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Group Leaderboard</Text>
      <ScrollView>
        {leaderboard.map((entry, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.name}>{index + 1}. {entry.name}</Text>
            <Text style={styles.streak}>{entry.streak} 🔥</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    maxHeight: 400, // limit height to avoid taking over the screen
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 16,
  },
  streak: {
    fontWeight: '600',
    color: '#ff5733',
  },
  center: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default Leaderboard;
