import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './settings';

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
