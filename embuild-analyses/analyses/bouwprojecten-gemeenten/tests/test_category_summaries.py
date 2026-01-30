import sys
import pytest
sys.path.append('embuild-analyses/analyses/bouwprojecten-gemeenten/src')
import category_keywords as ck


def test_summarize_projects_by_category_basic():
    projects = [
        {
            'ac_code':'AC1', 'ac_short':'Park', 'municipality':'A', 'nis_code':'10001',
            'categories':['groen'], 'total_amount': 100.0, 'yearly_amounts': {'2026':100}
        },
        {
            'ac_code':'AC2', 'ac_short':'Straat', 'municipality':'B', 'nis_code':'10002',
            'categories':['wegenbouw'], 'total_amount': 200.0, 'yearly_amounts': {'2026':200}
        },
        {
            'ac_code':'AC3', 'ac_short':'School', 'municipality':'C', 'nis_code':'10003',
            'categories':['scholenbouw','cultuur'], 'total_amount': 300.0, 'yearly_amounts': {'2026':300}
        }
    ]

    summaries = ck.summarize_projects_by_category(projects, top_n=2)

    # Basic checks
    assert 'groen' in summaries
    assert summaries['groen']['project_count'] == 1
    assert summaries['groen']['total_amount'] == 100.0
    assert summaries['groen']['largest_projects'][0]['ac_code'] == 'AC1'

    assert summaries['scholenbouw']['project_count'] == 1
    assert summaries['scholenbouw']['total_amount'] == 300.0

    # Categories with no projects should still exist
    assert summaries['verlichting']['project_count'] == 0
    assert summaries['verlichting']['largest_projects'] == []
