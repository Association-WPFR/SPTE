import { describe, expect, it } from 'vitest';
import { createDefaultSettings, settingsToFormValues, formValuesToSettings } from './settings';

describe('createDefaultSettings', () => {
	it('retourne la forme complète par défaut', () => {
		expect(createDefaultSettings()).toEqual({
			spteColorWord: '',
			spteColorQuote: '',
			spteColorChar: '',
			spteBlackToolTip: 'true',
			spteBetterReadability: '',
			spteFrenchFlag: 'true',
			spteEnlargeTable: 'true',
			spteGpcontentBig: '',
			spteActiveGlossary: 'true',
			spteLastUpdateGlossary: '',
			spteGlossary: '',
			spteStrictNarrowSpace: '',
		});
	});

	it('fusionne les overrides sans toucher aux autres clés', () => {
		const settings = createDefaultSettings({ spteLastUpdateGlossary: '2026-09-15', spteGlossary: ['plugin'] });
		expect(settings.spteLastUpdateGlossary).toBe('2026-09-15');
		expect(settings.spteGlossary).toEqual(['plugin']);
		expect(settings.spteFrenchFlag).toBe('true');
	});
});

describe('settingsToFormValues', () => {
	it('ne remplit que les champs présents (non vides) dans les réglages stockés', () => {
		const { values } = settingsToFormValues(createDefaultSettings());
		expect(values.colorWord).toBeUndefined();
		expect(values.betterReadability).toBeUndefined();
	});

	it('applique les couleurs et booléens explicitement stockés', () => {
		const settings = createDefaultSettings({ spteColorWord: '#123456', spteBlackToolTip: 'false', spteBetterReadability: 'true' });
		const { values } = settingsToFormValues(settings);
		expect(values.colorWord).toBe('#123456');
		expect(values.blackToolTip).toBe(false);
		expect(values.betterReadability).toBe(true);
	});

	it('frenchFlag manquant : défaut à true et signale une migration nécessaire', () => {
		const settings = createDefaultSettings({ spteFrenchFlag: '' });
		const { values, needsFrenchFlagMigration } = settingsToFormValues(settings);
		expect(values.frenchFlag).toBe(true);
		expect(needsFrenchFlagMigration).toBe(true);
	});

	it('frenchFlag présent : pas de migration nécessaire, même à false', () => {
		const settings = createDefaultSettings({ spteFrenchFlag: 'false' });
		const { values, needsFrenchFlagMigration } = settingsToFormValues(settings);
		expect(values.frenchFlag).toBe(false);
		expect(needsFrenchFlagMigration).toBe(false);
	});

	it('enlargeTable/gpcontentBig manquants retombent sur leurs défauts respectifs (true/false)', () => {
		const settings = createDefaultSettings({ spteEnlargeTable: '', spteGpcontentBig: '' });
		const { values } = settingsToFormValues(settings);
		expect(values.enlargeTable).toBe(true);
		expect(values.gpcontentBig).toBe(false);
	});

	it('strictNarrowSpace : seul "true" explicite coche la case', () => {
		expect(settingsToFormValues(createDefaultSettings({ spteStrictNarrowSpace: 'true' })).values.strictNarrowSpace).toBe(true);
		expect(settingsToFormValues(createDefaultSettings({ spteStrictNarrowSpace: '' })).values.strictNarrowSpace).toBe(false);
		expect(settingsToFormValues(createDefaultSettings({ spteStrictNarrowSpace: 'false' })).values.strictNarrowSpace).toBe(false);
	});
});

describe('formValuesToSettings', () => {
	it('convertit chaque booléen de formulaire en "true"/"false" stocké', () => {
		const settings = formValuesToSettings(createDefaultSettings(), {
			colorWord: '#ff0000',
			colorQuote: '#ff0000',
			colorChar: '#ff00ff',
			blackToolTip: false,
			betterReadability: true,
			frenchFlag: true,
			enlargeTable: false,
			gpcontentBig: true,
			gpActiveGlossary: false,
			strictNarrowSpace: true,
		});
		expect(settings.spteBlackToolTip).toBe('false');
		expect(settings.spteBetterReadability).toBe('true');
		expect(settings.spteEnlargeTable).toBe('false');
		expect(settings.spteStrictNarrowSpace).toBe('true');
	});

	it('préserve les clés hors formulaire (glossaire) venant des réglages existants', () => {
		const existing = createDefaultSettings({ spteLastUpdateGlossary: '2026-09-15', spteGlossary: ['plugin'] });
		const settings = formValuesToSettings(existing, {
			colorWord: '#ff0000',
			colorQuote: '#ff0000',
			colorChar: '#ff00ff',
			blackToolTip: true,
			betterReadability: false,
			frenchFlag: true,
			enlargeTable: true,
			gpcontentBig: false,
			gpActiveGlossary: true,
			strictNarrowSpace: false,
		});
		expect(settings.spteLastUpdateGlossary).toBe('2026-09-15');
		expect(settings.spteGlossary).toEqual(['plugin']);
	});
});
