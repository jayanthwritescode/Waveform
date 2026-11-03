"""Create ignored, owner-only login configuration without recording the password."""
import getpass,os,secrets,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'backend'))
from app.auth import hash_password

if __name__=='__main__':
    password=getpass.getpass('Choose a workspace password (at least 12 characters): ')
    if len(password)<12 or len(password)>1024:raise SystemExit('Choose 12–1024 characters.')
    if password!=getpass.getpass('Confirm workspace password: '):raise SystemExit('Passwords did not match.')
    filename=ROOT/'.env.auth'
    descriptor=os.open(filename,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(descriptor,'w') as output:
        output.write('AUTH_REQUIRED=true\nAUTH_PASSWORD_HASH='+hash_password(password)+'\nAUTH_SECRET='+secrets.token_urlsafe(48)+'\nAUTH_SECURE_COOKIE=true\n')
    print('Wrote .env.auth with owner-only permissions. The password was not stored. Use its hash/secret in host secret settings; never commit this file.')
