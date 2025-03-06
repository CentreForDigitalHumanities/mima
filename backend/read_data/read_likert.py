from mima.settings import DATA_PATH_Q1, DATA_PATH_Q2, PARTICIPANTS_PATH_Q1, PARTICIPANTS_PATH_Q2, OUTPUT_PATH

from read_questionnaire import extract_participant_metadata, merge_questionnaires
import re
import os
import json
import csv
from dataclasses import dataclass, asdict
from typing import Dict


@dataclass
class JudgmentItem:
    main_question: str
    main_question_id: str
    sub_question: str
    sub_question_id: str
    sub_question_text_id: str
    responses: list


@dataclass
class Response:
    participant_id: str
    dialects: str
    country: str
    score: int


sub_questions: Dict[str, str] = {}


def get_sub_question_text_id(sub_question: str) -> str:
    try:
        return sub_questions[sub_question]
    except KeyError:
        text_id = sub_questions[sub_question] = f"ST{len(sub_questions):0>3}"
        return text_id


def read_csv(filepath):
    data = []
    with open(filepath, encoding="utf8") as file:
        reader = csv.reader(file)
        for index, row in enumerate(reader):
            data.append(row)
    return data


def get_dialects(data):
    participants = {}
    for participant in data[1:]:
        if participant[29] == "Het dialect van …":
            dialect = " ".join(participant[29:31])
        elif participant[29] == "":
            dialect = "Geen Dialect"
        else:
            dialect = participant[29]
        participants["".join(participant[0:2])] = dialect.strip()
    return participants


def get_questions_and_ids(item):
    line = item.replace("...", "XXX")
    line = item.replace("\u2026", "XXX")
    line = item.replace("…", "XXX")
    sub_question = re.findall(r"\[(.*?)\]", line.split(".")[-1])[0].strip()
    main_question = (
        line.split(".")[1].replace("Invulzin", "").strip().replace("XXX", "\u2026")
    )
    ids = item.split("Invulzin")[0]
    main_question_id = ids.split("[")[0]
    sub_question_id = re.findall(r"\[(.*?)\]", ids)[0]
    return main_question, sub_question, main_question_id, sub_question_id


def get_full_id(item):
    return item.split(".")[0]


def get_judgment_items(line):
    judgments = {}
    indices = []
    for index, item in enumerate(line):
        if "Invulzin" in item and "CLEANED" not in item:
            indices.append(index)
            main_question, sub_question, main_question_id, sub_question_id = (
                get_questions_and_ids(item)
            )
            sub_question_text_id = get_sub_question_text_id(sub_question)
            judgment_item = JudgmentItem(
                main_question,
                main_question_id,
                sub_question,
                sub_question_id,
                sub_question_text_id,
                [],
            )
            judgments["{}[{}]".format(main_question_id, sub_question_id)] = (
                judgment_item
            )
    return judgments, indices


def get_responses(data, participant_dialects, participant_countries, indices, judgments, skip_list):
    for line in data[1:]:
        participant_id = "".join(line[0:2])
        if participant_id in skip_list:
            print('skip', participant_id)
            continue
        for index in indices:
            score = line[index]
            question_id = get_full_id(data[0][index])
            judgments[question_id].responses.append(
                Response(participant_id, participant_dialects[participant_id], participant_countries[participant_id], score)
            )
    return judgments


# custom function to serialize data classes as dictionaries
def serialize_classes(obj):
    if isinstance(obj, JudgmentItem) or isinstance(obj, Response):
        return asdict(obj)
    return obj.__dict__

def extract_likert_and_participant_data(data_path, participants_path):
    data = read_csv(data_path)
    participants_data = read_csv(participants_path)
    participant_countries, participant_dialects, skip_list = extract_participant_metadata(participants_data)
    judgment_items, judgment_indices = get_judgment_items(data[0])
    judgment_items = get_responses(
        data, participant_dialects, participant_countries, judgment_indices, judgment_items, skip_list
    )
    return judgment_items

def __main__():
    judgment_items_q1 = extract_likert_and_participant_data(DATA_PATH_Q1, PARTICIPANTS_PATH_Q1)
    judgment_items_q2 = extract_likert_and_participant_data(DATA_PATH_Q2, PARTICIPANTS_PATH_Q2)
    merged_judgment_items = merge_questionnaires(judgment_items_q1, judgment_items_q2)
    with open(os.path.join(OUTPUT_PATH, "likert_scales_test.json"), "w") as file:
        json.dump(merged_judgment_items, file, default=serialize_classes, indent=4)


if __name__ == "__main__":
    __main__()
