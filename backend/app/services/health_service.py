import os
import platform
import logging
from typing import Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def get_system_health() -> Dict[str, Any]:
    """Get comprehensive system health information."""
    health = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "system": _get_system_info(),
        "resources": _get_resource_usage(),
        "services": _get_service_status(),
    }

    cpu = health["resources"]["cpu_percent"]
    memory = health["resources"]["memory_percent"]
    disk = health["resources"]["disk_percent"]

    if cpu > 90 or memory > 90 or disk > 95:
        health["status"] = "critical"
    elif cpu > 70 or memory > 70 or disk > 80:
        health["status"] = "warning"

    return health


def _get_system_info() -> Dict[str, Any]:
    """Get basic system information."""
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "platform": platform.platform(),
        "architecture": platform.machine(),
        "python_version": platform.python_version(),
        "hostname": platform.node(),
        "processor": platform.processor() or "Unknown",
    }


def _get_resource_usage() -> Dict[str, Any]:
    """Get CPU, memory, and disk usage."""
    result = {
        "cpu_percent": 0.0,
        "memory_percent": 0.0,
        "memory_used_mb": 0,
        "memory_total_mb": 0,
        "disk_percent": 0.0,
        "disk_used_gb": 0,
        "disk_total_gb": 0,
    }

    try:
        import psutil
        psutil.cpu_percent(interval=None)
        import time
        time.sleep(0.1)
        result["cpu_percent"] = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()
        result["memory_percent"] = mem.percent
        result["memory_used_mb"] = round(mem.used / (1024 * 1024), 1)
        result["memory_total_mb"] = round(mem.total / (1024 * 1024), 1)
        disk_path = "C:\\"
        disk = psutil.disk_usage(disk_path)
        result["disk_percent"] = disk.percent
        result["disk_used_gb"] = round(disk.used / (1024 ** 3), 2)
        result["disk_total_gb"] = round(disk.total / (1024 ** 3), 2)
    except Exception as e:
        logger.error(f"Failed to get resource usage: {e}")
        try:
            import shutil
            total, used, free = shutil.disk_usage("C:\\")
            result["disk_percent"] = round((used / total) * 100, 1)
            result["disk_used_gb"] = round(used / (1024 ** 3), 2)
            result["disk_total_gb"] = round(total / (1024 ** 3), 2)
        except Exception:
            pass

    return result


def _get_service_status() -> Dict[str, Any]:
    """Get status of various services."""
    from ..scanner.clamav_scanner import get_clamav_status

    clamav = get_clamav_status()

    yara_status = "unknown"
    try:
        from ..scanner.yara_scanner import get_yara_scanner
        scanner = get_yara_scanner()
        yara_status = "active" if scanner.compiled_rules else "inactive"
    except Exception:
        yara_status = "error"

    return {
        "database": "active",
        "yara_scanner": yara_status,
        "clamav": "active" if clamav["available"] else "unavailable",
        "realtime_protection": "active",
    }
