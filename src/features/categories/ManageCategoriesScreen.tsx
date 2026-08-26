import { useState } from 'react';
import { Alert, View } from 'react-native';

import { isCategoryInUse, useSessionStore, useSessionStoreSnapshot } from '@/data';
import { Button, Card, CategoryTile, IconButton, Screen, Text, useTheme } from '@/design-system';
import type { Category } from '@/domain';

import { CategoryEditor } from './CategoryEditor';

const ROW_TILE_SIZE = 40;

export function ManageCategoriesScreen() {
  const theme = useTheme();
  const store = useSessionStore();
  const snapshot = useSessionStoreSnapshot();
  const { categories } = snapshot;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const active = categories.filter((category) => !category.isArchived);
  const archived = categories.filter((category) => category.isArchived);

  function moveCategory(category: Category, by: -1 | 1): void {
    const order = active.map((each) => each.id);
    const from = order.indexOf(category.id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= order.length) return;

    order.splice(to, 0, ...order.splice(from, 1));
    store.reorderCategories([...order, ...archived.map((each) => each.id)]);
  }

  function confirmDelete(category: Category): void {
    Alert.alert(`Delete ${category.name}?`, 'Nothing is tracked against it, so nothing is lost.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => store.deleteCategory(category.id),
      },
    ]);
  }

  return (
    <Screen scrollable gap="xl" testID="manage-categories-screen">
      <Text variant="title" accessibilityRole="header">
        Categories
      </Text>

      {isAdding ? (
        <Card>
          <CategoryEditor
            onCancel={() => setIsAdding(false)}
            onSave={(draft) => {
              store.addCategory(draft);
              setIsAdding(false);
            }}
          />
        </Card>
      ) : (
        <Button label="Add category" icon="add" onPress={() => setIsAdding(true)} fullWidth />
      )}

      <View style={{ gap: theme.spacing.md }}>
        {active.map((category, index) => (
          <Card key={category.id} padding="lg">
            {editingId === category.id ? (
              <CategoryEditor
                existing={category}
                onCancel={() => setEditingId(null)}
                onSave={(draft) => {
                  store.editCategory(category.id, draft);
                  setEditingId(null);
                }}
              />
            ) : (
              <View style={{ gap: theme.spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                  <CategoryTile icon={category.icon} color={category.color} size={ROW_TILE_SIZE} />
                  <Text variant="label" style={{ flex: 1 }} numberOfLines={2}>
                    {category.name}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: theme.spacing.sm,
                  }}
                >
                  <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <IconButton
                      icon="collapse"
                      accessibilityLabel={`Move ${category.name} up`}
                      disabled={index === 0}
                      onPress={() => moveCategory(category, -1)}
                    />
                  </View>
                  <IconButton
                    icon="collapse"
                    accessibilityLabel={`Move ${category.name} down`}
                    disabled={index === active.length - 1}
                    onPress={() => moveCategory(category, 1)}
                  />
                  <IconButton
                    icon="edit"
                    accessibilityLabel={`Edit ${category.name}`}
                    onPress={() => setEditingId(category.id)}
                  />
                  {isCategoryInUse(category.id, snapshot) ? (
                    <IconButton
                      icon="close"
                      accessibilityLabel={`Archive ${category.name}`}
                      onPress={() => store.setCategoryArchived(category.id, true)}
                    />
                  ) : (
                    <IconButton
                      icon="delete"
                      accessibilityLabel={`Delete ${category.name}`}
                      iconColor="errorText"
                      onPress={() => confirmDelete(category)}
                    />
                  )}
                </View>
              </View>
            )}
          </Card>
        ))}
      </View>

      {archived.length > 0 && (
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="overline" color="textTertiary">
            Archived
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            Archived categories keep their history and stay out of the picker.
          </Text>

          {archived.map((category) => (
            <Card key={category.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                <CategoryTile icon={category.icon} color={category.color} size={ROW_TILE_SIZE} />
                <Text variant="label" color="textSecondary" style={{ flex: 1 }}>
                  {category.name}
                </Text>
                <Button
                  label="Restore"
                  variant="secondary"
                  size="small"
                  onPress={() => store.setCategoryArchived(category.id, false)}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
