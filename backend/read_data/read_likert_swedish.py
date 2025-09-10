from mima.settings import LIKERT_PATH_SE, META_PATH_SE, PARTICIPANTS_SE, OUTPUT_PATH
import csv
import os
import json

from read_data.read_likert_meertens import JudgmentItem, Response, serialize_classes
from read_data.read_questionnaire_meertens import remove_periods

def get_judgment_items():
    with open(META_PATH_SE, encoding="utf8") as file:
        reader = csv.reader(file)
        meta_data = []
        for line in reader:
            meta_data.append(line)
    
    judgment_items = {}
    for line in meta_data[1:]:
        main_question_id = line[0]
        main_question = line[1]
        sub_question_id = ""
        sub_question = ""
        responses = []
        chapters = line[2].split(';')
        tags = line[3].split(';')
        translation = line[4]
        gloss = line[5]
        judgment_item = JudgmentItem(
            main_question,
            main_question_id,
            sub_question,
            sub_question_id,
            sub_question_id,
            responses,
            chapters,
            tags,
            translation,
            gloss
        )
        judgment_items[main_question_id] = judgment_item
    
    return judgment_items

def get_dialects():
    dialects = {}
    with open(PARTICIPANTS_SE, encoding='utf8') as file:
        reader = csv.reader(file)
        for line in reader:
            dialects[line[0]] = line[2]

    return dialects    

def get_likert_responses(judgment_items, dialects):
    with open(LIKERT_PATH_SE, encoding="utf8") as file:
        reader = csv.reader(file)
        swedish_data = []
        for line in reader:
            swedish_data.append(line)

    likert_indices = []
    for index, cell in enumerate(swedish_data[0]):
        if cell in judgment_items.keys():
            likert_indices.append(index)

    for line in swedish_data[1:]:
        participant_id = line[0]
        dialect = dialects[participant_id]
        for index in likert_indices:    
            score = line[index]
            judgment_items[swedish_data[0][index]].responses.append(
                Response(
                    participant_id,
                    [dialect],
                    ['Sweden'],
                    score
                )
            )

    return judgment_items

judgment_items = get_judgment_items()
dialects = get_dialects()
judgment_items = get_likert_responses(judgment_items, dialects)
with open(os.path.join(OUTPUT_PATH, "likert_scales_swedish.json"), "w") as file:
        json.dump(judgment_items, file, default=serialize_classes, indent=4)