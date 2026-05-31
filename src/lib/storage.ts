import { browser } from '$app/environment';
import {
	DEFAULT_PROFILE,
	DEFAULT_STOMACH,
	type Drink,
	type Profile,
	type StomachState
} from './types';

const KEY_PROFILE = 'alcosense:profile';
const KEY_DRINKS = 'alcosense:drinks';
const KEY_STOMACH = 'alcosense:stomach';

function read<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	const raw = localStorage.getItem(key);
	if (!raw) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown): void {
	if (!browser) return;
	localStorage.setItem(key, JSON.stringify(value));
}

export function loadProfile(): Profile {
	return { ...DEFAULT_PROFILE, ...read<Partial<Profile>>(KEY_PROFILE, {}) };
}
export function saveProfile(profile: Profile): void {
	write(KEY_PROFILE, profile);
}

export function loadDrinks(): Drink[] {
	return read<Drink[]>(KEY_DRINKS, []);
}
export function saveDrinks(drinks: Drink[]): void {
	write(KEY_DRINKS, drinks);
}

export function loadStomach(): StomachState {
	return read<StomachState>(KEY_STOMACH, DEFAULT_STOMACH);
}
export function saveStomach(stomach: StomachState): void {
	write(KEY_STOMACH, stomach);
}
