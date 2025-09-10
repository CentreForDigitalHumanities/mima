from mima.settings import FRISIAN_PATH, FRISIAN_META, OUTPUT_PATH
import csv
import os
import json

from read_data.read_likert_meertens import JudgmentItem, Response, serialize_classes
from read_data.read_questionnaire_meertens import remove_periods

def get_likert_items_and_indices(header):
    indices = []
    items = {}
    index_to_id = {}
    for index, item in enumerate(header):
        if 'Invulzin' in item and '[' in item and ']' in item:
            indices.append(index)
            main_question = remove_periods(item.split('Invulzin: ')[1])
            main_question_id = remove_periods(item.split('Invulzin: ')[0]).strip()
            index_to_id[index] = main_question_id
            sub_question = main_question.split('[')[1].split(']')[0]
            sub_question_id = main_question_id + "_" + sub_question
            main_question = main_question.replace('['+sub_question+']', "\u2026")
            responses = []
            judgment_item = JudgmentItem(
                main_question,
                main_question_id,
                sub_question,
                sub_question_id,
                sub_question_id,
                responses
            )
            items[main_question_id] = judgment_item

    return indices, items, index_to_id

def get_likert_responses(line, indices, index_to_id, judgment_items):
    participant_id = line[0]
    for index in indices:
        score = line[index]
        judgment_items[index_to_id[index]].responses.append(
            Response(
                participant_id,
                ['Frisian', 'Klaaifrysk'],
                ['Netherlands'],
                score
            )
        )
    return judgment_items

frisian_data = []
with open(FRISIAN_PATH, encoding="utf8") as file:
    reader = csv.reader(file)
    for line in reader:
        frisian_data.append(line)

likert_indices, judgment_items, index_to_id = get_likert_items_and_indices(frisian_data[0])
for line in frisian_data[1:]:
    judgment_items = get_likert_responses(line, likert_indices, index_to_id, judgment_items)

with open(FRISIAN_META, encoding='utf8') as file:
    reader = csv.reader(file)
    for line in reader:
        question_id = line[0]
        if question_id in judgment_items.keys():
            judgment_items[question_id].chapters = line[2].split(';')
            judgment_items[question_id].tags = line[3].split(';')
            judgment_items[question_id].translation = line[4]
            judgment_items[question_id].gloss = line[5]


with open(os.path.join(OUTPUT_PATH, "likert_scales_frisian.json"), "w") as file:
        json.dump(judgment_items, file, default=serialize_classes, indent=4)

