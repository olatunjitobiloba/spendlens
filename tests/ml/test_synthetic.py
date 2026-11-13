"""Data integrity and hand-authored expectations, before detector implementation."""

from dataclasses import fields
from datetime import date, time
from hashlib import sha256
from itertools import combinations
import json
from pathlib import Path
import random
import re

import pytest

from ml.synthetic import DEFAULT_SEED, PERSONAS, generate_dataset
from ml.types import CATEGORIES, Txn, validate_transactions

FIXTURES = Path(__file__).parent / 'fixtures'
CHALLENGE_SHA256 = '9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd'


def load_fixture(split):
    return json.loads((FIXTURES / f'{split}.json').read_text(encoding='utf-8'))


def canonical(row):
    values = dict(row)
    values['date'] = date.fromisoformat(values['date'])
    if values['time'] is not None:
        values['time'] = time.fromisoformat(values['time'])
    return Txn(**values)


def normalize(text):
    # This test oracle pins the written matching specification, not ML rules.
    text = re.sub(r'[^a-z\s]', ' ', text.lower())
    return ' '.join(text.split())


def expected_pairs(txns):
    # Exhaustive pair audit catches accidental positives and missing pair labels.
    result = set()
    for first, second in combinations(txns, 2):
        ids = tuple(sorted((first.id, second.id)))
        same_fields = (
            first.account_alias == second.account_alias
            and first.direction == second.direction
            and first.amount_kobo == second.amount_kobo
            and first.date == second.date
            and normalize(first.description) == normalize(second.description)
        )
        both_references = first.reference is not None and second.reference is not None
        if same_fields and (not both_references or first.reference == second.reference):
            confidence = 0.9 if both_references else 0.6
            result.add(('duplicate', ids, confidence))
        transfer_clue = any(
            'transfer' in normalize(txn.description).split()
            for txn in (first, second)
        )
        if (
            first.account_alias != second.account_alias
            and first.direction != second.direction
            and first.amount_kobo == second.amount_kobo
            and abs((first.date - second.date).days) <= 1
            and transfer_clue
        ):
            result.add(('internal_transfer', ids, 0.8))
    return result


@pytest.mark.parametrize('split', ['development', 'challenge'])
def test_fixture_answers_are_complete_and_canonical(split):
    # Inspect inputs and answer tables separately so labels cannot leak into Txn.
    document = load_fixture(split)
    assert document['split'] == split
    all_ids = []
    all_txns = []
    all_pairs = set()
    categories = set()
    for case in document['cases']:
        txns = [canonical(row) for row in case['transactions']]
        validate_transactions(txns)
        ids = {txn.id for txn in txns}
        all_ids.extend(ids)
        assert set(case['expected']['categories']) == ids
        for answer in case['expected']['categories'].values():
            categories.add(answer['category'])
            assert answer['category'] in CATEGORIES
            assert answer['confidence'] == (0.0 if answer['category'] == 'Uncategorized' else 0.9)
        pairs = {
            (pair['kind'], tuple(sorted(pair['txn_ids'])), pair['confidence'])
            for pair in case['expected']['candidates']
        }
        assert pairs == expected_pairs(txns), case['name']
        all_txns.extend(txns)
        all_pairs.update(pairs)
        assert all(set(pair[1]) <= ids for pair in pairs)
        assert all(set(row) == {field.name for field in fields(Txn)} for row in case['transactions'])
    assert len(all_ids) == len(set(all_ids))
    assert all_pairs == expected_pairs(all_txns)
    assert categories == set(CATEGORIES)
    required = {
        'repeat_import', 'legitimate_identical_purchase', 'one_missing_reference',
        'conflicting_references', 'normalized_duplicate', 'duplicate_account_boundary',
        'duplicate_direction_boundary', 'duplicate_amount_boundary', 'duplicate_date_boundary',
        'transfer_same_day', 'transfer_next_day', 'transfer_reverse_dates', 'transfer_two_days',
        'transfer_same_account', 'transfer_same_direction', 'transfer_fee',
        'transfer_unequal_amount', 'no_transfer_clue', 'missing_counterpart',
        'refund', 'ambiguous', 'multiple_counterparts', 'category_vocabulary',
    }
    assert {case['name'] for case in document['cases']} == required


