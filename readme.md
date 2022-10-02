# `hedgerow`

`hedgerow` is a small library written in TypeScript for constructing polymorphic functions on constrained sequences of arguments. These sequences of arguments being referred to as *hedges* or *hedge variables*. This means all parameters have a `range` property and all functions on these parameters are functions on sequences of arrays. Refer to the [documentation](https://github.com/stratagyn/hedgerow/blob/master/documentation.pdf) for further guidance and examples.

### Installation

```
npm install hedgerow
```

### A First Example:

```ts
import {Operator, PolymorphicOperator} from "hedgerow"

const con = new PolymorphicOperator();

con.implement(
  new Operator(
    new Parameter({
      in: "number", 
	  requires: n => n >= 0 && !(/[0-9]*\.[0-9]+/.test('' + n)),
	  range: -1}),
  (nums: number[], [sep]: string[]) => parseInt(nums.join(sep))));

con.implement(
  new Operator(
	[new Parameter("string"), 
	 new Parameter({in: "string", range: -1})],
	([sep]: string[], strs: string[]) => strs.join(sep)));

con.implement(
  new Operator(
	{requires: Array.isArray, range: -1},
	(objs: any[][]) => objs.flat()));

con.implement(
  new Operator(
    {in: Map, range: 2},
  ([l, r]: Map<any, any>[]) => 
    [...l.entries(), ...r.entries()]
	    .reduce((map, [k, v]) => map.set(k, v), new Map())));
	    
con([1,2,3,4]); //1234
con([" "], ["hello", "world"]); //'hello world'
con([[1, 2, 3], [4, 5, 6]]); //[1,2,3,4,5,6]
con([1.1, 2, 3, 4]); //Error no operator for arguments
con(["1", 2, 3, 4]); //Error no operator for arguments
con([{a: 1, b: 2}, {b: 3, c: 4}]); //Error: no operator for arguments

const [map1, map2] = [new Map(), new Map()];

map1.set("a", 1);
map1.set("b", 2);

map2.set("b", 3);
map2.set("c", 4);

con([map1, map2]); //Map(3) { 'a' => 1, 'b' => 3, 'c' => 4 }
```

