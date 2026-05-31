export type Sexe = 'homme' | 'femme';
export type StomachState = 'vide' | 'grignote' | 'repas';
export type DrinkType = 'biere' | 'vin' | 'shot' | 'cocktail' | 'spiritueux';

export interface Profile {
	poids: number; // kg
	sexe: Sexe;
	jeunePermis: boolean;
}

export interface Drink {
	id: string;
	type: DrinkType;
	volume: number; // ml
	degre: number; // % vol
	heure: string; // "HH:MM" 24h, time of day
}

export interface DrinkPreset {
	label: string;
	icon: string; // Material Symbols name
	volume: number; // ml
	degre: number; // % vol
}

/** Spec presets (editable after add). Volumes in ml. */
export const DRINK_PRESETS: Record<DrinkType, DrinkPreset> = {
	biere: { label: 'Bière', icon: 'sports_bar', volume: 250, degre: 5 },
	vin: { label: 'Vin', icon: 'wine_bar', volume: 125, degre: 12 },
	shot: { label: 'Shot', icon: 'liquor', volume: 30, degre: 40 },
	cocktail: { label: 'Cocktail', icon: 'local_bar', volume: 100, degre: 15 },
	spiritueux: { label: 'Spiritueux', icon: 'glass_full', volume: 40, degre: 40 }
};

/** Widmark distribution coefficient r. */
export const WIDMARK_R: Record<Sexe, number> = { homme: 0.7, femme: 0.6 };

/** Linear-rise duration (minutes) by stomach state. */
export const STOMACH_RISE_MIN: Record<StomachState, number> = {
	vide: 30,
	grignote: 60,
	repas: 90
};

export const STOMACH_LABELS: Record<StomachState, { title: string; desc: string }> = {
	vide: { title: 'À jeun', desc: 'Absorption maximale' },
	grignote: { title: 'A grignoté', desc: 'Absorption modérée' },
	repas: { title: 'Repas complet', desc: 'Absorption ralentie' }
};

/** Ethanol density (g/ml). */
export const ETHANOL_DENSITY = 0.789;

/** Elimination rate (g/L per hour). */
export const ELIMINATION_RATE = 0.15;

export const DEFAULT_PROFILE: Profile = {
	poids: 75,
	sexe: 'homme',
	jeunePermis: false
};

export const DEFAULT_STOMACH: StomachState = 'vide';

/** Legal BAC limit (g/L). */
export function legalLimit(jeunePermis: boolean): number {
	return jeunePermis ? 0.2 : 0.5;
}
