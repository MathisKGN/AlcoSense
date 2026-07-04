<script lang="ts">
	import { profile, drinks, session } from '$lib/stores.svelte';
	import { bacNow, peakFromMinute, buildProjectionTimeline } from '$lib/widmark';
	import BacSummary from '$lib/components/BacSummary.svelte';
	import ProjectionChart from '$lib/components/ProjectionChart.svelte';
	import QuickAdd from '$lib/components/QuickAdd.svelte';
	import DrinkList from '$lib/components/DrinkList.svelte';
	import ProfileForm from '$lib/components/ProfileForm.svelte';

	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(id);
	});

	const nowMin = $derived(now.getHours() * 60 + now.getMinutes());
	const bac = $derived(bacNow(drinks, profile, session.stomach, now));
	const peak = $derived(peakFromMinute(drinks, profile, session.stomach, nowMin));
	const timeline = $derived(
		buildProjectionTimeline(drinks, profile, session.stomach, nowMin)
	);
	const limit = $derived(timeline.limit);
	const driveMin = $derived(timeline.driveMin);
</script>

<div class="space-y-4">
	<BacSummary {bac} {peak} {limit} {driveMin} {nowMin} />
	<QuickAdd />
	<DrinkList />
	<ProjectionChart {timeline} />
	<ProfileForm />
</div>
