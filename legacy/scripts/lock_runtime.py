"""Pin installed runtime dependencies for local/Linux deployment without dev tools."""
from importlib.metadata import distribution
from pathlib import Path
from packaging.requirements import Requirement
from packaging.markers import default_environment
pending=['fastapi','uvicorn','pydantic-settings','SQLAlchemy','numpy','pandas','scipy','scikit-learn']
seen={}
environments=[default_environment()]
for architecture in ['x86_64','aarch64']:
    environments.append({**default_environment(),'sys_platform':'linux','platform_system':'Linux','os_name':'posix','platform_machine':architecture})
while pending:
    name=pending.pop().lower().replace('_','-')
    if name in seen:continue
    package=distribution(name);seen[name]=f'{package.metadata["Name"]}=={package.version}'
    for value in package.requires or []:
        requirement=Requirement(value)
        if not requirement.marker or any(requirement.marker.evaluate({**environment,'extra':''}) for environment in environments):pending.append(requirement.name)
Path('backend/requirements-runtime-lock.txt').write_text('# Installed runtime pins; regenerate with scripts/lock_runtime.py after dependency changes.\n'+'\n'.join(seen[key] for key in sorted(seen))+'\n')
print(f'Pinned {len(seen)} runtime distributions.')
