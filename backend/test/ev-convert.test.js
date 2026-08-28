const {convertEvs, validateEvs} = require('../src/ev-convert');
const {parse} = require('../src/pokepaste-parser');

test('convert simple 2 / 32 / 32 example', () => {
  const evs = {HP:2, Atk:32, Def:0, SpA:0, SpD:32, Spe:0};
  const v = validateEvs(evs);
  expect(v.ok).toBe(true);
  const r = convertEvs(evs);
  expect(r.ok).toBe(true);
  // Using SP->EV mapping: 2 SP -> 12 EV, 32 SP -> 252 EV each
  expect(r.total).toBe(12 + 252 + 252);
  expect(r.evs.Atk).toBe(252);
  expect(r.evs.SpD).toBe(252);
  expect(r.evs.HP).toBe(12);
});

test('reject invalid evs > 32 or sum > 66', () => {
  const bad1 = {HP:33, Atk:0, Def:0, SpA:0, SpD:0, Spe:0};
  expect(validateEvs(bad1).ok).toBe(false);
  const bad2 = {HP:32, Atk:32, Def:32, SpA:0, SpD:0, Spe:0}; // sum 96
  expect(validateEvs(bad2).ok).toBe(false);
});

test('integration: parse and convert sample raw text', () => {
  const sample = `Great Tusk @ Assault Vest  
Ability: Protosynthesis  
Level: 50  
EVs: 2 HP / 32 Atk / 32 SpD  
Adamant Nature  
- Headlong Rush  
- Knock Off  
- Ice Spinner  
- Rapid Spin
`;
  const sets = parse(sample);
  expect(sets.length).toBe(1);
  const s = sets[0];
  const v = validateEvs(s.evs);
  expect(v.ok).toBe(true);
  const r = convertEvs(s.evs);
  expect(r.ok).toBe(true);
  // Using SP->EV mapping: totals may exceed 508; assert mapped total
  expect(r.total).toBe(12 + 252 + 252);
});
