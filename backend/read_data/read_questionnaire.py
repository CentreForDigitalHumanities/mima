import csv
import re
import json
import os
from dataclasses import dataclass, asdict

from backend.mima.settings import DATA_PATH, PARTICIPANTS_PATH, OUTPUT_PATH

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

@dataclass
class Question:
    tag: str
    index: int
    question: str
    type: str = 'NA'
    prompt: str = 'NA'
    cleaned: bool = False
    answers: list = None

    def __str__(self) -> str:
        return 'Question {}: {}'.format(self.tag, self.question)

@dataclass
class Answer:
    tag: str
    answer: str
    dialect: str
    participant_id: str
    ma: str = 'NA'
    prompt: str = "NA"
    prompt_ma: str = 'NA'

@dataclass
class Dialect:
    dialect: str
    speakers: list = None
    translations: dict = None

data = read_csv(DATA_PATH)
participants_data = read_csv(PARTICIPANTS_PATH)

## Match dialects to participant IDs
participants = {}
for participant in participants_data[1:]:
    if participant[29] == 'Het dialect van …':
        dialect = ' '.join(participant[29:31])
    elif participant[29] == '':
        dialect = 'Geen Dialect'
    else:
        dialect = participant[29]
    participants[''.join(participant[0:2])] = dialect

## Create a Question for each question and save it as an instance
questionnaire_items = {} #keys: question index!
for index, cell in enumerate(data[0]):
    first_word = cell.split()[0]
    if first_word == 'CLEANED':
        questionnaire_item = Question(
            tag = cell.split()[1],
            index = index,
            question = remove_periods(' '.join(cell.split()[2:])),
            type = 'Translation',
            cleaned = True
        )
    elif cell.endswith('[Vertaling]') and first_word not in ['COMMENT', 'DEVIATION']:
        questionnaire_item = Question(
            tag = first_word,
            index = index,
            question = remove_periods(' '.join(cell.split()[1:])),
            type = 'Translation'
        )
    else:
        questionnaire_item = Question(
            tag = first_word,
            index = index,
            question = remove_periods(' '.join(cell.split()[1:]))
        )

    questionnaire_items[questionnaire_item.index] = questionnaire_item

## Find the translations in the questionnaire
## Save the indices of those questions
translation_indices = []  # indices of translation questions
for item in questionnaire_items:
    if questionnaire_items[item].type == 'Translation':
        translation_indices.append(questionnaire_items[item].index)
print('N of questions: {}\nN of translation questions: {}'.format(len(questionnaire_items), len(translation_indices)))

## Collect the prompts for the translation questions
prompt_pattern = r'\[(.*?)\]'
for ti in translation_indices:
    match = re.search(prompt_pattern, questionnaire_items[ti].question)
    if match:
        questionnaire_items[ti].prompt = match.group(1)
    else:
        questionnaire_items[ti].prompt = 'No prompt found'

## Fill the answers for each question
for row in data[1:]:
    participant = ''.join(row[0:2])
    for index, cell in enumerate(row):
        question = questionnaire_items[index]
        if cell != '' and index in translation_indices:
            # skip cells that have cleaned versions of them in the next line
            if questionnaire_items[index+1].cleaned and row[index+1] != '':
                pass
            else:
                answer = Answer(question.tag, answer=cell, dialect=participants[participant], participant_id=participant)
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
    if question.cleaned:
        cleaned_translation_questions[question.tag] = question

# Define a custom function to serialize data classes as dictionaries
def serialize_classes(obj):
    if isinstance(obj, Question) or isinstance(obj, Answer):
        return asdict(obj)
    return obj.__dict__

## dump as json
with open(os.path.join(OUTPUT_PATH, 'cleaned_translation_questions.json'), 'w') as file:
    json.dump(cleaned_translation_questions, file, default=serialize_classes, indent=4)

