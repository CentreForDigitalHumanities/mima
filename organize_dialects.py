#!/usr/bin/env python3
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional
import re


@dataclass
class Dialect:
    parent: Optional["Dialect"]
    name: str

    # number of levels
    def granularity(self) -> int:
        if self.parent != None:
            return self.parent.granularity() + 1
        else:
            return 1

    def __str__(self) -> str:
        return self.name if self.parent == None else f"{self.parent} > {self.name}"


# lookup from the end leaf of a dialect to a Dialect object
# this will also contain intermediate steps, this way
# a dialect can also be matched if it underspecified
# (or differently said, with a varying level of granularity)
lookup: Dict[str, Dialect] = {}


# check if the parent is a known (grand)parent of this dialect
def validate_parent(child: Dialect, parent: Dialect) -> bool:
    if parent == child.parent:
        return True

    if child.parent == None:
        return parent == None

    # is it a parent of the dialect's parent?
    return validate_parent(child.parent, parent)


def parse_dialect(text: str) -> Dialect:
    len_text = len(text)
    text = text.replace("UNDERSPECIFIED", "").replace(":", "")
    if len(text) != len_text:
        print("WARNING! Underspecified in text; this is ignored.")
    levels = [part.strip() for part in text.split(";")]
    parent: Optional[Dialect] = None
    dialect: Optional[Dialect]

    for level in levels:
        try:
            dialect = lookup[level]
            if not validate_parent(dialect, parent):
                # higher granularity?
                print(
                    f"Inconsistent parent for dialect {level};\nexpected '{dialect.parent}'\ngot '{parent}'.\nText={text}"
                )
                granularity = 1 if parent == None else (parent.granularity() + 1)
                existing_granularity = dialect.granularity()
                if granularity > existing_granularity:
                    dialect.parent = parent
                    print(
                        f"Higher granularity {granularity} vs {existing_granularity}. Using this instead."
                    )
                else:
                    print(
                        f"Same or lower granularity {granularity} vs {existing_granularity}, IGNORED!"
                    )
                    # raise ValueError(
                    #     f"Same or lower granularity {granularity} vs {existing_granularity}, ABORT!"
                    # )
        except KeyError:
            dialect = Dialect(parent, level)
            lookup[level] = dialect
        parent = dialect


def parse_dialects(line: str) -> Iterable[Dialect]:
    for part in re.split(r"[\+\&]", line):
        try:
            yield parse_dialect(part)
        except:
            print(f"Problem parsing {line}")
            raise


# TODO: dummy target, replace with assigning the dialect to the right
parsed = []

with open("dialect_data.txt") as f:
    for line in f.readlines():
        parsed.append((line, list(parse_dialects(line))))


def construct_hierarchy(dialects: Iterable[Dialect], parent: Optional[Dialect] = None):
    tree = {}
    matched: List[Dialect] = []
    unmatched: List[Dialect] = []

    for dialect in dialects:
        if dialect.parent == parent:
            matched.append(dialect)
        else:
            unmatched.append(dialect)

    for dialect in matched:
        tree[dialect.name] = construct_hierarchy(unmatched, dialect)

    return tree


def print_hierarchy(tree: dict, indent: int = 0):
    for key in sorted(tree.keys()):
        if indent > 0:
            print(indent * 2 * "─" + key)
        else:
            print(key)
        print_hierarchy(tree[key], indent + 1)


hierarchy = construct_hierarchy(lookup.values())
print_hierarchy(hierarchy)
