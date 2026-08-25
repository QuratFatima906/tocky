import { useRouter } from 'expo-router';

import { TasksScreen } from '@/features/tasks/TasksScreen';

export default function TasksRoute() {
  const router = useRouter();

  return <TasksScreen onTrackingStarted={() => router.push('/timer')} />;
}
