import csv
import re
import json
import os
from dataclasses import dataclass, asdict

from mima.settings import DATA_PATH_Q1, DATA_PATH_Q2, ADDITIONAL_DATA_PATH_Q1, ADDITIONAL_DATA_PATH_Q2, PARTICIPANTS_PATH_Q1, PARTICIPANTS_PATH_Q2, OUTPUT_PATH

def read_csv(filepath):
    data = []
    with open(filepath, encoding='utf8') as file:
        reader = csv.reader(file)
        for index, row in enumerate(reader):
            data.append(row)
    return data

def remove_periods(text):
    # Create a translation table mapping periods to None
    translator = str.maketrans('', '', '.')
    # Remove periods using translation table
    stripped_text = text.translate(translator)
    return stripped_text

def extract_prompt(question_string):
    ## Collect the prompts for a given string
    prompt_pattern = r'\[(.*?)\]'
    match = re.search(prompt_pattern, question_string)
    if match:
        return match.group(1)
    else:
        return 'No prompt found'

# Define a custom function to serialize data classes as dictionaries
def serialize_classes(obj):
    if isinstance(obj, Question) or isinstance(obj, Answer):
        return asdict(obj)
    return obj.__dict__

@dataclass
class Question:
    tag: str
    index: int
    question: str
    type: str = 'NA'
    prompt: str = 'NA'
    cleaned: bool = False
    split_item: str = 'NA'  # same as the question but split morphologically with punctuation
    chapter: str = 'NA'
    subtags: list = None
    en_translation: str = 'NA'
    gloss: str = 'NA'
    answers: list = None


    def __str__(self) -> str:
        return 'Question {}: {}'.format(self.tag, self.question)

@dataclass
class Answer:
    tag: str
    answer: str
    dialect: str
    country: str
    participant_id: str

@dataclass
class Dialect:
    dialect: str
    speakers: list = None
    translations: dict = None


def create_questionnaire_items(data):
    ## Create a Question object for each question and save them in a dictionary
    questionnaire_items = {} #keys: question index
    translation_indices = []

    for index, cell in enumerate(data[0]):
        first_word = cell.split()[0]
        if cell.endswith('[Vertaling]') and first_word == 'CLEANED':
            question = remove_periods(' '.join(cell.split()[2:]))
            questionnaire_item = Question(
                tag = remove_periods(cell.split()[1]),
                index = index,
                question = question,
                type = 'Translation',
                prompt = extract_prompt(question),
                cleaned = True
            )
            translation_indices.append(questionnaire_item.index)
        elif cell.endswith('[Vertaling]') and first_word not in ['COMMENT', 'DEVIATION']:
            question = remove_periods(' '.join(cell.split()[1:]))
            questionnaire_item = Question(
                tag = remove_periods(first_word),
                index = index,
                question = question,
                type = 'Translation',
                prompt = extract_prompt(question)
            )
            translation_indices.append(questionnaire_item.index)
        else:
            # currently unused, since we are only interested in translation questions
            # likert questions are read in read_likert.py
            questionnaire_item = Question(
                tag = remove_periods(first_word),
                index = index,
                question = remove_periods(' '.join(cell.split()[1:]))
            )

        questionnaire_items[questionnaire_item.index] = questionnaire_item

    return questionnaire_items, translation_indices


def extract_participant_metadata(participants_data):
    ## Create a dictionary with participant IDs as keys and their dialects as values
    participant_countries = {}
    participant_dialects = {}
    skip_list = []
    dialect_index = next((x for x in range(len(participants_data[0])) if participants_data[0][x] == '[metadata:dialect]'), None)
    if dialect_index is None:
        raise ValueError("Couldn't find column header with '[metadata:dialect]' in the participants data")
    separators = [';', '&', '+', ':']
    pattern = '|'.join(map(re.escape, separators))


    for participant in participants_data[1:]:
        participant_id = ''.join(participant[0:2])
        lang_tokens = [subdialect.strip() for subdialect in re.split(pattern, participant[dialect_index])]

        if 'UNDERSPECIFIED' in lang_tokens:
            skip_list.append(participant_id)
            continue  # skip participants with underspecified dialects
        country = []
        dialect = []
        for token in lang_tokens:
            if 'Nederland' in token or 'België' in token:
                country.append(token)
            else:
                dialect.append(token)
        participant_countries[participant_id] = country if country else ['NO COUNTRY']
        participant_dialects[participant_id] = dialect if dialect[0] != '' else ['SKIP']
    return participant_countries, participant_dialects, skip_list


