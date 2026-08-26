import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkoutCard from '../components/WorkoutCard';
import PrimaryButton from '../components/PrimaryButton';
import { useContent } from '../data/useContent';
import { useStore } from '../store/StoreContext';
import { colors } from '../theme';

export default function FavoritesScreen({ navigation }: any) {
  const content = useContent();
  const { favorites } = useStore();
  const saved = content.workouts.filter((item) => favorites.includes(item.id));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={<><Text style={styles.pageTitle}>Favoris</Text><Text style={styles.pageLead}>Tes séances préférées, toujours à portée de main.</Text></>}
        renderItem={({ item }) => <View style={{ marginBottom: 14 }}><WorkoutCard workout={item} navigation={navigation} /></View>}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={colors.sage} />
            <Text style={styles.emptyTitle}>Ta sélection est vide</Text>
            <Text style={[styles.muted, { textAlign: 'center' }]}>Touche le cœur d’une séance pour la retrouver ici.</Text>
            <View style={{ height: 18 }} />
            <PrimaryButton label="Explorer les séances" onPress={() => navigation.navigate('Explore')} light />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  pageTitle: { fontSize: 36, color: colors.ink, fontWeight: '900', letterSpacing: -1.3, marginTop: 15 }, pageLead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 5, marginBottom: 24 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 30 }, emptyTitle: { fontSize: 21, fontWeight: '900', color: colors.ink, marginTop: 14, marginBottom: 6 }, muted: { color: colors.muted },
});
