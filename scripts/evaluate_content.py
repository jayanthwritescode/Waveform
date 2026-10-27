#!/usr/bin/env python3
"""Reproducible integrity/neighbor diagnostics, not user-relevance accuracy metrics."""
import json
import math
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))
from app.services.catalogue import catalogue
from app.services.recommendations import get_engine


def main():
    engine=get_engine()
    identifiers=list(engine.index.ids)
    seeds=[identifiers[index] for index in range(0,len(identifiers),max(1,len(identifiers)//12))][:12]
    examples=[]
    for seed in seeds:
        arguments=dict(seed_ids=[seed],liked_ids=[],disliked_ids=[],exclude_ids=[],profile={},use_profile=False,include_liked=False,limit=10)
        result=engine.recommend(**arguments)
        assert result==engine.recommend(**arguments), 'Non-deterministic results'
        ids=[item['track_id'] for item in result['items']]
        assert len(ids)==len(set(ids)) and seed not in ids
        assert all(catalogue.get(identifier) is not None for identifier in ids)
        for item in result['items']:
            assert item['score'] is not None and math.isfinite(item['score']) and 0<=item['score']<=1
            assert math.isclose(item['score'],sum(signal['contribution'] for signal in item['signals']),abs_tol=1e-12)
        examples.append({'seed_id':seed,'seed_title':catalogue.get(seed).title,
                         'neighbors':[{'id':item['track_id'],'title':catalogue.get(item['track_id']).title,'score':round(item['score'],6)} for item in result['items'][:3]]})
    report={'model':engine.metadata(),'checked_seeds':len(seeds),'integrity_checks':'passed',
            'evaluation_scope':'Determinism, valid IDs, uniqueness, seed exclusion, finite scores, contribution accounting; no held-out relevance metrics',
            'examples':examples}
    print(json.dumps(report,indent=2,ensure_ascii=False))


if __name__=='__main__': main()
