<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { profile, drinks, session } from '$lib/stores.svelte';
	import * as storage from '$lib/storage';

	let { children } = $props();

	// Persist state to localStorage whenever it changes (component context).
	$effect(() => {
		if (browser) storage.saveProfile($state.snapshot(profile));
	});
	$effect(() => {
		if (browser) storage.saveDrinks($state.snapshot(drinks));
	});
	$effect(() => {
		if (browser) storage.saveStomach(session.stomach);
	});
</script>

<header
	class="fixed top-0 right-0 left-0 z-50 border-b border-surface-container/50 bg-surface-bright/90 backdrop-blur-xl"
>
	<div class="mx-auto flex max-w-md items-center justify-between px-6 py-3">
		<span class="text-xl font-bold tracking-tighter text-primary">AlcoSense</span>
		<span class="pulse-dot h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
	</div>
</header>

<main class="min-h-screen pt-20 pb-24">
	<div class="mx-auto max-w-md space-y-5 px-6">
		{@render children()}
	</div>
</main>

<footer
	class="fixed right-0 bottom-0 left-0 border-t border-surface-container bg-surface-bright/80 p-4 backdrop-blur-md"
	style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
>
	<div
		class="mx-auto flex max-w-md items-center justify-between text-[11px] font-bold tracking-widest text-outline uppercase"
	>
		<span>© 2026 AlcoSense</span>
		<span>Estimation indicative</span>
	</div>
</footer>
