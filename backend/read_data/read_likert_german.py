from mima.settings import OUTPUT_PATH, LIKERT_PATH_DE_1, LIKERT_PATH_DE_2, META_PATH_DE
from read_data.read_likert_meertens import JudgmentItem, Response, serialize_classes
from read_data.read_questionnaire_meertens import remove_periods


import csv
import os
import json
import re

likert_data_german_1 = []
with open(LIKERT_PATH_DE_1, encoding="utf8") as file:
    reader = csv.reader(file)
    for line in reader:
        likert_data_german_1.append(line)

with open(META_PATH_DE, encoding='utf8') as file:
    reader = csv.reader(file)
    meta_data = []
    for line in reader:
        meta_data.append(line)

# Read the likert data - 1
judgment_items = {}
dialect_participants = {}
for line in likert_data_german_1[1:]:
    participant_id = line[0]
    main_question_id = line[4]
    main_question = line[7]
    sub_question = line[5]
    sub_question_id = main_question_id + "_" + sub_question
    main_question = main_question.replace(sub_question, "\u2026")
    try:
        score = int(line[6])
    except:
        score = None
    dialects = ['German', line[2]] if line[2] != "German" else ['German']
    dialect_participants[participant_id] = dialects
    country = ['Germany']
    if score:
        response = Response(participant_id, dialects, country, str(score))
    if main_question_id not in judgment_items.keys():
        judgment_items[main_question_id] = JudgmentItem(main_question, main_question_id, sub_question, sub_question_id, sub_question_id, [response])
    else:
        judgment_items[main_question_id].responses += [response]

likert_data_german_2 = []
with open(LIKERT_PATH_DE_2, encoding="utf8") as file:
    reader = csv.reader(file)
    for line in reader:
        likert_data_german_2.append(line)

for line in likert_data_german_2:
    participant_id = line[0]
    for index, cell in enumerate(line):
        if cell in ['1', '2', '3', '4', '5']:
            main_question_id = remove_periods(likert_data_german_2[0][index].split()[0])
            main_question = remove_periods(likert_data_german_2[0][index]).replace(main_question_id, '').strip()
            sub_question = None
            sub_question_id = None
            dialects = dialect_participants[participant_id]
            country = ['Germany']
            score = int(cell)
            response = Response(participant_id, dialects, country, str(score))
            if main_question_id not in judgment_items.keys():
                judgment_items[main_question_id] = JudgmentItem(main_question, main_question_id, sub_question, sub_question_id, sub_question_id, [response])
            else:
                judgment_items[main_question_id].responses += [response]


# add metadata (chapters, tags, translation, gloss)
for line in meta_data[2:]:
    question_id = line[0]
    judgment_items[question_id].chapters = line[2].split(';')
    judgment_items[question_id].tags = line[3].split(';')
    judgment_items[question_id].translation = re.sub('(^(Intended: )?[\u201c"]|[\u201c\u201d"]$)', '', line[4])
    judgment_items[question_id].gloss = line[5]
    judgment_items[question_id].split_item = line[1]


with open(os.path.join(OUTPUT_PATH, "likert_scales_german.json"), "w") as file:
        json.dump(judgment_items, file, default=serialize_classes, indent=4)
