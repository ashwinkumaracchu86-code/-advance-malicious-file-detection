import os
import json
import logging
import shutil
from typing import Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

YARA_RULES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "yara_rules")


def get_custom_rules() -> List[Dict[str, Any]]:
    """List all YARA rule files."""
    rules = []
    if not os.path.exists(YARA_RULES_DIR):
        return rules

    for fname in os.listdir(YARA_RULES_DIR):
        if fname.endswith((".yar", ".yara", ".rule")):
            fpath = os.path.join(YARA_RULES_DIR, fname)
            stat = os.stat(fpath)
            rules.append({
                "filename": fname,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                "path": fpath,
            })

    return rules


def upload_rule(filename: str, content: bytes) -> Dict[str, Any]:
    """Upload a new YARA rule file."""
    if not filename.endswith((".yar", ".yara", ".rule")):
        return {"error": "Invalid file extension. Must be .yar, .yara, or .rule"}

    os.makedirs(YARA_RULES_DIR, exist_ok=True)
    fpath = os.path.join(YARA_RULES_DIR, filename)

    try:
        import yara
        yara.compile(source=content.decode("utf-8"))
    except yara.SyntaxError as e:
        return {"error": f"YARA syntax error: {str(e)}"}
    except Exception as e:
        return {"error": f"Validation failed: {str(e)}"}

    with open(fpath, "wb") as f:
        f.write(content)

    logger.info(f"YARA rule uploaded: {filename}")
    return {"status": "uploaded", "filename": filename}


def delete_rule(filename: str) -> Dict[str, Any]:
    """Delete a YARA rule file."""
    fpath = os.path.join(YARA_RULES_DIR, filename)

    if not os.path.isfile(fpath):
        return {"error": f"Rule not found: {filename}"}

    os.remove(fpath)
    logger.info(f"YARA rule deleted: {filename}")
    return {"status": "deleted", "filename": filename}


def reload_rules() -> Dict[str, Any]:
    """Reload all YARA rules by reinitializing the scanner."""
    try:
        from ..scanner.yara_scanner import get_yara_scanner, scanner_instance
        scanner = scanner_instance or get_yara_scanner()
        scanner.load_rules()
        count = scanner.get_loaded_rules_count()
        return {"status": "reloaded", "rules_count": count}
    except Exception as e:
        logger.error(f"YARA reload failed: {e}")
        return {"error": f"Reload failed: {str(e)}"}


def get_rule_content(filename: str) -> Dict[str, Any]:
    """Get the content of a YARA rule file."""
    fpath = os.path.join(YARA_RULES_DIR, filename)

    if not os.path.isfile(fpath):
        return {"error": f"Rule not found: {filename}"}

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    return {"filename": filename, "content": content}
