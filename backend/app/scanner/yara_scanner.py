import os
import json
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    import yara
    YARA_AVAILABLE = True
except ImportError:
    YARA_AVAILABLE = False
    logger.warning("yara-python not installed. YARA scanning disabled.")


class YaraScanner:
    """YARA rule scanner for malicious file detection."""

    def __init__(self, rules_dir: Optional[str] = None):
        if rules_dir is None:
            rules_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "yara_rules")
        self.rules_dir = rules_dir
        self.compiled_rules = None
        self.load_rules()

    def load_rules(self) -> None:
        """Load and compile YARA rules from the rules directory."""
        if not YARA_AVAILABLE:
            logger.warning("YARA not available. Skipping rule compilation.")
            return

        if not os.path.exists(self.rules_dir):
            os.makedirs(self.rules_dir, exist_ok=True)
            logger.info(f"Created YARA rules directory: {self.rules_dir}")
            return

        rule_files = []
        for fname in os.listdir(self.rules_dir):
            if fname.endswith((".yar", ".yara", ".rule")):
                rule_files.append(os.path.join(self.rules_dir, fname))

        if not rule_files:
            logger.warning("No YARA rule files found.")
            return

        try:
            self.compiled_rules = yara.compile(
                filepaths={f"rule_{i}": f for i, f in enumerate(rule_files)}
            )
            logger.info(f"Compiled {len(rule_files)} YARA rule files.")
        except yara.SyntaxError as e:
            logger.error(f"YARA syntax error: {e}")
            self.compiled_rules = None
        except Exception as e:
            logger.error(f"Failed to compile YARA rules: {e}")
            self.compiled_rules = None

    def scan_file(self, file_path: str) -> Dict[str, any]:
        """Scan a file with YARA rules and return matches."""
        if not YARA_AVAILABLE or self.compiled_rules is None:
            return {
                "scanned": False,
                "reason": "YARA not available or rules not compiled",
                "matches": [],
                "match_count": 0,
            }

        if not os.path.isfile(file_path):
            return {
                "scanned": False,
                "reason": "File not found",
                "matches": [],
                "match_count": 0,
            }

        try:
            matches = self.compiled_rules.match(file_path, timeout=30)
        except yara.TimeoutError:
            return {
                "scanned": False,
                "reason": "Scan timed out",
                "matches": [],
                "match_count": 0,
            }
        except Exception as e:
            logger.error(f"YARA scan error: {e}")
            return {
                "scanned": False,
                "reason": str(e),
                "matches": [],
                "match_count": 0,
            }

        formatted_matches = []
        for match in matches:
            rule_info = {
                "rule_name": match.rule,
                "namespace": match.namespace,
                "tags": match.tags,
                "meta": {},
                "strings": [],
            }
            if match.meta:
                rule_info["meta"] = dict(match.meta)
            for offset, identifier, data in match.strings:
                rule_info["strings"].append({
                    "offset": offset,
                    "identifier": identifier,
                    "data_preview": data[:100].decode("utf-8", errors="replace"),
                })
            formatted_matches.append(rule_info)

        return {
            "scanned": True,
            "matches": formatted_matches,
            "match_count": len(formatted_matches),
            "rule_names": [m["rule_name"] for m in formatted_matches],
        }

    def scan_data(self, data: bytes, namespace: str = "direct_scan") -> Dict[str, any]:
        """Scan raw data with YARA rules."""
        if not YARA_AVAILABLE or self.compiled_rules is None:
            return {
                "scanned": False,
                "reason": "YARA not available",
                "matches": [],
                "match_count": 0,
            }

        try:
            matches = self.compiled_rules.match(data=data, timeout=30)
        except Exception as e:
            return {
                "scanned": False,
                "reason": str(e),
                "matches": [],
                "match_count": 0,
            }

        formatted_matches = []
        for match in matches:
            rule_info = {
                "rule_name": match.rule,
                "namespace": match.namespace,
                "tags": match.tags,
                "meta": dict(match.meta) if match.meta else {},
            }
            formatted_matches.append(rule_info)

        return {
            "scanned": True,
            "matches": formatted_matches,
            "match_count": len(formatted_matches),
            "rule_names": [m["rule_name"] for m in formatted_matches],
        }

    def get_loaded_rules_count(self) -> int:
        """Get the number of compiled rules."""
        if self.compiled_rules is None:
            return 0
        return len(self.compiled_rules)


scanner_instance = None


def get_yara_scanner() -> YaraScanner:
    global scanner_instance
    if scanner_instance is None:
        scanner_instance = YaraScanner()
    return scanner_instance


def scan_file_with_yara(file_path: str) -> Dict[str, any]:
    """Convenience function to scan a file."""
    scanner = get_yara_scanner()
    return scanner.scan_file(file_path)
