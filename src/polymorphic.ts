import type {TrieNode} from "./_trie_";
import type {HedgeFn, Maybe} from "./htypes";

import {invalid, isempty} from "./_cmn_";
import {Trie} from "./_trie_";
import {Operator} from "./operator";
import {Parameter} from "./parameter";
import * as $ from "./lib";

export class PolymorphicOperator {
    readonly #trie: PTrie;

    constructor(...ops: Operator[]) {
        this.#trie = new Trie<Parameter, Operator>((p, q) => p.is(q));

        ops.forEach(op => this.implement(op));
    }

    of = <R = any>(...args: any[][]): R => {
        const f = PolymorphicOperator.#find(args, this.#trie);

        if (f == undefined)
            throw invalid(".call", `no operator for given arguments`);

        return (f as Operator<(..._:any[][]) => R>).f(...args);
    }

    implement = <I extends HedgeFn = HedgeFn>(op: Operator<I>) =>
        PolymorphicOperator.#insert(op, this.#trie);

    static #append = <P extends NodeParameter<I>, I extends HedgeFn = HedgeFn>(
        p: P, t: PTrie,
        f: NodeFunction<P, I>,
        r?: NodeReference<P, I>): PNode<I> => {
        if (p instanceof Parameter)
            (f as (p: Parameter<number, I>, t: PTrie) => void)(p as Parameter<number, I>, t);
        else
            (f as (p:PNode<I>, n: PNode<I>, t: PTrie) => void)(p as PNode<I>, r!.node, t);

        return (r ? r.getRef(r.node) : t.tail!) as PNode<I>;
    }

    static #find = (hedges: any[][], trie: PTrie): Maybe<Operator> => {
        if (isempty(hedges)|| isempty(hedges.flat()))
            return PolymorphicOperator.#findOptional(trie)?.value;

        if (hedges.length === 1)
            return PolymorphicOperator.#findUnary(hedges[0], trie)?.value;

        const [hedge, tail] = [hedges[0], hedges.slice(1)];
        let match = trie.find(p => p.accepts(hedge));

        while (match) {
            if (match.child) {
                const operator = PolymorphicOperator.#find(tail, match.child);

                if (operator)
                    return operator;
            }

            match = trie.find(p => p.accepts(hedge), match)
        }

        return undefined;
    }

    static #findOptional = (trie: PTrie): Maybe<PNode> => {
        let optional = trie.find(p => p.range[0] === 0);

        if (!optional)
            return undefined;

        while (optional && !optional.value) {
            if (optional.child) {
                optional = PolymorphicOperator.#findOptional(optional.child);

                if (optional)
                    return optional;
            }

            optional = trie.find(p => p.range[0] === 0, optional);
        }

        return optional;
    }

    static #findUnary = (args: any[], trie: PTrie): Maybe<PNode> => {
        let unary = trie.find(p => p.accepts(args));

        if (!unary)
            return undefined;

        while (unary && !unary.value) {
            if (unary.child) {
                unary = PolymorphicOperator.#findOptional(unary.child);

                if (unary)
                    return unary;
            }

            unary = trie.find(p => p.accepts(args), unary);
        }

        return unary;
    }

    static #insert = <I extends HedgeFn = HedgeFn>(f: Operator<I>, trie: PTrie): void => {
        const n = f.region.length;
        let curTrie = trie;

        for (const [i, parameter] of f.region.entries()) {
            const node = PolymorphicOperator.#insertParameter(parameter, curTrie);

            if (!node.child && (i < (n - 1)))
                node.child = new Trie<Parameter, Operator>();

            if (i < (n - 1))
                curTrie = node.child!;
            else
                node.value = f;
        }
    }

    static #insertDegenerateParameter = (parameter: Parameter, trie: PTrie): PNode => {
        console.log("INSERTING DEGENERATE PARAMETER...");

        const pmin = parameter.range[0];

        const dgn = p => $.isdegenerate(p) && p.range[0] === pmin;

        const dgf = !!parameter.clause
            ? dgn
            : p => dgn(p) && !p.clause;

        const dgnNode = trie.find(dgf);

        if (dgnNode) {
            console.log(`FOUND DGN...`);
            return PolymorphicOperator.#append(trie.node(parameter), trie,
                (p, n, t) => t.prepend(p, n), {node: dgnNode, getRef: n => n.previous!});
        }

        const nbr = p => !$.isdegenerate(p) || p.range[0] > pmin

        const nbrNode = trie.find(nbr);

        return nbrNode
            ? PolymorphicOperator.#append(trie.node(parameter), trie,
                (p, n, t) => t.prepend(p, n), {node: nbrNode, getRef: n => n.previous!})
            : PolymorphicOperator.#append(parameter, trie, (p, t) => t.insert(p), undefined);
    }

    static #insertParameter = (parameter: Parameter, trie: PTrie): PNode => {
        if (trie.size === 0)
            return PolymorphicOperator
                .#append(parameter, trie, (p, t) => t.insert(p), undefined);

        const exists = trie.find(q => q.is(parameter));

        if (exists)
            return exists;

        return $.isdegenerate(parameter)
            ? PolymorphicOperator.#insertDegenerateParameter(parameter, trie)
            : PolymorphicOperator.#insertParameterWithRange(parameter, trie);
    }

    static #insertParameterWithRange = (parameter: Parameter, trie: PTrie): PNode => {
        const [pmin, pmax] = parameter.range;

        const eqn = p => !$.isdegenerate(p) && p.range[0] === pmin && (p.range[1] >= pmax || $.isopen(p));
        const gtn = p => !$.isdegenerate(p) && p.range[0] > pmin;

        const eqf = !!parameter.clause
            ? eqn
            : p => eqn(p) && !p.clause;


        const eqNode = trie.find(eqf);

        const gtNode = trie.find(gtn, eqNode);

        if (eqNode)
            return PolymorphicOperator.#append(trie.node(parameter), trie,
                (p, n, t) => t.prepend(p, n), {node: eqNode, getRef: n => n.previous!});

        if (!gtNode)
            return PolymorphicOperator.#append(parameter, trie, (p, t) => t.insert(p), undefined);

        return PolymorphicOperator.#append(trie.node(parameter), trie,
            (p, n, t) => t.prepend(p, n), {node: gtNode, getRef: n => n.previous!});
    }
}

type NodeParameter<I extends HedgeFn = HedgeFn> = Parameter<number, I> | PNode<I>;

type NodeFunction<P extends NodeParameter<I>, I extends HedgeFn = HedgeFn> =
    P extends Parameter<number, I>
        ? (p: Parameter<number, I>, t: PTrie) => void
        : (p :PNode<I>, n: PNode<I>, t: PTrie) => void;

type NodeReference<P extends NodeParameter<I>, I extends HedgeFn = HedgeFn> =
    P extends Parameter<number, I>
        ? undefined | null
        : { node: PNode<I>, getRef: (n: PNode<I>) => PNode<I>};

type PNode<I extends HedgeFn = HedgeFn> = TrieNode<Parameter<number, I>, Operator<I>>;

type PTrie = Trie<Parameter, Operator>;