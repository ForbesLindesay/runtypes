import { Object as ObjectType, String } from '..';

test('pick', () => {
  const CrewMember = ObjectType({
    name: String,
    rank: String,
    home: String,
  });
  const PetMember = CrewMember.pick('name', 'home');

  expect(Object.keys(PetMember.fields)).toEqual(['name', 'home']);
  expect(PetMember.safeParse({ name: 'my name', home: 'my home' })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "home": "my home",
        "name": "my name",
      },
    }
  `);
});

test('omit', () => {
  const CrewMember = ObjectType({
    name: String,
    rank: String,
    home: String,
  });
  const PetMember = CrewMember.omit('rank');

  expect(Object.keys(PetMember.fields)).toEqual(['name', 'home']);
  expect(PetMember.safeParse({ name: 'my name', home: 'my home' })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "home": "my home",
        "name": "my name",
      },
    }
  `);
});
