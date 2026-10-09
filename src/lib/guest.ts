// "Done" marks live only in this browser (localStorage). No accounts, no server storage.
const KEY = 'advent:done:v1';

function read(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export const readDone = (): Record<string, true> => read();
export const isDone = (day: number): boolean => !!read()[String(day)];

export function setDone(day: number, v: boolean) {
  try {
    const all = read();
    if (v) all[String(day)] = true;
    else delete all[String(day)];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}
