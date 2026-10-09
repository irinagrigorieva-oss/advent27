'use client';
import { useRouter } from 'next/navigation';

export default function TzToggle({ calendarTz, active }: { calendarTz: string; active: boolean }) {
  const router = useRouter();
  function set(useLocal: boolean) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = useLocal
      ? `advent_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
      : 'advent_tz=; path=/; max-age=0';
    router.refresh();
  }
  return (
    <button className="underline hover:text-rose" onClick={() => set(!active)}>
      {active ? `Использовать время календаря (${calendarTz})` : 'Использовать мой часовой пояс'}
    </button>
  );
}
