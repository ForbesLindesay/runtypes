import * as ta from 'type-assertions';
import {
  Array,
  String,
  Number,
  ParsedValue,
  Static,
  Literal,
  Record,
  Union,
  Tuple,
  Codec,
} from '..';
import show from '../show';
import { InstanceOf } from './instanceof';
import { Lazy } from './lazy';

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

  expect(Shape.serialize({ version: 2, width: 10, height: 20 })).toMatchInlineSnapshot(`
    Object {
      "height": 20,
      "version": 2,
      "width": 10,
    }
  `);
  expect(() => Shape.serialize({ version: 1, size: 20 } as any)).toThrowErrorMatchingInlineSnapshot(
    `"ParsedValue<{ version: 1; size: number; }> does not support Runtype.serialize in <version: 1>"`,
  );
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

  const value: URL = URLString.parse('https://example.com');
  expect(value).toBeInstanceOf(URL);
  expect(value).toMatchInlineSnapshot(`"https://example.com/"`);
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

test('test is optional', () => {
  const TrimmedString = ParsedValue<String, string>(String, {
    name: 'TrimmedString',
    parse(value) {
      return { success: true, value: value.trim() };
    },
    serialize(value) {
      // we're trusting the backend here, because there is no test!
      return { success: true, value };
    },
  });
  expect(() => TrimmedString.assert('foo bar')).toThrowErrorMatchingInlineSnapshot(
    `"TrimmedString does not support Runtype.test"`,
  );
  expect(TrimmedString.safeSerialize(' value ')).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": " value ",
    }
  `);
  // even though we're not testing before serialize, the value is still
  // validated after it has been serialized
  expect(TrimmedString.safeSerialize(42 as any)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected string, but was number",
      "success": false,
    }
  `);
  expect(show(TrimmedString)).toMatchInlineSnapshot(`"TrimmedString"`);
  const AnonymousStringTrim = ParsedValue(String, {
    parse(value) {
      return { success: true, value: value.trim() };
    },
  });
  expect(() => AnonymousStringTrim.assert('foo bar')).toThrowErrorMatchingInlineSnapshot(
    `"ParsedValue<string> does not support Runtype.test"`,
  );
  expect(show(AnonymousStringTrim)).toMatchInlineSnapshot(`"ParsedValue<string>"`);
});

test('serialize can return an error', () => {
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
    serialize(value) {
      if (value.protocol === 'https:') return { success: true, value: value.href };
      else return { success: false, message: `Refusing to serialize insecure URL: ${value.href}` };
    },
  });

  expect(URLString.safeSerialize(new URL('https://example.com'))).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": "https://example.com/",
    }
  `);
  expect(URLString.safeSerialize(new URL('http://example.com'))).toMatchInlineSnapshot(`
    Object {
      "message": "Refusing to serialize insecure URL: http://example.com/",
      "success": false,
    }
  `);
});

test('Handle Being Within Cycles', () => {
  const TrimmedString = ParsedValue(String, {
    name: 'TrimmedString',
    parse(value) {
      return { success: true, value: value.trim() };
    },
    test: String.withConstraint(
      value =>
        value.trim() === value || `Expected the string to be trimmed, but this one has whitespace`,
    ),
    serialize(value) {
      return { success: true, value: ` ${value} ` };
    },
  });
  type RecursiveType = [string, RecursiveType];
  const RecursiveType: Codec<RecursiveType> = Lazy(() => Tuple(TrimmedString, RecursiveType));

  const example = [' hello world ', undefined as any] as RecursiveType;
  example[1] = example;

  const expected = ['hello world', undefined as any] as RecursiveType;
  expected[1] = expected;

  const parsed = RecursiveType.parse(example);
  expect(parsed).toEqual(expected);

  const serialized = RecursiveType.serialize(parsed);
  expect(serialized).toEqual(example);

  expect(() => RecursiveType.assert(parsed)).not.toThrow();
  expect(() => RecursiveType.assert(serialized)).toThrowErrorMatchingInlineSnapshot(
    `"Expected the string to be trimmed, but this one has whitespace in [0]"`,
  );
  // const RecursiveType = Tuple(Literal(1));
});

test('Handle Being Outside Cycles', () => {
  type RecursiveTypePreParse = (string | RecursiveTypePreParse)[];
  type RecursiveType = RecursiveType[];
  const RecursiveTypeWithoutParse: Codec<RecursiveType> = Lazy(() => Array(RecursiveType));
  const RecursiveType: Codec<RecursiveType, RecursiveTypePreParse> = Lazy(() =>
    Array(Union(String, RecursiveType)).withParser({
      parse(arr) {
        // To use parse on data containing cycles, you have to mutate the existing value
        // normally this is not advised, as it's harder to do without introducing bugs.
        // You also cannot safely do this if there are any parsed types in the underlying type.
        // Essetially, please don't do this!
        arr.splice(
          0,
          arr.length,
          ...arr.filter(<T>(value: T): value is Exclude<T, string> => typeof value !== 'string'),
        );
        return {
          success: true,
          value: arr as RecursiveType,
        };
      },
      serialize(arr: RecursiveType) {
        return { success: true, value: arr };
      },
      test: RecursiveTypeWithoutParse,
    }),
  );

  const example: RecursiveTypePreParse = ['hello world'];
  example.push(example);

  const expected: RecursiveType = [];
  expected.push(expected);

  const parsed = RecursiveType.parse(example);
  expect(parsed).toEqual(expected);

  const serialized = RecursiveType.serialize(parsed);
  expect(serialized).toEqual(example);

  expect(() => RecursiveType.assert(parsed)).not.toThrow();
  expect(() => RecursiveType.assert(serialized)).not.toThrow();
});
