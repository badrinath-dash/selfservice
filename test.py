
# bin/gitlab_commit_handler.py
# Python 3.x
import os
import json
import ssl
import logging
import urllib.request
import urllib.parse
from datetime import datetime
from splunk.persistconn.application import PersistentServerConnectionApplication

# --- Logging to splunkd.log ---
logger = logging.getLogger('gitlab_commit_handler')
logger.setLevel(logging.INFO)

# --- Config ---
# ---- Configuration from environment (or replace with secure retrieval) ----
GITLAB_URL        = os.environ.get('GITLAB_URL', '')
GITLAB_TOKEN      = os.environ.get('GITLAB_TOKEN', '')
GITLAB_PROJECT_ID = os.environ.get('GITLAB_PROJECT_ID', '')  # numeric id or URL-encoded path

FILE_PATH    = 'clusterApps/cluster/local/indexes.conf'

# (Testing only) allow insecure SSL; set True if your GitLab uses self-signed certs
ALLOW_INSECURE_SSL = False

def _ssl_context():
    if not ALLOW_INSECURE_SSL:
        return None
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx

# --- HTTP helper with better error normalization ---
def _request_json(method, path, params=None, body=None, extra_headers=None, expect_text=False):
    if not GITLAB_URL or not GITLAB_TOKEN:
        raise RuntimeError("GitLab config missing: set GITLAB_URL and GITLAB_TOKEN")

    base = GITLAB_URL.rstrip('/')            # <-- safe base
    url = f"{base}/api/v4{path}"
    if params:
        q = urllib.parse.urlencode(params, doseq=True)
        url = f"{url}?{q}"

    data = None
    headers = {
        'PRIVATE-TOKEN': GITLAB_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    if extra_headers:
        headers.update(extra_headers)
    if body is not None:
        data = json.dumps(body).encode('utf-8')

    logger.info(f"[gitlab] {method} {url}")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60, context=_ssl_context()) as resp:
            raw = resp.read()
            return raw.decode('utf-8') if expect_text else json.loads(raw.decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        try:
            err_raw = e.read().decode('utf-8')
            logger.error(f"[gitlab] HTTP {e.code} error: {err_raw}")
            try:
                err_json = json.loads(err_raw)
                msg = err_json.get('message') or err_json
            except Exception:
                msg = err_raw or e.reason
            raise RuntimeError(f"GitLab HTTP {e.code}: {msg}")
        except Exception:
            raise RuntimeError(f"GitLab HTTP {e.code}: {e.reason}")
    except Exception as e:
        logger.exception("[gitlab] request failed")
        raise RuntimeError(str(e))

# --- GitLab API calls ---
def get_project(project_id):
    return _request_json('GET', f"/projects/{urllib.parse.quote(project_id, safe='')}")
# Projects API returns default_branch used below. cite[GitLab Projects API](https://docs.gitlab.com/api/projects/)

def create_branch(project_id, branch, ref):
    return _request_json('POST', f"/projects/{urllib.parse.quote(project_id, safe='')}/repository/branches",
                         body={'branch': branch, 'ref': ref})
# Create branch from ref (default branch). cite[GitLab Branches API](https://docs.gitlab.com/api/branches/)

def get_file_meta(project_id, file_path, ref):
    path_enc = urllib.parse.quote(file_path, safe='')
    return _request_json('GET', f"/projects/{urllib.parse.quote(project_id, safe='')}/repository/files/{path_enc}",
                         params={'ref': ref})

def get_file_raw(project_id, file_path, ref):
    path_enc = urllib.parse.quote(file_path, safe='')
    return _request_json('GET', f"/projects/{urllib.parse.quote(project_id, safe='')}/repository/files/{path_enc}/raw",
                         params={'ref': ref}, expect_text=True)

def create_file(project_id, file_path, branch, content, commit_message, author_name=None, author_email=None):
    path_enc = urllib.parse.quote(file_path, safe='')
    body = {'branch': branch, 'content': content, 'commit_message': commit_message}
    if author_name:  body['author_name']  = author_name
    if author_email: body['author_email'] = author_email
    return _request_json('POST', f"/projects/{urllib.parse.quote(project_id, safe='')}/repository/files/{path_enc}",
                         body=body)
# Create file on a branch (Repository Files API). cite[GitLab Repository Files API](https://docs.gitlab.com/api/repository_files/)

def update_file(project_id, file_path, branch, content, commit_message, author_name=None, author_email=None, last_commit_id=None):
    path_enc = urllib.parse.quote(file_path, safe='')
    body = {'branch': branch, 'content': content, 'commit_message': commit_message}
    if author_name:      body['author_name']    = author_name
    if author_email:     body['author_email']   = author_email
    if last_commit_id:   body['last_commit_id'] = last_commit_id
    return _request_json('PUT', f"/projects/{urllib.parse.quote(project_id, safe='')}/repository/files/{path_enc}",
                         body=body)
# Update file on a branch (Repository Files API). cite[GitLab Repository Files API](https://docs.gitlab.com/api/repository_files/)

def create_merge_request(project_id, source_branch, target_branch, title, description, remove_source=False, labels=None):
    body = {
        'source_branch': source_branch,
        'target_branch': target_branch,
        'title': title,
        'description': description,
        'remove_source_branch': bool(remove_source)
    }
    if labels:
        body['labels'] = ",".join(labels)
    return _request_json('POST', f"/projects/{urllib.parse.quote(project_id, safe='')}/merge_requests", body=body)
# Create MR (Merge Requests API). cite[GitLab Merge Requests API](https://docs.gitlab.com/api/merge_requests/)

# --- utils ---
def sanitize(s):
    return ''.join(ch if ch.isalnum() or ch in ('-','_','.') else '-' for ch in (s or ''))


def parse_input(in_string):
    """
    Accept both styles:
      1) {"payload": {...}}  (preferred Splunk wrapper)
      2) {...}               (raw JSON sent by client)
    Return a dict with the request fields.
    """
    try:
        wrapper = json.loads(in_string or '{}')
    except Exception:
        wrapper = {}

    # Preferred: payload key
    payload = wrapper.get('payload')

    # If payload is JSON-encoded string, parse it
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            payload = {}

    # If no payload or not a dict, try using wrapper directly
    if not isinstance(payload, dict) or not payload:
        # If wrapper already has the expected keys, treat it as the body
        if any(k in wrapper for k in ('indexName', 'stanza', 'appId', 'authorName', 'authorEmail', 'labels')):
            payload = wrapper
        else:
            payload = {}

       logger.info(f"[handler] incoming payload keys: {list(payload.keys())}")


# --- handler ---
class GitLabCommitHandler(PersistentServerConnectionApplication):
    def __init__(self, command_line, command_arg):
        super(GitLabCommitHandler, self).__init__()
        logger.info("[handler] initialized")

    def handle(self, in_string):
        try:
            body = parse_input(in_string)

            index_name  = (body.get('indexName') or '').strip()
            stanza      = (body.get('stanza') or '').strip()
            app_id      = (body.get('appId') or '').strip()
            author_name = (body.get('authorName') or 'Automation').strip()
            author_email= (body.get('authorEmail') or 'noreply@example.com').strip()
            labels      = body.get('labels') or ['index','splunk']

            if not index_name or not stanza:
                return {'payload': {'error': 'indexName and stanza are required'}, 'status': 400}

            # 1) Base branch
            proj = get_project(PROJECT_ID)  # includes default_branch
            target_branch = proj.get('default_branch') or 'main'

            # 2) Feature branch
            feature_branch = f"feature/index-{sanitize(app_id or 'unknown-app')}-{sanitize(index_name)}"
            try:
                create_branch(PROJECT_ID, feature_branch, target_branch)
            except Exception as e:
                logger.warning(f"[gitlab] create_branch warning: {e}")

            # 3) Read file (create vs update)
            create_mode = True
            existing_raw = ''
            last_commit_id = None
            try:
                existing_raw = get_file_raw(PROJECT_ID, FILE_PATH, feature_branch)
                meta = get_file_meta(PROJECT_ID, FILE_PATH, feature_branch)
                last_commit_id = meta.get('last_commit_id')
                create_mode = False
            except Exception as e:
                logger.info(f"[gitlab] file not found on branch, will create: {e}")
                create_mode = True

            # 4) Content (safe concatenation; no backslashes inside f-string expressions)
            iso_now = datetime.utcnow().isoformat() + "Z"
            
            # Build header text safely
            header_lines = [
                f"# === Index: {index_name} (app: {app_id or 'n/a'}) ===",
                f"# Submitted: {iso_now}",                      # optional timestamp
                f"# By: {author_name} <{author_email}>",
                ""
            ]
            header_text = "\n".join(header_lines) + "\n"       # join + one trailing newline

            # Decide separator when appending to existing content
            sep = "\n" if existing_raw.endswith("\n") else "\n\n"

            # Compose final content without generators inside f-strings
            if create_mode:
                new_content = header_text + stanza + "\n"
            else:
                new_content = existing_raw + sep + header_text + stanza + "\n"


            commit_message = f"Add index config for {index_name}"

            # 5) Write file
            if create_mode:
                create_file(PROJECT_ID, FILE_PATH, feature_branch, new_content, commit_message, author_name, author_email)
            else:
                update_file(PROJECT_ID, FILE_PATH, feature_branch, new_content, commit_message,
                            author_name, author_email, last_commit_id)

            # 6) MR
            title = f"Index: {index_name} (app: {app_id or 'n/a'})"
            description = "\n".join([
                f"Automated commit of Splunk index stanza to `{FILE_PATH}`.",
                "",
                f"**Index**: `{index_name}`",
                f"**App ID**: `{app_id or 'n/a'}`",
                "",
                "Please review and approve."
            ])
            mr = create_merge_request(PROJECT_ID, feature_branch, target_branch, title, description,
                                      remove_source=False, labels=labels)

            resp = {
                'status': 'ok',
                'branch': feature_branch,
                'target': target_branch,
                'file': FILE_PATH,
                'mergeRequest': {'iid': mr.get('iid'), 'url': mr.get('web_url'), 'title': mr.get('title')}
            }
            logger.info(f"[handler] success MR: {resp['mergeRequest']}")
            return {'payload': resp, 'status': 201}

        except Exception as e:
            logger.exception("[handler] failed")
            return {'payload': {'error': str(e)}, 'status': 500}
