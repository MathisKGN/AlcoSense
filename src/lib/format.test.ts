import { describe, it, expect } from 'vitest';
import {
	formatMinuteOfDay,
	formatVolumeCl,
	formatDegre,
	generateChartTicks,
	chartTickStepMin
} from './format';

describe('formatMinuteOfDay', () => {
	it('formats minutes within a day', () => {
		expect(formatMinuteOfDay(0)).toBe('00:00');
		expect(formatMinuteOfDay(18 * 60 + 5)).toBe('18:05');
	});
	it('wraps values outside 0..1439', () => {
		expect(formatMinuteOfDay(1440 + 90)).toBe('01:30');
		expect(formatMinuteOfDay(-30)).toBe('23:30');
	});
});

describe('formatVolumeCl', () => {
	it('converts ml to cl', () => {
		expect(formatVolumeCl(250)).toBe('25 cl');
		expect(formatVolumeCl(125)).toBe('12,5 cl');
	});
});

describe('formatDegre', () => {
	it('formats degree with comma decimal', () => {
		expect(formatDegre(5)).toBe('5 %');
		expect(formatDegre(12.5)).toBe('12,5 %');
	});
});

describe('chartTickStepMin', () => {
	it('uses 15 min for spans up to 4 hours', () => {
		expect(chartTickStepMin(3 * 60)).toBe(15);
	});
	it('uses 30 min for longer spans', () => {
		expect(chartTickStepMin(5 * 60)).toBe(30);
	});
});

describe('generateChartTicks', () => {
	it('returns ticks aligned to step within from..to', () => {
		const from = 18 * 60;
		const to = from + 2 * 60;
		const ticks = generateChartTicks(from, to, 15);
		expect(ticks.length).toBeGreaterThan(0);
		for (const t of ticks) {
			expect(t.tMin % 15).toBe(0);
			expect(t.tMin).toBeGreaterThanOrEqual(from);
			expect(t.tMin).toBeLessThanOrEqual(to);
			expect(t.label).toMatch(/^\d{2}:\d{2}$/);
		}
	});
});
