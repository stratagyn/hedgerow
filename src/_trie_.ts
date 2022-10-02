import type { Clause, EqualityComparer, Maybe } from "./htypes";

import {invalid} from "./_cmn_";

export type TrieNode<K, V=K> = {
    trie: Trie<K, V>,
    child?: Trie<K, V>,
    next?: TrieNode<K, V>,
    previous?: TrieNode<K, V>,
    key: K,
    value?: V
}

export class Trie<K, V=K> {
    readonly #eq: EqualityComparer<K>;

    #head: Maybe<TrieNode<K, V>>;
    #tail: Maybe<TrieNode<K, V>>;
    #size: number;

    constructor(comparer?: EqualityComparer<K>) {
        [this.#size, this.#eq] = [0, comparer ?? ((x, y) => x === y)];
    }

    get head(): Maybe<TrieNode<K,  V>> {
        return this.#head;
    }

    get size(): number {
        return this.#size;
    }

    get tail(): Maybe<TrieNode<K,  V>> {
        return this.#tail;
    }

    append = (node: TrieNode<K, V>, to?: Maybe<TrieNode<K, V>>): TrieNode<K, V> => {
        if (!this.#setupInsert(node, to))
            return this.#tail!;

        const previous = to ? to : this.#tail!;

        if (previous.next) {
            previous.next.previous = node;
            node.next = previous.next;
        }

        node.previous = previous;
        previous.next = node;

        if (!node.next)
            this.#tail = node;

        if (!node.previous)
            this.#head = node;

        this.#size++;
        return node;
    }

    find = (where: Clause<K>, after?: Maybe<K | TrieNode<K, V>>): Maybe<TrieNode<K, V>> => {
        if (this.#size === 0)
            return undefined;

        if (after && "trie" in after) {
            if (after.trie !== this)
                throw invalid(".find", "node belongs to another trie");
        }

        let node = after
            ? "trie" in after ? after.next : this.find(p => this.#eq(p, after))?.next
            : this.#head;

        while (node && !where(node.key)) {
            node = node.next;
        }

        return node;
    }

    insert = (key: K, value?: V, nbr?: Maybe<K | TrieNode<K, V>>, append: boolean = true): void => {
        const node = this.find(p => this.#eq(p, key));

        if (node)
            return;

        if (nbr && "trie" in nbr && nbr.trie !== this)
            throw invalid(".insert", "node does not belong to this trie");

        const nbrNode = nbr
            ? "trie" in nbr ? nbr : this.find(p => this.#eq(p, nbr))
            : this.#tail;

        const newNode = this.node(key, value);

        if (nbr) {
            append ? this.append(newNode, nbrNode) : this.prepend(newNode, nbrNode);
            return;
        }

        this.append(newNode);
    }

    node = (key: K, value?: V): TrieNode<K, V> => {
        const node: TrieNode<K, V> = {
            trie: this,
            key: key
        }

        if (value != undefined)
            node.value = value;

        return node;
    }

    prepend = (node: TrieNode<K, V>, to?: Maybe<TrieNode<K, V>>): TrieNode<K, V> => {
        if (!this.#setupInsert(node, to))
            return this.#tail!;

        const next = to ? to : this.#head!;

        if (next.previous) {
            next.previous.next = node;
            node.previous = next.previous;
        }

        node.next = next;
        next.previous = node;

        if (!node.next)
            this.#tail = node;

        if (!node.previous)
            this.#head = node;

        this.#size++;
        return node;
    }

    #setupInsert = (node: TrieNode<K, V>, nbr?: Maybe<TrieNode<K,  V>>): boolean => {
        if (node.trie && (node.trie !== this || node.previous || node.next || node.child))
            throw invalid(".insert", "node belongs to a trie");

        if (nbr && nbr.trie !== this)
            throw invalid(".insert", "node does not belong to this trie");

        if (this.#size === 0) {
            this.#tail = this.#head = node;
            this.#size++;
            return false;
        }

        return true;
    }
}