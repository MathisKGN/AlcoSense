<script lang="ts">
	import { profile, session } from '$lib/stores.svelte';
	import { STOMACH_LABELS, type Sexe, type StomachState } from '$lib/types';

	const stomachStates = Object.keys(STOMACH_LABELS) as StomachState[];

	function genderClass(sexe: Sexe): string {
		return profile.sexe === sexe
			? 'flex-1 rounded-full py-2.5 text-[13px] font-bold bg-primary text-white shadow-md transition-all'
			: 'flex-1 rounded-full py-2.5 text-[13px] font-bold text-outline-variant transition-all hover:text-on-surface';
	}
</script>

<section class="glass-card space-y-6 rounded-3xl p-6">
	<h3 class="text-[13px] font-bold tracking-wider text-outline uppercase">Configuration profil</h3>

	<!-- Genre -->
	<div>
		<label class="mb-3 block text-[11px] font-bold text-outline uppercase">Genre</label>
		<div class="flex rounded-full border border-surface-container bg-white p-1">
			<button type="button" class={genderClass('homme')} onclick={() => (profile.sexe = 'homme')}>
				Homme
			</button>
			<button type="button" class={genderClass('femme')} onclick={() => (profile.sexe = 'femme')}>
				Femme
			</button>
		</div>
	</div>

	<!-- Poids -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<label for="weight" class="text-[11px] font-bold text-outline uppercase">Poids corporel</label>
			<span class="rounded-full bg-primary-container/10 px-3 py-1 text-sm font-bold text-primary"
				>{profile.poids} kg</span
			>
		</div>
		<input
			id="weight"
			type="range"
			min="40"
			max="150"
			bind:value={profile.poids}
			class="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-container accent-primary"
		/>
	</div>

	<!-- État estomac -->
	<div>
		<label class="mb-3 block text-[11px] font-bold text-outline uppercase">État de l'estomac</label>
		<div class="grid grid-cols-1 gap-2">
			{#each stomachStates as state (state)}
				<button
					type="button"
					onclick={() => (session.stomach = state)}
					class="rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:border-primary/50 {session.stomach ===
					state
						? 'border-primary/50 ring-2 ring-primary/20'
						: 'border-white'}"
				>
					<span class="mb-1 block text-sm leading-none font-bold">{STOMACH_LABELS[state].title}</span>
					<span class="text-[11px] text-outline">{STOMACH_LABELS[state].desc}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Jeune conducteur -->
	<div class="flex items-center justify-between rounded-2xl border border-surface-container bg-white p-4">
		<div class="flex flex-col">
			<span class="text-sm font-bold text-on-surface">Jeune conducteur</span>
			<span class="text-[11px] text-outline">Limite réduite à 0,2 g/L</span>
		</div>
		<label class="relative inline-flex cursor-pointer items-center">
			<input type="checkbox" bind:checked={profile.jeunePermis} class="peer sr-only" />
			<div
				class="peer h-6 w-11 rounded-full bg-surface-container after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"
			></div>
		</label>
	</div>
</section>
