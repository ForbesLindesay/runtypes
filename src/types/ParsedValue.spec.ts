import * as ta from 'type-assertions';
import { String, Number, ParsedValue, Static, Literal, Record, Union } from '..';
import { InstanceOf } from './instanceof';

test('TrimmedString', () => {
  const TrimmedString = ParsedValue(String, {
    name: 'TrimmedString',
    parse(value) {
      return { success: true, value: value.trim() };
    },
    test: String.withConstraint(
      value =>
        value.trim() === value || `Expected the string to be trimmed, but this one has whitespace`,
    ),
  });

  expect(TrimmedString.safeParse(' foo bar ')).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": "foo bar",
    }
  `);
  expect(TrimmedString.safeParse(42)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected string, but was number",
      "success": false,
    }
  `);

  expect(() => TrimmedString.assert(' foo bar ')).toThrowErrorMatchingInlineSnapshot(
    `"Expected the string to be trimmed, but this one has whitespace"`,
  );
  expect(() => TrimmedString.assert('foo bar')).not.toThrow();
});

test('DoubledNumber', () => {
  const DoubledNumber = ParsedValue(Number, {
    name: 'DoubledNumber',
    parse(value) {
      return { success: true, value: value * 2 };
    },
    test: Number.withConstraint(value => value % 2 === 0 || `Expected an even number`),
  });

  expect(DoubledNumber.safeParse(10)).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": 20,
    }
  `);

  expect(() => DoubledNumber.assert(11)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an even number"`,
  );
  expect(() => DoubledNumber.assert(12)).not.toThrow();

  expect(DoubledNumber.safeSerialize(10)).toMatchInlineSnapshot(`
    Object {
      "message": "DoubledNumber does not support Runtype.serialize",
      "success": false,
    }
  `);
});

test('DoubledNumber - 2', () => {
  const DoubledNumber = Number.withParser({
    name: 'DoubledNumber',
    parse(value) {
      return { success: true, value: value * 2 };
    },
    test: Number.withConstraint(value => value % 2 === 0 || `Expected an even number`),
    serialize(value) {
      return { success: true, value: value / 2 };
    },
  });

  expect(DoubledNumber.safeParse(10)).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": 20,
    }
  `);

  expect(() => DoubledNumber.assert(11)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an even number"`,
  );
  expect(() => DoubledNumber.assert(12)).not.toThrow();

  expect(DoubledNumber.safeSerialize(10)).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": 5,
    }
  `);

  expect(DoubledNumber.safeSerialize(11)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected an even number",
      "success": false,
    }
  `);
});

test('Upgrade Example', () => {
  const ShapeV1 = Record({ version: Literal(1), size: Number });
  const ShapeV2 = Record({ version: Literal(2), width: Number, height: Number });
  const Shape = Union(
    ShapeV1.withParser({
      parse: ({ size }) => ({
        success: true,
        value: { version: 2 as const, width: size, height: size },
      }),
    }),
    ShapeV2,
  );
  type X = Static<typeof Shape>;
  ta.assert<ta.Equal<X, { version: 2; width: number; height: number }>>();
  expect(Shape.parse({ version: 1, size: 42 })).toEqual({ version: 2, width: 42, height: 42 });
  expect(Shape.parse({ version: 2, width: 10, height: 20 })).toEqual({
    version: 2,
    width: 10,
    height: 20,
  });
  expect(Shape.safeSerialize({ version: 2, width: 10, height: 20 })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "height": 20,
        "version": 2,
        "width": 10,
      },
    }
  `);
  expect(Shape.safeSerialize({ version: 1, size: 20 } as any)).toMatchInlineSnapshot(`
    Object {
      "key": "<version: 1>",
      "message": "ParsedValue<{ version: 1; size: number; }> does not support Runtype.serialize",
      "success": false,
    }
  `);
});

test('URL', () => {
  const URLString = ParsedValue(String, {
    name: 'URLString',
    parse(value) {
      try {
        return { success: true, value: new URL(value) };
      } catch (ex) {
        return { success: false, message: `Expected a valid URL but got '${value}'` };
      }
    },
    test: InstanceOf(URL),
  });

  expect(URLString.safeParse('https://example.com')).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": "https://example.com/",
    }
  `);
  expect(URLString.safeParse(42)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected string, but was number",
      "success": false,
    }
  `);
  expect(URLString.safeParse('not a url')).toMatchInlineSnapshot(`
    Object {
      "message": "Expected a valid URL but got 'not a url'",
      "success": false,
    }
  `);
});
