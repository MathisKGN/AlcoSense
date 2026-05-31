<script lang="ts">
	import { profile, drinks, session } from '$lib/stores.svelte';
	import { bacNow, driveTimeMinute } from '$lib/widmark';
	import { legalLimit } from '$lib/types';
	import BacPanel from '$lib/components/BacPanel.svelte';
	import ProjectionChart from '$lib/components/ProjectionChart.svelte';
	import QuickAdd from '$lib/components/QuickAdd.svelte';
	import DrinkList from '$lib/components/DrinkList.svelte';
	import ProfileForm from '$lib/components/ProfileForm.svelte';

	// Live clock: re-evaluate every minute so the estimate stays current.
	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(id);
	});

	const nowMin = $derived(now.getHours() * 60 + now.getMinutes());
	const limit = $derived(legalLimit(profile.jeunePermis));
	const bac = $derived(bacNow(drinks, profile, session.stomach, now));
	const driveMin = $derived(driveTimeMinute(drinks, profile, session.stomach, nowMin));
</script>

<BacPanel {bac} {limit} {driveMin} {nowMin} />
<ProjectionChart {drinks} {profile} stomach={session.stomach} {limit} {nowMin} {driveMin} />

<section class="space-y-4">
	<QuickAdd />
	<DrinkList />
</section>

<ProfileForm />
