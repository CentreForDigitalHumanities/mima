from distutils.command.upload import upload
from django.db import models
from typing import Callable, Dict, List, Sequence, Tuple


def str_map(x: str):
    return x


def label_map(x: str):
    return x.split('+')


adverbial_mapping: Dict[str, Tuple[str, Callable[[str], any]]] = {
    'ID': ('id', str_map),
    'Manner adverbial': ('text', str_map),
    'Full example': ('example', str_map),
    'Translation': ('translation', str_map),
    'Leipzig gloss': ('gloss', str_map),
    'Language': ('language', str_map),
    'Dialect': ('dialect', str_map),
    'Language family': ('language_family', str_map),
    'Language group': ('language_group', str_map),
    'Source': ('source', str_map),
    'Label': ('labels', label_map),
    'Note(s)': ('notes', str_map)
}


class Adverbial:
    @staticmethod
    def validate_fieldnames(fieldnames: Sequence[str]) -> List[str]:
        errors: List[List[str]] = []
        missing_columns = list(adverbial_mapping.keys())
        for name in fieldnames:
            if name not in adverbial_mapping:
                errors.append(['UNKNOWN_COLUMN', name])
            else:
                missing_columns.remove(name)

        for name in missing_columns:
            errors.append(['MISSING_COLUMN', name])

        return errors

    @staticmethod
    def from_csv_row(row: Dict[str, str]) -> 'Adverbial':
        adverbial = Adverbial()
        for key, value in row.items():
            name, mapping = adverbial_mapping[key]
            setattr(adverbial, name, mapping(value))

        return adverbial

    def as_dict(self) -> Dict[str, any]:
        result: Dict[str, any] = {}
        for _, (key, _) in adverbial_mapping.items():
            result[key] = getattr(self, key)

        return result
