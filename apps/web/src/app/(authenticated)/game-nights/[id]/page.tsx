import { GameNightPlanningLayout } from '@/components/game-nights/GameNightPlanningLayout';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GameNightDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <GameNightPlanningLayout title={`Serata ${id}`} />
    </div>
  );
}
