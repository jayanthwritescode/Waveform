"""Same-origin local deployment; only the frontend tree is publicly served."""
from fastapi import Depends
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config import ROOT
from app.database.core import get_session
from app.services.catalogue import catalogue


def configure_deployment(app):
    frontend=ROOT/'frontend'
    @app.get('/api/ready',tags=['health'])
    def ready(db:Session=Depends(get_session)):
        db.execute(text('SELECT 1'))
        return {'status':'ready','catalogue_tracks':len(catalogue.records)}

    @app.api_route('/index.html',methods=['GET','HEAD'],include_in_schema=False)
    @app.api_route('/',methods=['GET','HEAD'],include_in_schema=False)
    def index():
        content=(frontend/'index.html').read_text().replace('name="waveform-api-base" content="http://127.0.0.1:8000"','name="waveform-api-base" content=""')
        return HTMLResponse(content,headers={'Cache-Control':'no-store'})
    app.mount('/',StaticFiles(directory=frontend,html=False),name='frontend')