def test_challenge_is_frozen_and_separate():
    # Normalize checkout newlines while freezing authored challenge content.
    challenge_content = (FIXTURES / 'challenge.json').read_text(encoding='utf-8')
    challenge_digest = sha256(challenge_content.encode('utf-8')).hexdigest()
    assert challenge_digest == CHALLENGE_SHA256
    challenge = load_fixture('challenge')
    development = load_fixture('development')
    assert challenge['provenance']['frozen'] is True
    challenge_text = {row['description'] for case in challenge['cases'] for row in case['transactions']}
    development_text = {row['description'] for case in development['cases'] for row in case['transactions']}
    assert challenge_text.isdisjoint(development_text)
    source = Path('ml/synthetic.py').read_text(encoding='utf-8')
    assert 'challenge.json' not in source
    assert 'development.json' not in source


@pytest.mark.parametrize('seed', [DEFAULT_SEED, 7])
def test_generator_coverage_and_separate_labels(seed):
    # Check both persona histories and exhaustive pair truth for each tested seed.
    data = generate_dataset(seed)
    txns = list(data.transactions)
    validate_transactions(txns)
    assert len(txns) >= 500
    assert txns == sorted(txns, key=lambda txn: (txn.date, txn.id))
    ids = {txn.id for txn in txns}
    assert set(dict(data.category_labels)) == ids
    assert len(data.category_labels) == len(txns)
    assert set(dict(data.persona_labels)) == ids
    assert set(dict(data.category_labels).values()) == set(CATEGORIES)
    assert all(type(txn.amount_kobo) is int and txn.amount_kobo > 0 for txn in txns)
    assert any(txn.time is None for txn in txns)
    assert any(txn.time is not None for txn in txns)
    assert 'category' not in {field.name for field in fields(Txn)}
    manifest = data.manifest()
    assert manifest['seed'] == seed
    assert manifest['row_count'] == len(txns) == 746
    assert manifest['candidate_count'] == 6
    assert manifest['synthetic_only'] is True
    for persona in PERSONAS:
        dates = {txn.date for txn in txns if dict(data.persona_labels)[txn.id] == persona}
        assert min(dates) == date(2026, 1, 1)
        assert max(dates) == date(2026, 6, 30)
        assert len(dates) == 181
        assert manifest['personas'][persona] == {
            'row_count': 373,
            'start': '2026-01-01',
            'end': '2026-06-30',
        }
    actual = {(pair.kind, pair.txn_ids, pair.confidence) for pair in data.candidate_labels}
    assert actual == expected_pairs(txns)
    assert len(actual) == len(data.candidate_labels)
    assert {name for name, _ in data.edge_cases} == {
        'repeat_import', 'legitimate_identical_purchase', 'transfer_fee',
        'refund', 'missing_counterpart', 'ambiguous',
    }
    assert all(set(edge_ids) <= ids for _, edge_ids in data.edge_cases)

    # Pin injected category answers independently of generator label assembly.
    expected_categories = {
        'repeat_import': ['Food', 'Food'],
        'legitimate_identical_purchase': ['Transport', 'Transport'],
        'transfer_fee': ['Savings and Transfers', 'Uncategorized', 'Uncategorized'],
        'refund': ['Food', 'Uncategorized'],
        'missing_counterpart': ['Savings and Transfers'],
        'ambiguous': ['Uncategorized'],
    }
    labels = dict(data.category_labels)
    for name, edge_ids in data.edge_cases:
        assert [labels[txn_id] for txn_id in edge_ids] == expected_categories[name]



def test_seed_reproducibility_and_random_isolation():
    # Private generation must reproduce output without disturbing caller randomness.
    state = random.getstate()
    first = generate_dataset()
    assert first == generate_dataset(DEFAULT_SEED)
    second = generate_dataset(7)
    assert first != second
    assert [txn.id for txn in first.transactions] == [txn.id for txn in second.transactions]
    assert first.category_labels != second.category_labels
    assert random.getstate() == state


@pytest.mark.parametrize('seed', [True, 1.2, '7', None])
def test_invalid_seed(seed):
    with pytest.raises(TypeError, match='seed must be an integer'):
        generate_dataset(seed)
