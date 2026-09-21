'use client';

import { CharacterCreate } from '@/components/ui/CharacterCreate';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const router = useRouter();

  const handleComplete = (character: any) => {
    router.push(`/game?character=${character.id}`);
  };

  return (
    <div className="min-h-screen bg-fmab-dark flex items-center justify-center p-4">
      <CharacterCreate onComplete={handleComplete} />
    </div>
  );
}