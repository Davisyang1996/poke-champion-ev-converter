const {parse} = require('../src/pokepaste-parser');

const sample = `Great Tusk @ Assault Vest  
Ability: Protosynthesis  
Level: 50  
EVs: 2 HP / 32 Atk / 32 SpD  
Adamant Nature  
- Headlong Rush  
- Knock Off  
- Ice Spinner  
- Rapid Spin

Darkrai @ Choice Specs  
Ability: Bad Dreams  
Level: 50  
EVs: 4 HP / 1 Def / 32 SpA / 29 Spe  
Timid Nature  
- Ice Beam  
- Dark Pulse  
- Incinerate  
- Focus Blast
`;

test('parse sample pokepaste into sets', () => {
  const sets = parse(sample);
  expect(sets.length).toBeGreaterThanOrEqual(2);
  const g = sets[0];
  expect(g.name).toMatch(/Great Tusk/i);
  expect(g.item).toMatch(/Assault Vest/i);
  expect(g.ability).toMatch(/Protosynthesis/i);
  expect(g.evs.HP).toBe(2);
  expect(g.evs.Atk).toBe(32);
  expect(g.evs.SpD).toBe(32);
  expect(g.moves.length).toBe(4);
});
