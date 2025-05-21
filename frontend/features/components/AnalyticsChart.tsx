import React from 'react';
import {Dimensions, View, Text, ScrollView} from 'react-native';
import {BarChart} from 'react-native-chart-kit';
import {useGroup} from '../context/GroupContext';

const screenWidth = Dimensions.get('window').width;

const AnalyticsChart = ({analytics}: {analytics: any[]}) => {
  const {memberData,comparisonData}: any = useGroup(); // FIX: added `()` to call the hook

  const renderChart = (
    title: string,
    data: any[],
    valueKey: string,
    labelKey: string,
  ) => {
    if (!Array.isArray(data) || data.length === 0)
      return <Text>No data for {title}</Text>;

    const labels = data.map(d => {
      const rawDate = d[labelKey];
      const date = new Date(rawDate);
      if (!isNaN(date.getTime())) {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      return 'N/A';
    });

    const values = data.map(d => d[valueKey] || 0);

    // Width per bar to allow scrolling
    const chartWidth = Math.max(labels.length * 30, screenWidth);

    return (
      <View>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
          {title}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={{
              labels,
              datasets: [{ data: values }],
            }}
            width={chartWidth}
            height={220}
            fromZero
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 8 },
            }}
            verticalLabelRotation={30}
            style={{ borderRadius: 8 }} yAxisLabel={''} yAxisSuffix={''}          />
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView>
      {renderChart(
        'Group-Wide Completions',
        analytics,
        'completedCount',
        '_id',
      )}
      {renderChart(
        'Per-Member Completions',
        memberData,
        'userCompletions',
        '_id',
      )}
         {renderChart(
        'Group Total (for Comparison)',
        comparisonData,
        'totalGroupCompletions',
        '_id',
      )}
    </ScrollView>
  );
};

export default AnalyticsChart;
