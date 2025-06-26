from mima.settings import OUTPUT_PATH, LIKERT_PATH_DE
from read_data.read_likert_meertens import JudgmentItem, Response, serialize_classes

import csv
import os
import json

likert_data_german = []
with open(LIKERT_PATH_DE, encoding="utf8") as file:
    reader = csv.reader(file)
    for line in reader:
        likert_data_german.append(line)

# Read the likert data - 1
judgment_items = []
for line in likert_data_german[1:]:
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
    country = ['Germany']
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

with open(os.path.join(OUTPUT_PATH, "likert_scales_german_1.json"), "w") as file:
        json.dump(merged_judgment_items, file, default=serialize_classes, indent=4)





