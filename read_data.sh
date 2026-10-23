# Read the data from the surveys
cd backend
python -m read_data.read_likert_english
python -m read_data.read_likert_frisian
python -m read_data.read_likert_german
python -m read_data.read_likert_meertens
python -m read_data.read_likert_swedish
python -m read_data.read_questionnaire_meertens
cd ..
python data_cleanup.py
