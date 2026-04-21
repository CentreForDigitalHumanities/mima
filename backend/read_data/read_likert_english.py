from mima.settings import OUTPUT_PATH, LIKERT_PATH_EN, META_PATH_EN
from read_data.read_likert_meertens import JudgmentItem, Response, serialize_classes

import csv
import os
import json

likert_data_english = []
with open(LIKERT_PATH_EN, encoding="utf8") as file:
    reader = csv.reader(file)
    for line in reader:
        likert_data_english.append(line)

# Read the likert data
judgment_items = []
for line in likert_data_english[1:]:
    participant_id = line[0]
    main_question_id = line[4]
    main_question = line[7]
    sub_question = line[5] if line[5] not in ['', ' ', '   '] else 'clausal'
    sub_question_id = main_question_id + "_" + sub_question
    main_question = main_question.replace(sub_question, "\u2026")
    try:
        score = int(line[6])
    except:
        score = None
    if line[2] == "English (British)":
        dialects = ['English', 'British']
        country = ['United Kingdom']
    elif line[2] == "English (American)":
        dialects = ['English', 'American']
        country = ['United States']
    elif line[2] == "South African English":
        dialects = ['English', 'South African']
        country = ['South Africa']
    else:
        dialects = ['English']
        country = ['Unknown']
    if score:
        response = Response(participant_id, dialects, country, str(score))
        item = JudgmentItem(main_question, main_question_id, sub_question, sub_question_id, sub_question_id, [response])
        judgment_items.append(item)


# merge the responses with the same main_question_id
mq_ids = set()
merged_judgment_items = {}
for item in judgment_items:
    if item.main_question_id not in mq_ids:
        mq_ids.add(item.main_question_id)
        merged_judgment_items[item.main_question_id] = item
    else:
        merged_judgment_items[item.main_question_id].responses += item.responses

with open(META_PATH_EN, encoding='utf8') as file:
    reader = csv.reader(file)
    next(reader)
    for line in reader:
        question_id = line[0]
        merged_judgment_items[question_id].chapters = line[2].split(';')
        merged_judgment_items[question_id].tags = line[3].split(';')

with open(os.path.join(OUTPUT_PATH, "likert_scales_english.json"), "w") as file:
        json.dump(merged_judgment_items, file, default=serialize_classes, indent=4)
