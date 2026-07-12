import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';

type TeamDetailRoute = RouteProp<BracketStackParamList, 'TeamDetail'>;

export default function TeamDetailScreen() {
  const route = useRoute<TeamDetailRoute>();
  const { ratings } = useBracketDataContext();
  const rating = ratings?.get(route.params.team);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{route.params.team}</Text>
      <Text testID="team-rating">
        {rating ? `Rating: ${Math.round(rating.rating)}` : 'Loading rating…'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
});
