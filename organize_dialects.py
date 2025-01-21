#!/usr/bin/env python3
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional
import re
import json

TRANSITION_MARKER = "Overgangsdialect"


@dataclass
class Dialect:
    parents: List["Dialect"]
    name: str

    # number of levels
    def granularity(self) -> int:
        if self.parents:
            return max(parent.granularity() + 1 for parent in self.parents)
        else:
            return 1

    def __str__(self) -> str:
        return (
            self.name
            if not self.parents
            else f"{','.join(str(parent) for parent in self.parents)} > {self.name}"
        )


# lookup from the end leaf of a dialect to a Dialect object
# this will also contain intermediate steps, this way
# a dialect can also be matched if it underspecified
# (or differently said, with a varying level of granularity)
lookup: Dict[str, Dialect] = {}


# check if the parent is a known (grand)parent of this dialect
def validate_parent(child: Dialect, parent: Dialect) -> bool:
    if not child.parents:
        return parent == None

    if [parent] == child.parents:
        return True

    # is it a parent of the dialect's parent?
    return validate_parent(child.parents[0], parent)


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
                    f"Inconsistent parent for dialect {level};\nexpected '{dialect.parents[0]}'\ngot '{parent}'.\nText={text}"
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
            dialect = Dialect([parent] if parent else None, level)
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

Hierarchy = Dict[str, "Hierarchy"]


def construct_hierarchy(
    dialects: Iterable[Dialect], parent: Optional[Dialect] = None
) -> Hierarchy:
    tree: Hierarchy = {}
    matched: List[Dialect] = []
    unmatched: List[Dialect] = []

    for dialect in dialects:
        if (
            not dialect.parents
            and parent == None
            or dialect.parents
            and parent in dialect.parents
        ):
            matched.append(dialect)
        else:
            unmatched.append(dialect)

    for dialect in matched:
        tree[dialect.name] = construct_hierarchy(unmatched, dialect)

    return tree


def merge_children(hierarchy: Hierarchy, dialect: str, children: Hierarchy) -> None:
    if dialect in hierarchy:
        hierarchy[dialect] = {**hierarchy[dialect], **children}
    else:
        hierarchy[dialect] = children


def transition_dialects(hierarchy: Hierarchy) -> Hierarchy:
    """Splits transition dialects into two dialects; with the underlying children getting two parents

    Args:
        hierarchy (Hierarchy): hierarchy to parse the top nodes from

    Returns:
        Hierarchy: the updated hierarchy
    """
    updated: Hierarchy = {}

    for name, children in hierarchy.items():
        if name.startswith(TRANSITION_MARKER):
            dialects = name.replace(TRANSITION_MARKER, "").strip().split("/")
            for dialect in dialects:
                merge_children(updated, dialect, children)

            # update the Dialect data in the lookup
            del lookup[name]
            for child in children:
                lookup[child].parents = [lookup[p] for p in dialects]
        else:
            # nothing to see here, move along
            merge_children(updated, name, children)

    return updated


def print_hierarchy(tree: dict, indent: int = 0):
    for key in sorted(tree.keys()):
        if indent > 0:
            print(indent * 2 * " ─ " + key)
        else:
            print(key)
        print_hierarchy(tree[key], indent + 1)


# Hierarchy contains the information using the dialect names (as string)
# Use this name in the lookup to retrieve the Dialect object
hierarchy = construct_hierarchy(lookup.values())
hierarchy = transition_dialects(hierarchy)
with open("dialect_hierarchy.json", "w") as f:
    f.write(json.dumps(hierarchy, indent=4))
print_hierarchy(hierarchy)
