// import React from 'react';
// import {Dimensions, View, Text, ScrollView} from 'react-native';
// import {BarChart} from 'react-native-chart-kit';
// import {useGroup} from '../context/GroupContext';

// const screenWidth = Dimensions.get('window').width;

// const AnalyticsChart = ({analytics}: {analytics: any[]}) => {
//   const {memberData,comparisonData}: any = useGroup(); // FIX: added `()` to call the hook

//   const renderChart = (
//     title: string,
//     data: any[],
//     valueKey: string,
//     labelKey: string,
//   ) => {
//     if (!Array.isArray(data) || data.length === 0)
//       return <Text>No data for {title}</Text>;

//     const labels = data.map(d => {
//       const rawDate = d[labelKey];
//       const date = new Date(rawDate);
//       if (!isNaN(date.getTime())) {
//         return `${date.getDate()}/${date.getMonth() + 1}`;
//       }
//       return 'N/A';
//     });

//     const values = data.map(d => d[valueKey] || 0);

//     // Width per bar to allow scrolling
//     const chartWidth = Math.max(labels.length * 30, screenWidth);

//     return (
//       <View>
//         <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
//           {title}
//         </Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           <BarChart
//             data={{
//               labels,
//               datasets: [{ data: values }],
//             }}
//             width={chartWidth}
//             height={220}
//             fromZero
//             chartConfig={{
//               backgroundColor: '#ffffff',
//               backgroundGradientFrom: '#ffffff',
//               backgroundGradientTo: '#ffffff',
//               decimalPlaces: 0,
//               color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
//               labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//               style: { borderRadius: 8 },
//             }}
//             verticalLabelRotation={30}
//             style={{ borderRadius: 8 }} yAxisLabel={''} yAxisSuffix={''}          />
//         </ScrollView>
//       </View>
//     );
//   };

//   return (
//     <ScrollView>
//       {renderChart(
//         'Group-Wide Completions',
//         analytics,
//         'completedCount',
//         '_id',
//       )}
//       {renderChart(
//         'Per-Member Completions',
//         memberData,
//         'userCompletions',
//         '_id',
//       )}
//          {renderChart(
//         'Group Total (for Comparison)',
//         comparisonData,
//         'totalGroupCompletions',
//         '_id',
//       )}
//     </ScrollView>
//   );
// };

// export default AnalyticsChart;
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGroup } from '../context/GroupContext';

const getColorForCount = (count: number) => {
  if (count >= 5) return '#0e4429';
  if (count >= 4) return '#006d32';
  if (count >= 3) return '#26a641';
  if (count >= 1) return '#39d353';
  return '#2d333b'; // dark gray for 0
};

const generateFullYearDates = () => {
  const days: { date: string }[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ date: d.toISOString().split('T')[0] });
  }
  return days;
};

const HeatmapChart = ({ dataMap, title }: { dataMap: Record<string, number>; title: string }) => {
  const boxSize = 12;
  const fullYearData = generateFullYearDates().map(day => ({
    date: day.date,
    count: dataMap[day.date] || 0,
  }));

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {fullYearData.map((item, index) => (
          <View
            key={index}
            style={[
              styles.box,
              {
                backgroundColor: getColorForCount(item.count),
                width: boxSize,
                height: boxSize,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const AnalyticsChart = ({ analytics }: any) => {
  const { memberData, comparisonData }: any = useGroup();
  // const fullDates = generateFullYearDates();

  // ✅ Corrected: use completedCount instead of userCompletions
  const analyticsMap = analytics?.reduce((acc: Record<string, number>, entry: any) => {
    acc[entry._id] = (acc[entry._id] || 0) + (entry.completedCount || 0);
    return acc;
  }, {}) || {};

  const memberMap = memberData?.reduce((acc: Record<string, number>, entry: any) => {
    acc[entry._id] = (acc[entry._id] || 0) + (entry.userCompletions || 0);
    return acc;
  }, {}) || {};

  const comparisonMap = comparisonData?.reduce((acc: Record<string, number>, entry: any) => {
    acc[entry._id] = (acc[entry._id] || 0) + (entry.userCompletions || 0);
    return acc;
  }, {}) || {};

  return (
    <ScrollView>
      <Text>
        Analytics Chart
      </Text>
      <HeatmapChart title="Analytics Chart" dataMap={analyticsMap} />
      <Text>
        Member Chart
      </Text>
      <HeatmapChart title="Member Chart" dataMap={memberMap} />
            <Text>
        Comparison Chart
      </Text>
      <HeatmapChart title="Comparison Chart" dataMap={comparisonMap} />
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  chartContainer: {
    padding: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: 'white',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  box: {
    margin: 1,
    borderRadius: 2,
  },
});

export default AnalyticsChart;
