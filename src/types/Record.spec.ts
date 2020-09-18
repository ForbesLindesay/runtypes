import * as ta from 'type-assertions';
import { Record, String, Number, Literal, Union, Object } from '..';

const recordType = Object({ value: Literal(42) });
const record = { value: 42 };

test('StringRecord', () => {
  const dictionary = Record(String, recordType);
  ta.assert<
    ta.Equal<ReturnType<typeof dictionary['check']>, { [key in string]?: { value: 42 } }>
  >();
  expect(dictionary.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "bar": Object {
          "value": 42,
        },
        "foo": Object {
          "value": 42,
        },
      },
    }
  `);
  expect(dictionary.safeParse({ foo: record, bar: { value: 24 } })).toMatchInlineSnapshot(`
    Object {
      "key": "bar.value",
      "message": "Expected literal 42, but was 24",
      "success": false,
    }
  `);
});

test('NumberRecord', () => {
  const dictionary = Record(Number, recordType);
  ta.assert<
    ta.Equal<ReturnType<typeof dictionary['check']>, { [key in number]?: { value: 42 } }>
  >();
  expect(dictionary.safeParse({ 4: record, 3.14: record })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "3.14": Object {
          "value": 42,
        },
        "4": Object {
          "value": 42,
        },
      },
    }
  `);
  expect(dictionary.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    Object {
      "message": "Expected record key to be a number, but was \\"foo\\"",
      "success": false,
    }
  `);
});

test('IntegerRecord', () => {
  const dictionary = Record(
    Number.withConstraint(v => v === Math.floor(v), { name: 'Integer' }),
    recordType,
  );
  ta.assert<
    ta.Equal<ReturnType<typeof dictionary['check']>, { [key in number]?: { value: 42 } }>
  >();
  expect(dictionary.safeParse({ 4: record, 2: record })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "2": Object {
          "value": 42,
        },
        "4": Object {
          "value": 42,
        },
      },
    }
  `);
  expect(dictionary.safeParse({ 4: record, 3.14: record })).toMatchInlineSnapshot(`
    Object {
      "message": "Expected record key to be Integer, but was \\"3.14\\"",
      "success": false,
    }
  `);
});

test('UnionRecord - strings', () => {
  const dictionary = Record(Union(Literal('foo'), Literal('bar')), recordType);
  ta.assert<
    ta.Equal<ReturnType<typeof dictionary['check']>, { [key in 'foo' | 'bar']?: { value: 42 } }>
  >();
  expect(dictionary.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "bar": Object {
          "value": 42,
        },
        "foo": Object {
          "value": 42,
        },
      },
    }
  `);
  expect(dictionary.safeParse({ 10: record })).toMatchInlineSnapshot(`
    Object {
      "message": "Expected record key to be \\"foo\\" | \\"bar\\", but was \\"10\\"",
      "success": false,
    }
  `);
});
test('UnionRecord - numbers', () => {
  const dictionary = Record(Union(Literal(24), Literal(42)), recordType);
  ta.assert<
    ta.Equal<ReturnType<typeof dictionary['check']>, { [key in 24 | 42]?: { value: 42 } }>
  >();
  expect(dictionary.safeParse({ 24: record, 42: record })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "24": Object {
          "value": 42,
        },
        "42": Object {
          "value": 42,
        },
      },
    }
  `);
  expect(dictionary.safeParse({ 10: record })).toMatchInlineSnapshot(`
    Object {
      "message": "Expected record key to be 24 | 42, but was \\"10\\"",
      "success": false,
    }
  `);
});
test('UnionRecord - mixed', () => {
  const dictionary = Record(Union(Literal('foo'), Literal(42)), recordType);
  ta.assert<
    ta.Equal<ReturnType<typeof dictionary['check']>, { [key in 'foo' | 42]?: { value: 42 } }>
  >();
  expect(dictionary.safeParse({ foo: record, 42: record })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "42": Object {
          "value": 42,
        },
        "foo": Object {
          "value": 42,
        },
      },
    }
  `);
  expect(dictionary.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    Object {
      "message": "Expected record key to be \\"foo\\" | 42, but was \\"bar\\"",
      "success": false,
    }
  `);
});

test('Deprecated usage as object', () => {
  const obj = Record({ value: String });
  ta.assert<ta.Equal<ReturnType<typeof obj['check']>, { value: string }>>();
  expect(obj.safeParse({ value: 'foo' })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "value": "foo",
      },
    }
  `);
  expect(obj.safeParse({ value: 24 })).toMatchInlineSnapshot(`
    Object {
      "fullError": Array [
        "Unable to assign {value: 24} to { value: string; }",
        Array [
          "The types of \\"value\\" are not compatible",
          Array [
            "Expected string, but was 24",
          ],
        ],
      ],
      "key": "value",
      "message": "Expected string, but was 24",
      "success": false,
    }
  `);
});