const {convertEvs, validateEvs} = require('../src/ev-convert');

test('convert simple 2 / 32 / 32 example', () => {
  const evs = {HP:2, Atk:32, Def:0, SpA:0, SpD:32, Spe:0};
  const v = validateEvs(evs);
  expect(v.ok).toBe(true);
  const r = convertEvs(evs);
  expect(r.ok).toBe(true);
  // Expect totals and that Atk and SpD are large and none exceed 252
  expect(r.total).toBe(508);
  expect(r.evs.Atk).toBeLessThanOrEqual(252);
  expect(r.evs.SpD).toBeLessThanOrEqual(252);
  // For this particular sample we expect roughly: HP ~16, Atk ~246, SpD ~246 (sum 508)
  expect(r.evs.HP).toBe(16);
  expect(r.evs.Atk).toBe(246);
  expect(r.evs.SpD).toBe(246);
});

test('reject invalid evs > 32 or sum > 66', () => {
  const bad1 = {HP:33, Atk:0, Def:0, SpA:0, SpD:0, Spe:0};
  expect(validateEvs(bad1).ok).toBe(false);
  const bad2 = {HP:32, Atk:32, Def:32, SpA:0, SpD:0, Spe:0}; // sum 96
  expect(validateEvs(bad2).ok).toBe(false);
});
