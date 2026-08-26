import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkoutCard from '../components/WorkoutCard';
import { useContent } from '../data/useContent';
import { colors, radius, shadows } from '../theme';

export default function ExploreScreen({ navigation }: any) {
  const content = useContent();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tout');
  const categories = ['Tout', 'Yoga', 'Fitness', 'Mobilité', 'Respiration'];
  const filtered = content.workouts.filter((item) => (category === 'Tout' || item.category === category) && `${item.title} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase()));

  if (content.loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={<>
          <Text style={styles.pageTitle}>Explorer</Text><Text style={styles.pageLead}>Trouve la séance qui matche ton énergie.</Text>
          <View style={[styles.searchBox, shadows.soft]}><Ionicons name="search" size={19} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher une séance" placeholderTextColor="#B49CBF" style={styles.searchInput} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filterChip, category === item && styles.filterActive]}><Text style={[styles.filterText, category === item && { color: 'white' }]}>{item}</Text></Pressable>)}</ScrollView>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>{filtered.length} séances</Text>
        </>}
        renderItem={({ item }) => <View style={{ marginBottom: 14 }}><WorkoutCard workout={item} navigation={navigation} /></View>}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="search-outline" size={40} color={colors.sage} /><Text style={styles.emptyTitle}>Aucune séance trouvée</Text><Text style={styles.muted}>Essaie une autre recherche.</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, scrollContent: { paddingHorizontal: 20, paddingBottom: 120 }, centered: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  pageTitle: { fontSize: 36, color: colors.ink, fontWeight: '900', letterSpacing: -1.3, marginTop: 15 }, pageLead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 5, marginBottom: 24 }, searchBox: { height: 54, borderRadius: 18, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 9 }, searchInput: { flex: 1, fontSize: 15, color: colors.ink }, filterRow: { gap: 8, paddingVertical: 17 }, filterChip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 22, backgroundColor: 'white', borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: colors.green, borderColor: colors.green }, filterText: { color: colors.ink, fontSize: 13, fontWeight: '700' }, emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 30 }, emptyTitle: { fontSize: 21, fontWeight: '900', color: colors.ink, marginTop: 14, marginBottom: 6 }, muted: { color: colors.muted }, sectionTitle: { fontSize: 21, fontWeight: '800', color: colors.ink },
});