def extract_answers(data, questionnaire_items, translation_indices, participant_countries, participant_dialects, skip_list):
        ## Fill the answers for each question
    for row in data[1:]:
        participant = ''.join(row[0:2])
        if participant in skip_list:
            continue
        for index, cell in enumerate(row):
            question = questionnaire_items[index]
            if index in translation_indices:
                # mark unattested answers for empty cells
                # cleaned cells are skipped
                if cell == '' and not questionnaire_items[index].cleaned:
                    answer = Answer(question.tag, answer='unattested', country=participant_countries[participant], dialect=participant_dialects[participant], participant_id=participant)
                    if question.answers:
                        question.answers.append(answer)
                    else:
                        question.answers = [answer]
                elif cell != '':
                    # skip cells that have cleaned versions of them in the next line
                    if questionnaire_items[index+1].cleaned and row[index+1] != '':
                        pass
                    else:
                        answer = Answer(question.tag, answer=cell, country=participant_countries[participant], dialect=participant_dialects[participant], participant_id=participant)
                        if question.answers:
                            question.answers.append(answer)
                        else:
                            question.answers = [answer]

    ## Merge all the answers from the cleaned and uncleaned translation questions under a single cleaned translation question
    ## and save it in a cleaned_translation_questions_dict
    cleaned_translation_questions = {} ## dict where the keys are the question tag (e.g. 'D7Z3[SQ004]')
    for index in questionnaire_items:
        question = questionnaire_items[index]
        if question.answers and question.type == 'Translation' and not question.cleaned:
            if questionnaire_items[index+1].cleaned:
                if questionnaire_items[index+1].answers:
                    questionnaire_items[index+1].answers += question.answers
                else:
                    questionnaire_items[index+1].answers = question.answers
            else: #if there is no CLEANED column, the answers of this question are added
                cleaned_translation_questions[question.tag] = question
        if question.cleaned:
            cleaned_translation_questions[question.tag] = question
        if not question.answers:
            question.answers = []

    return cleaned_translation_questions


def enrich_translation_questions(cleaned_translation_questions, additional_data):
    ## Go through the additional data and attach the necessary information to the cleaned_translation_questions
    for entry in additional_data[1:]:
        ids = entry[0].split(';')
        split_item = entry[1]
        chapter = entry[2]
        subtags = entry[3].split(';')
        en_translation = entry[4]
        gloss = entry[5]
        for id in ids:
            try:
                question = cleaned_translation_questions[id]
                question.split_item = split_item
                question.chapter = chapter
                question.subtags = subtags
                question.en_translation = en_translation
                question.gloss = gloss
            except:
                pass
    return cleaned_translation_questions

def extract_enriched_cleaned_questionnaire(data_path, participants_data_path, additional_data_path):
    data = read_csv(data_path)
    participants_data = read_csv(participants_data_path)
    additional_data = read_csv(additional_data_path)
    questionnaire_items, translation_indices = create_questionnaire_items(data)
    participant_countries, participant_dialects, skip_list = extract_participant_metadata(participants_data)
    cleaned_translation_questions = extract_answers(data, questionnaire_items, translation_indices, participant_countries, participant_dialects, skip_list)
    enriched_cleaned_translation_questions = enrich_translation_questions(cleaned_translation_questions, additional_data)
    return enriched_cleaned_translation_questions


def merge_questionnaires(q1, q2):
    merged_questionnaires = {}
    for key in q1:
        if key in q2:
            print('Whoah overlap')
            print(key)
        else:
            merged_questionnaires[key] = q1[key]
    for key in q2:
        if key in q1:
            pass
        else:
            merged_questionnaires[key] = q2[key]
    return merged_questionnaires

def __main__():
    enriched_cleaned_translation_questions_q1 = extract_enriched_cleaned_questionnaire(DATA_PATH_Q1, PARTICIPANTS_PATH_Q1, ADDITIONAL_DATA_PATH_Q1)
    enriched_cleaned_translation_questions_q2 = extract_enriched_cleaned_questionnaire(DATA_PATH_Q2, PARTICIPANTS_PATH_Q2, ADDITIONAL_DATA_PATH_Q2)
    merged_questionnaires = merge_questionnaires(enriched_cleaned_translation_questions_q1, enriched_cleaned_translation_questions_q2)

    ## dump as json
    with open(os.path.join(OUTPUT_PATH, 'cleaned_translation_questions.json'), 'w') as file:
        json.dump(merged_questionnaires, file, default=serialize_classes, indent=4)

if __name__ == "__main__":
    __main__()
