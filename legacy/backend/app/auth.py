"""Optional single-workspace login gate for public hosting; not multi-user accounts."""
import base64
import hashlib
import hmac
import secrets
import time
from urllib.parse import parse_qs
from fastapi import Request
from fastapi.responses import HTMLResponse,JSONResponse,RedirectResponse
from app.config import settings

SESSION_SECONDS=12*60*60


def hash_password(password,salt=None):
    salt=salt or secrets.token_bytes(16)
    digest=hashlib.scrypt(password.encode(),salt=salt,n=16384,r=8,p=1,dklen=32)
    return f'sc1:{salt.hex()}:{digest.hex()}'


def verify_password(password,encoded):
    try:
        version,salt,expected=encoded.split(':')
        if version!='sc1':return False
        actual=hash_password(password,bytes.fromhex(salt)).split(':')[-1]
        return hmac.compare_digest(actual,expected)
    except (ValueError,TypeError):return False


class AuthPolicy:
    def __init__(self,config):
        self.enabled=config.auth_required or bool(config.auth_password_hash and config.auth_password_hash.get_secret_value())
        self.secret=config.auth_secret.get_secret_value().encode() if config.auth_secret else b''
        self.password_hash=config.auth_password_hash.get_secret_value() if config.auth_password_hash else ''
        self.secure=config.auth_secure_cookie
        self.origin=config.public_origin
        self.cookie='__Host-waveform' if self.secure else 'waveform-local-session'
        self.attempts={}

    def issue(self,now=None):
        payload=f'{int(now if now is not None else time.time())+SESSION_SECONDS}:{secrets.token_urlsafe(16)}'.encode()
        value=base64.urlsafe_b64encode(payload).decode().rstrip('=')
        return value+'.'+hmac.new(self.secret,value.encode(),hashlib.sha256).hexdigest()

    def valid(self,token,now=None):
        try:
            value,signature=token.split('.')
            if not hmac.compare_digest(signature,hmac.new(self.secret,value.encode(),hashlib.sha256).hexdigest()):return False
            expiration=int(base64.urlsafe_b64decode(value+'='*(-len(value)%4)).decode().split(':',1)[0])
            clock=now if now is not None else time.time()
            return clock<expiration<=clock+SESSION_SECONDS+60
        except (AttributeError,ValueError,UnicodeError):return False

    def allow_attempt(self,client):
        minute=int(time.time()//60)
        self.attempts={key:value for key,value in self.attempts.items() if value[0]==minute}
        if client not in self.attempts and len(self.attempts)>=1000:return False
        _,count=self.attempts.get(client,(minute,0));self.attempts[client]=(minute,count+1)
        return count<5


def login_page(error=False,status=200):
    message='<p role="alert">Sign-in failed. Check the password or wait a minute before retrying.</p>' if error else ''
    return HTMLResponse('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Sign in — Waveform</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101014;color:#f2f1f7;font:16px system-ui}main{width:min(360px,calc(100vw - 64px));padding:28px;border:1px solid #39333f;border-radius:16px;background:#19191f}h1{font-size:28px}p{color:#b8adc5;line-height:1.7;font-size:14px}label{display:grid;gap:10px;margin:24px 0}input,button{font:inherit;padding:13px;border-radius:8px;border:1px solid #615176}input{background:#101014;color:inherit;min-width:0}button{width:100%;background:#b9a1ff;color:#211736;cursor:pointer}input:focus-visible,button:focus-visible{outline:2px solid #b9a1ff;outline-offset:4px}</style><main><h1>Waveform.</h1><p>Your music. Your moment.<br>Sign in to this private workspace.</p>'''+message+'''<form method="post" action="/login"><label>Workspace password<input type="password" name="password" autocomplete="current-password" maxlength="1024" required autofocus></label><button>Sign in</button></form><p>Access is for this single shared workspace. There are no public user accounts.</p></main></html>''',status_code=status)


def configure_auth(app,config=settings):
    policy=AuthPolicy(config);app.state.auth_policy=policy

    @app.middleware('http')
    async def auth_gate(request,call_next):
        if not policy.enabled or request.url.path in {'/login','/api/health','/api/ready','/api/auth'}:
            return await call_next(request)
        if not policy.valid(request.cookies.get(policy.cookie)):
            return JSONResponse({'detail':'Sign in again in another tab, then retry. Your current editor is kept.'},status_code=401,headers={'X-Waveform-Login':'/login'}) if request.url.path.startswith('/api/') else RedirectResponse('/login',status_code=303)
        if request.method not in {'GET','HEAD','OPTIONS'}:
            expected=policy.origin or str(request.base_url).rstrip('/')
            if request.headers.get('origin')!=expected:return JSONResponse({'detail':'Request origin was rejected.'},status_code=403)
        return await call_next(request)

    @app.get('/api/auth',include_in_schema=False)
    def auth_status(request:Request):
        return {'enabled':policy.enabled,'authenticated':not policy.enabled or policy.valid(request.cookies.get(policy.cookie))}

    @app.get('/login',include_in_schema=False)
    def login(request:Request):
        if not policy.enabled or policy.valid(request.cookies.get(policy.cookie)):return RedirectResponse('/',status_code=303)
        return login_page()

    @app.post('/login',include_in_schema=False)
    async def sign_in(request:Request):
        if not policy.enabled:return JSONResponse({'detail':'Login is not enabled'},status_code=404)
        expected=policy.origin or str(request.base_url).rstrip('/')
        if request.headers.get('origin')!=expected:return JSONResponse({'detail':'Request origin was rejected.'},status_code=403)
        if not policy.allow_attempt(request.client.host if request.client else 'unknown'):return login_page(True,429)
        if int(request.headers.get('content-length') or 0)>4096:return login_page(True,400)
        body=await request.body()
        if len(body)>4096:return login_page(True,400)
        try:password=parse_qs(body.decode(),max_num_fields=4).get('password',[''])[0]
        except (UnicodeError,ValueError):return login_page(True,400)
        if not password or len(password)>1024 or not verify_password(password,policy.password_hash):return login_page(True,401)
        response=RedirectResponse('/',status_code=303)
        response.set_cookie(policy.cookie,policy.issue(),max_age=SESSION_SECONDS,httponly=True,secure=policy.secure,samesite='strict',path='/')
        return response

    @app.post('/logout',include_in_schema=False)
    def logout():
        response=RedirectResponse('/login',status_code=303);response.delete_cookie(policy.cookie,path='/',secure=policy.secure,httponly=True,samesite='strict');return response
