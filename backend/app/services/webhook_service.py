import os
import json
import logging
import requests
from typing import Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

WEBHOOK_SLACK_URL = os.getenv("WEBHOOK_SLACK_URL", "")
WEBHOOK_DISCORD_URL = os.getenv("WEBHOOK_DISCORD_URL", "")
WEBHOOK_CUSTOM_URL = os.getenv("WEBHOOK_CUSTOM_URL", "")


def send_slack_alert(title: str, message: str, severity: str = "info") -> bool:
    """Send alert to Slack webhook."""
    if not WEBHOOK_SLACK_URL:
        logger.info("Slack webhook not configured")
        return False

    color_map = {
        "info": "#36a64f",
        "warning": "#ff9900",
        "danger": "#ff0000",
        "critical": "#cc0000",
    }

    payload = {
        "attachments": [
            {
                "color": color_map.get(severity, "#36a64f"),
                "title": f"[MFDS] {title}",
                "text": message,
                "footer": "Malicious File Detection System",
                "ts": int(datetime.now(timezone.utc).timestamp()),
            }
        ]
    }

    try:
        resp = requests.post(WEBHOOK_SLACK_URL, json=payload, timeout=10)
        resp.raise_for_status()
        logger.info("Slack alert sent successfully")
        return True
    except Exception as e:
        logger.error(f"Slack alert failed: {e}")
        return False


def send_discord_alert(title: str, message: str, severity: str = "info") -> bool:
    """Send alert to Discord webhook."""
    if not WEBHOOK_DISCORD_URL:
        logger.info("Discord webhook not configured")
        return False

    color_map = {
        "info": 0x36A64F,
        "warning": 0xFF9900,
        "danger": 0xFF0000,
        "critical": 0xCC0000,
    }

    payload = {
        "embeds": [
            {
                "title": f"[MFDS] {title}",
                "description": message,
                "color": color_map.get(severity, 0x36A64F),
                "footer": {"text": "Malicious File Detection System"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ]
    }

    try:
        resp = requests.post(WEBHOOK_DISCORD_URL, json=payload, timeout=10)
        resp.raise_for_status()
        logger.info("Discord alert sent successfully")
        return True
    except Exception as e:
        logger.error(f"Discord alert failed: {e}")
        return False


def send_custom_webhook(title: str, message: str, severity: str = "info", data: Optional[Dict] = None) -> bool:
    """Send alert to custom webhook URL."""
    if not WEBHOOK_CUSTOM_URL:
        logger.info("Custom webhook not configured")
        return False

    payload = {
        "title": title,
        "message": message,
        "severity": severity,
        "source": "malicious-file-detection",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data or {},
    }

    try:
        resp = requests.post(WEBHOOK_CUSTOM_URL, json=payload, timeout=10)
        resp.raise_for_status()
        logger.info("Custom webhook alert sent successfully")
        return True
    except Exception as e:
        logger.error(f"Custom webhook alert failed: {e}")
        return False


def send_threat_alert(filename: str, risk_score: float, classification: str, reasons: list) -> Dict[str, Any]:
    """Send threat alert to all configured webhooks."""
    severity = "danger" if classification == "malicious" else "warning"
    title = f"Threat Detected: {filename}"
    message = f"File: {filename}\nRisk Score: {risk_score}/100\nClassification: {classification.upper()}\nReasons:\n" + "\n".join(f"- {r}" for r in reasons)

    results = {
        "slack": send_slack_alert(title, message, severity),
        "discord": send_discord_alert(title, message, severity),
        "custom": send_custom_webhook(title, message, severity, {
            "filename": filename,
            "risk_score": risk_score,
            "classification": classification,
            "reasons": reasons,
        }),
    }

    return results


def get_webhook_status() -> Dict[str, Any]:
    """Get status of all webhook configurations."""
    return {
        "slack": {"configured": bool(WEBHOOK_SLACK_URL), "url": WEBHOOK_SLACK_URL[:30] + "..." if len(WEBHOOK_SLACK_URL) > 30 else WEBHOOK_SLACK_URL},
        "discord": {"configured": bool(WEBHOOK_DISCORD_URL), "url": WEBHOOK_DISCORD_URL[:30] + "..." if len(WEBHOOK_DISCORD_URL) > 30 else WEBHOOK_DISCORD_URL},
        "custom": {"configured": bool(WEBHOOK_CUSTOM_URL), "url": WEBHOOK_CUSTOM_URL[:30] + "..." if len(WEBHOOK_CUSTOM_URL) > 30 else WEBHOOK_CUSTOM_URL},
    }
