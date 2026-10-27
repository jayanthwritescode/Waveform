"""Reproducible rule/ranking diagnostics, not user relevance or mood accuracy."""
import json
import math
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from app.services.recommendations import get_context_engine


def main():
    engine=get_context_engine()
    base=dict(seed_ids=[],liked_ids=[],disliked_ids=[],exclude_ids=[],profile={},use_profile=False,include_liked=False,limit=10)
    cases={'calm_focus':{'mood':'calm','activity':'focus'},'workout':{'mood':'energetic','activity':'workout'},
           'rainy_night':{'weather':'rainy','time_of_day':'night'},'clear_morning':{'weather':'clear','time_of_day':'morning'}}
    results={}
    for name,context in cases.items():
        result=engine.recommend(context=context,**base)
        assert result==engine.recommend(context=context,**base)
        ids=[item['track_id'] for item in result['items']]
        assert len(ids)==len(set(ids))==10
        for item in result['items']:
            assert math.isfinite(item['score']) and 0<=item['score']<=1
            assert math.isclose(item['score'],sum(signal['contribution'] for signal in item['signals']),abs_tol=1e-12)
            context_block=next(signal for signal in item['signals'] if signal['name']=='context')
            assert math.isclose(context_block['value'],sum(signal['contribution'] for signal in item['context_signals']),abs_tol=1e-12)
        results[name]={'ids':ids,'examples':[{'title':engine.index.rows[engine.index.ids[item['track_id']]]['title'],
                                           'score':round(item['score'],6),'context_coverage':item['context_coverage']} for item in result['items'][:3]]}
    assert results['calm_focus']['ids']!=results['workout']['ids']
    assert results['rainy_night']['ids']!=results['clear_morning']['ids']
    alternatives=engine.recommend(context=cases['workout'],**{**base,'exclude_ids':results['workout']['ids']})
    assert not set(results['workout']['ids'])&{item['track_id'] for item in alternatives['items']}
    duration=engine.recommend(context=cases['calm_focus'],length_mode='duration',duration_minutes=30,**{**base,'limit':30})
    assert duration['length']['total_known_seconds']<=1800
    print(json.dumps({'model_version':engine.version,'checked_contexts':len(cases),'checks':'passed',
                      'scope':'Deterministic ranking sensitivity, score accounting, uniqueness, alternatives and duration bound; no measured relevance or mood accuracy',
                      'cases':results,'duration_example':duration['length']},indent=2,ensure_ascii=False))


if __name__=='__main__': main()
