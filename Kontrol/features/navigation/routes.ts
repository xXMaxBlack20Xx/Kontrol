import type { Href } from 'expo-router';

function toHref(route: string): Href {
  return route as unknown as Href;
}

export function habitDetailHref(habitId: string): Href {
  return toHref(`/(app)/habits/${encodeURIComponent(habitId)}`);
}

export function habitEditHref(habitId: string): Href {
  return toHref(`/(app)/habits/${encodeURIComponent(habitId)}/edit`);
}
