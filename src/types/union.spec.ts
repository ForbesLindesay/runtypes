import { Union, String, Literal, Record, Number, InstanceOf, Tuple } from '..';

const ThreeOrString = Union(Literal(3), String);

describe('union', () => {
  describe('match', () => {
    it('works with exhaustive cases', () => {
      const match = ThreeOrString.match(
        three => three + 5,
        str => str.length * 4,
      );
      expect(match(3)).toBe(8);
      expect(match('hello')).toBe(20);
    });
  });

  describe('discriminated union', () => {
    it('should pick correct alternative with typescript docs example', () => {
      const Square = Record({ kind: Literal('square'), size: Number });
      const Rectangle = Record({ kind: Literal('rectangle'), width: Number, height: Number });
      const Circle = Record({ kind: Literal('circle'), radius: Number });

      const Shape = Union(Square, Rectangle, Circle);

      expect(Shape.validate({ kind: 'square', size: new Date() })).toMatchInlineSnapshot(`
        Object {
          "key": "size",
          "message": "Expected number, but was object",
          "success": false,
        }
      `);

      expect(Shape.validate({ kind: 'rectangle', size: new Date() })).toMatchInlineSnapshot(`
        Object {
          "key": "width",
          "message": "Expected number, but was undefined",
          "success": false,
        }
      `);

      expect(Shape.validate({ kind: 'circle', size: new Date() })).toMatchInlineSnapshot(`
        Object {
          "key": "radius",
          "message": "Expected number, but was undefined",
          "success": false,
        }
      `);

      expect(Shape.validate({ kind: 'other', size: new Date() })).toMatchInlineSnapshot(`
        Object {
          "key": "kind",
          "message": "Expected 'square' | 'rectangle' | 'circle', but was 'other'",
          "success": false,
        }
      `);
    });

    it('should not pick alternative if the discriminant is not unique', () => {
      const Square = Record({ kind: Literal('square'), size: Number });
      const Rectangle = Record({ kind: Literal('rectangle'), width: Number, height: Number });
      const CircularSquare = Record({ kind: Literal('square'), radius: Number });

      const Shape = Union(Square, Rectangle, CircularSquare);

      expect(Shape.validate({ kind: 'square', size: new Date() })).not.toHaveProperty('key');
    });

    it('should not pick alternative if not all types are records', () => {
      const Square = Record({ kind: Literal('square'), size: Number });
      const Rectangle = Record({ kind: Literal('rectangle'), width: Number, height: Number });

      const Shape = Union(Square, Rectangle, InstanceOf(Date));

      expect(Shape.validate({ kind: 'square', size: new Date() })).not.toHaveProperty('key');
    });

    it('should handle tuples where the first component is a literal tag', () => {
      const Square = Tuple(Literal('square'), Record({ size: Number }));
      const Rectangle = Tuple(Literal('rectangle'), Record({ width: Number, height: Number }));
      const Circle = Tuple(Literal('circle'), Record({ radius: Number }));

      const Shape = Union(Square, Rectangle, Circle);

      expect(Shape.validate(['square', { size: new Date() }])).toMatchInlineSnapshot(`
        Object {
          "key": "[1].size",
          "message": "Expected number, but was object",
          "success": false,
        }
      `);

      expect(Shape.validate(['rectangle', { size: new Date() }])).toMatchInlineSnapshot(`
        Object {
          "key": "[1].width",
          "message": "Expected number, but was undefined",
          "success": false,
        }
      `);

      expect(Shape.validate(['circle', { size: new Date() }])).toMatchInlineSnapshot(`
        Object {
          "key": "[1].radius",
          "message": "Expected number, but was undefined",
          "success": false,
        }
      `);

      expect(Shape.validate(['other', { size: new Date() }])).toMatchInlineSnapshot(`
        Object {
          "key": "[0]",
          "message": "Expected 'square' | 'rectangle' | 'circle', but was 'other'",
          "success": false,
        }
      `);
    });
  });
});
