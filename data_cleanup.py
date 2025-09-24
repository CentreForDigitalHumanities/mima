#!/usr/bin/env python3
import json

HIERARCHY_DATA_PATH = "frontend/src/app/services/dialect_hierarchy.json"
HIERARCHY_FILTERED_DATA_PATH = "frontend/src/app/services/dialect_hierarchy_filtered.json"
QUESTIONNAIRE_DATA_PATH = "frontend/src/assets/cleaned_translation_questions.json"
JUDGMENTS_DATA_PATH = "frontend/src/assets/likert_scales_merged.json"
# create separate dialect hierarchies for questionnaires and judgments:
# they don't all have the same dialects

hierarchy_data = json.load(open(HIERARCHY_DATA_PATH))

lookup = set() # dialects in dataset

questionnaire_data = json.load(open(QUESTIONNAIRE_DATA_PATH))

for question in questionnaire_data.values():
    for answer in question['answers']:
        for dialect in answer['dialect']:
            lookup.add(dialect)

matched = set() # dialects in hierarchy

def filter_hierarchy(source, lookup, matched):
    target = {}

    for key, value in source.items():
        filtered_children = filter_hierarchy(value, lookup, matched)
        if key in lookup or len(filtered_children):
            # add to hierarchy if it or any of its children
            # are in the data
            matched.add(key)
            target[key] = filtered_children

    return target

result = {
    'question': filter_hierarchy(hierarchy_data, lookup, matched)
}

for dialect in lookup:
    if dialect not in matched:
        print(f"dialect in questionnaire data missing from hierarchy: {dialect}")

judgment_data = json.load(open(JUDGMENTS_DATA_PATH))

lookup = set() # dialects in dataset

for judgment in judgment_data.values():
    for response in judgment['responses']:
        for dialect in response['dialects']:
            lookup.add(dialect)

matched = set() # dialects in hierarchy

result['judgment'] = filter_hierarchy(hierarchy_data, lookup, matched)

for dialect in lookup:
    if dialect not in matched:
        print(f"dialect in judgment data missing from hierarchy: {dialect}")

json.dump(result, open(HIERARCHY_FILTERED_DATA_PATH, "w"), indent=4)
