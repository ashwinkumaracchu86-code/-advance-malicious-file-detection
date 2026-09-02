import os
import json
import math
from typing import Dict, List, Any


DANGEROUS_EXTENSIONS = {
    ".exe", ".dll", ".scr", ".com", ".bat", ".cmd", ".vbs", ".vbe", ".js",
    ".jse", ".wsf", ".wsh", ".ps1", ".psm1", ".psd1", ".msc", ".msp",
    ".mst", ".pif", ".hta", ".cpl", ".inf", ".reg", ".rgs", ".sct",
    ".shb", ".shs", ".lnk", ".application", ".gadget", ".webpnp",
    ".xnk", ".settingcontent-ms", ".library-ms", ".searchConnector-ms",
}

MODERATE_RISK_EXTENSIONS = {
    ".doc", ".docx", ".docm", ".xls", ".xlsm", ".ppt", ".pptm",
    ".rtf", ".odt", ".ods", ".odp", ".pdf", ".swf",
}

SAFE_EXTENSIONS = {
    ".txt", ".csv", ".json", ".xml", ".html", ".css", ".js",
    ".py", ".java", ".c", ".cpp", ".h", ".hpp", ".rb", ".go",
    ".rs", ".ts", ".tsx", ".jsx", ".vue", ".svelte",
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".ico", ".webp",
    ".mp3", ".mp4", ".wav", ".flac", ".ogg", ".avi", ".mkv", ".mov",
    ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z",
}


def calculate_risk_score(
    entropy: float,
    suspicious_count: int,
    yara_match_count: int,
    extension: str,
    mime_type: str,
    extension_matches_mime: bool,
    file_size: int,
    vt_positives: int = 0,
    vt_total: int = 0,
) -> Dict[str, any]:
    """Calculate a risk score from 0 to 100 based on multiple factors.

    Factors:
    - Entropy (0-20 points): High entropy may indicate packed/encrypted content.
    - Suspicious strings (0-20 points): Suspicious patterns found in file.
    - YARA matches (0-25 points): Rule matches from YARA engine.
    - Extension danger (0-15 points): File extension risk level.
    - MIME mismatch (0-10 points): Extension does not match MIME type.
    - File size anomalies (0-5 points): Very small or very large files.
    - VirusTotal (0-5 points): External detection results.
    """
    score = 0.0
    reasons = []

    # 1. Entropy analysis (0-20 points)
    if entropy >= 7.0:
        score += 20
        reasons.append(f"Very high entropy ({entropy:.2f}) suggests packed/encrypted content")
    elif entropy >= 6.5:
        score += 15
        reasons.append(f"High entropy ({entropy:.2f}) may indicate obfuscation")
    elif entropy >= 5.0:
        score += 8
        reasons.append(f"Medium-high entropy ({entropy:.2f})")
    elif entropy < 1.0:
        score += 5
        reasons.append(f"Very low entropy ({entropy:.2f}) may indicate zero-filled or padded file")

    # 2. Suspicious strings (0-20 points)
    if suspicious_count >= 10:
        score += 20
        reasons.append(f"High count of suspicious strings ({suspicious_count})")
    elif suspicious_count >= 5:
        score += 12
        reasons.append(f"Moderate suspicious strings found ({suspicious_count})")
    elif suspicious_count >= 1:
        score += 5
        reasons.append(f"Some suspicious strings detected ({suspicious_count})")

    # 3. YARA matches (0-25 points)
    if yara_match_count >= 3:
        score += 25
        reasons.append(f"Multiple YARA rules matched ({yara_match_count})")
    elif yara_match_count == 2:
        score += 18
        reasons.append(f"Two YARA rules matched")
    elif yara_match_count == 1:
        score += 10
        reasons.append("One YARA rule matched")

    # 4. Extension danger (0-15 points)
    ext_lower = extension.lower() if extension else ""
    if ext_lower in DANGEROUS_EXTENSIONS:
        score += 15
        reasons.append(f"Dangerous file extension ({ext_lower})")
    elif ext_lower in MODERATE_RISK_EXTENSIONS:
        score += 7
        reasons.append(f"Moderate-risk file extension ({ext_lower})")

    # 5. MIME mismatch (0-10 points)
    if not extension_matches_mime:
        score += 10
        reasons.append(f"Extension {ext_lower} does not match MIME type {mime_type}")

    # 6. File size anomalies (0-5 points)
    if file_size == 0:
        score += 3
        reasons.append("Empty file (0 bytes)")
    elif file_size < 100:
        score += 2
        reasons.append("Very small file size")
    elif file_size > 100 * 1024 * 1024:
        score += 3
        reasons.append("Unusually large file size (>100MB)")

    # 7. VirusTotal results (0-5 points)
    if vt_total > 0:
        ratio = vt_positives / vt_total
        if ratio >= 0.5:
            score += 5
            reasons.append(f"High VirusTotal detection rate ({vt_positives}/{vt_total})")
        elif ratio >= 0.2:
            score += 3
            reasons.append(f"Moderate VirusTotal detection ({vt_positives}/{vt_total})")
        elif ratio > 0:
            score += 1
            reasons.append(f"Low VirusTotal detection ({vt_positives}/{vt_total})")

    score = min(100.0, max(0.0, score))

    # Classification
    if score >= 70:
        classification = "malicious"
    elif score >= 40:
        classification = "suspicious"
    elif score >= 15:
        classification = "low_risk"
    else:
        classification = "safe"

    return {
        "risk_score": round(score, 2),
        "classification": classification,
        "reasons": reasons,
        "factor_breakdown": {
            "entropy_score": min(20, entropy * 2.5) if entropy else 0,
            "suspicious_strings_score": min(20, suspicious_count * 2),
            "yara_score": min(25, yara_match_count * 10),
            "extension_score": 15 if ext_lower in DANGEROUS_EXTENSIONS else (7 if ext_lower in MODERATE_RISK_EXTENSIONS else 0),
            "mismatch_score": 10 if not extension_matches_mime else 0,
            "size_score": 5 if file_size == 0 else 0,
            "vt_score": 5 if vt_total > 0 and vt_positives / vt_total >= 0.5 else 0,
        },
    }
