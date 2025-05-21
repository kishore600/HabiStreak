import React from 'react';
import {Dimensions, View, Text} from 'react-native';
import {BarChart} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const AnalyticsChart = ({analytics}: {analytics: any[]}) => {
  if (!Array.isArray(analytics) || analytics.length === 0) {
    return <Text>No analytics data</Text>;
  }
  console.log(analytics);
  const labels = analytics.map(d => {
    const date = new Date(d._id);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  const values = analytics.map(
    d => d.completedCount || d.totalCompletions || d.userCompletions || 0,
  );
  console.log('Labels:', labels);
  console.log('Values:', values);

  return (
    <View >
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
        Completions Overview
      </Text>
      <BarChart
        data={{
          labels: labels,
          datasets: [{data: values}],
        }}
        width={screenWidth - 90}
        height={220}
        fromZero
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {borderRadius: 8},
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#1e90ff',
          },
        }}
        verticalLabelRotation={30}
        style={{borderRadius: 8}}
        yAxisLabel={''}
        yAxisSuffix={''}
      />
    </View>
  );
};

export default AnalyticsChart;
