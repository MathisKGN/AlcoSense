import { browser } from '$app/environment';
import {
	DEFAULT_PROFILE,
	DEFAULT_STOMACH,
	DRINK_PRESETS,
	type Drink,
	type DrinkType,
	type Profile,
	type StomachState
} from './types';
import * as storage from './storage';

export const profile = $state<Profile>({ ...DEFAULT_PROFILE });
export const drinks = $state<Drink[]>([]);
/** Wrapper object so `stomach` stays bindable across modules. */
export const session = $state<{ stomach: StomachState }>({ stomach: DEFAULT_STOMACH });

function nowHHMM(): string {
	const d = new Date();
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function addDrink(type: DrinkType): void {
	const preset = DRINK_PRESETS[type];
	drinks.push({
		id: crypto.randomUUID(),
		type,
		volume: preset.volume,
		degre: preset.degre,
		heure: nowHHMM()
	});
}

export function updateDrink(id: string, patch: Partial<Pick<Drink, 'volume' | 'degre' | 'heure'>>): void {
	const drink = drinks.find((d) => d.id === id);
	if (drink) Object.assign(drink, patch);
}

export function removeDrink(id: string): void {
	const i = drinks.findIndex((d) => d.id === id);
	if (i !== -1) drinks.splice(i, 1);
}

/** Clear drinks only; keep the profile. */
export function resetDrinks(): void {
	drinks.splice(0, drinks.length);
}

if (browser) {
	// Hydrate from storage on the client. Persistence is wired in +layout.svelte
	// (component context) to avoid a module-scope $effect.root.
	Object.assign(profile, storage.loadProfile());
	drinks.splice(0, drinks.length, ...storage.loadDrinks());
	session.stomach = storage.loadStomach();
}
