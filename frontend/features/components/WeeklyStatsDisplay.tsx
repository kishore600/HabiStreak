import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface WeeklyStatsProps {
  weeklyStats: {
    mon: { rest: boolean }
    tue: { rest: boolean }
    wed: { rest: boolean }
    thu: { rest: boolean }
    fri: { rest: boolean }
    sat: { rest: boolean }
    sun: { rest: boolean }
  }
  weeklyOption: {
    weekdays: boolean
    weekend: boolean
  }
}

const WeeklyStatsDisplay: React.FC<WeeklyStatsProps> = ({ weeklyStats, weeklyOption }) => {
  const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Random motivational images - you can replace these with your own
  const motivationalImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop',
  ];

  const getRandomImage = () => {
    return motivationalImages[Math.floor(Math.random() * motivationalImages.length)];
  };

  const isWeekend = (day: string) => {
    return day === 'sat' || day === 'sun';
  };

  const shouldShowDay = (day: string) => {
    if (isWeekend(day)) {
      return weeklyOption.weekend;
    } else {
      return weeklyOption.weekdays;
    }
  };

  const calculateWeeklyStreak = () => {
    let streak = 0;
    dayNames.forEach((day) => {
      if (shouldShowDay(day) && weeklyStats[day as keyof typeof weeklyStats]?.rest) {
        streak++;
      }
    });
    return streak;
  };

  const getTotalPossibleDays = () => {
    let total = 0;
    dayNames.forEach((day) => {
      if (shouldShowDay(day)) {
        total++;
      }
    });
    return total;
  };

  const weeklyStreak = calculateWeeklyStreak();
  const totalPossibleDays = getTotalPossibleDays();
  const shouldShowMotivationalImage = weeklyStreak > 0;


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Progress</Text>

      {/* Motivational Image */}
      {shouldShowMotivationalImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: getRandomImage() }} style={styles.motivationalImage} resizeMode="cover" />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageText}>Keep Going! 🔥</Text>
          </View>
        </View>
      )}

      {/* Weekly Stats Grid */}
      <View style={styles.weekGrid}>
        {dayNames.map((day, index) => {
          const shouldShow = shouldShowDay(day);
          const isCompleted = shouldShow && weeklyStats[day as keyof typeof weeklyStats]?.rest;

          return (
            <View
              key={day}
              style={[styles.dayContainer, !shouldShow && styles.disabledDay, isCompleted && styles.completedDay]}
            >
              <Text style={[styles.dayLabel, !shouldShow && styles.disabledText, isCompleted && styles.completedText]}>
                {dayLabels[index]}
              </Text>
              <View style={styles.dayStatus}>
                {shouldShow ? (
                  <Icon
                    name={isCompleted ? 'check-circle' : 'circle-o'}
                    size={20}
                    color={isCompleted ? '#4CAF50' : '#E0E0E0'}
                  />
                ) : (
                  <Icon name="ban" size={20} color="#D3D3D3" />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Star Rating */}
      <View style={styles.starContainer}>
        <Text style={styles.streakText}>
          Weekly Streak: {weeklyStreak}/{totalPossibleDays}
        </Text>
      </View>

      {/* Progress Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {weeklyOption.weekdays && weeklyOption.weekend
            ? 'Full Week Mode'
            : weeklyOption.weekdays
              ? 'Weekdays Only'
              : 'Weekends Only'}
        </Text>
        <Text style={styles.progressText}>{Math.round((weeklyStreak / totalPossibleDays) * 100)}% Complete</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  motivationalImage: {
    width: '100%',
    height: 120,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  imageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayContainer: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 40,
  },
  disabledDay: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  completedDay: {
    backgroundColor: '#E8F5E8',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
  completedText: {
    color: '#4CAF50',
  },
  dayStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default WeeklyStatsDisplay;
