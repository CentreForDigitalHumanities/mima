from mima.settings import DATA_PATH, PARTICIPANTS_PATH, OUTPUT_PATH
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
    dialect: str
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
    sub_question = re.findall(r"\[(.*?)\]", line.split(".")[-1])[0].strip()
    main_question = (
        line.split(".")[1].replace("Invulzin", "").strip().replace("XXX", "...")
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
        if "Invulzin" in item:
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


def get_responses(data, participant_dialects, indices, judgments):
    for line in data[1:]:
        participant_id = "".join(line[0:2])
        for index in indices:
            score = line[index]
            question_id = get_full_id(data[0][index])
            judgments[question_id].responses.append(
                Response(participant_id, participant_dialects[participant_id], score)
            )
    return judgments


# custom function to serialize data classes as dictionaries
def serialize_classes(obj):
    if isinstance(obj, JudgmentItem) or isinstance(obj, Response):
        return asdict(obj)
    return obj.__dict__


def export_to_json(dictionary):
    ## dump as json
    with open(os.path.join(OUTPUT_PATH, "likert_scales_test.json"), "w") as file:
        json.dump(dictionary, file, default=serialize_classes, indent=4)


def __main__():
    data = read_csv(DATA_PATH)
    participants_data = read_csv(PARTICIPANTS_PATH)
    participant_dialects = get_dialects(participants_data)
    judgment_items, judgment_indices = get_judgment_items(data[0])
    judgment_items = get_responses(
        data, participant_dialects, judgment_indices, judgment_items
    )
    export_to_json(judgment_items)


if __name__ == "__main__":
    __main__()
