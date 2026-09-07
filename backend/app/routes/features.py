import os
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..security.auth import get_current_user, require_admin
from ..models.models import User
from ..services import webhook_service, scheduler_service, health_service, yara_rules_service, export_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Advanced Features"])


@router.get("/health/system")
def system_health():
    """Get comprehensive system health information."""
    return health_service.get_system_health()


@router.get("/webhooks/status")
def webhook_status(current_user: User = Depends(get_current_user)):
    """Get webhook configuration status."""
    return webhook_service.get_webhook_status()


@router.post("/webhooks/test")
def test_webhooks(current_user: User = Depends(get_current_user)):
    """Send a test alert to all configured webhooks."""
    result = webhook_service.send_threat_alert(
        filename="test_file.exe",
        risk_score=85.0,
        classification="malicious",
        reasons=["Test alert from MFDS"],
    )
    return {"status": "sent", "results": result}


@router.get("/scheduler/jobs")
def list_scheduled_scans(current_user: User = Depends(get_current_user)):
    """List all scheduled scan jobs."""
    jobs = scheduler_service.get_scheduled_scans()
    serializable_jobs = []
    for job in jobs:
        sj = {k: v for k, v in job.items()}
        for key in ("created_at", "next_run", "last_run"):
            if sj.get(key):
                sj[key] = sj[key].isoformat()
        serializable_jobs.append(sj)
    return {"jobs": serializable_jobs}


@router.post("/scheduler/add")
def add_scheduled_scan(
    folder_path: str = Query(..., description="Folder path to scan"),
    interval_minutes: int = Query(60, ge=10, description="Scan interval in minutes"),
    name: str = Query("", description="Job name"),
    current_user: User = Depends(require_admin),
):
    """Add a new scheduled scan (admin only)."""
    return scheduler_service.add_scheduled_scan(folder_path, interval_minutes, name)


@router.delete("/scheduler/{job_id}")
def remove_scheduled_scan(
    job_id: int,
    current_user: User = Depends(require_admin),
):
    """Remove a scheduled scan job (admin only)."""
    return scheduler_service.remove_scheduled_scan(job_id)


@router.post("/scheduler/{job_id}/toggle")
def toggle_scheduled_scan(
    job_id: int,
    enabled: bool = Query(...),
    current_user: User = Depends(require_admin),
):
    """Enable or disable a scheduled scan (admin only)."""
    return scheduler_service.toggle_scheduled_scan(job_id, enabled)


@router.get("/yara-rules/list")
def list_yara_rules(current_user: User = Depends(get_current_user)):
    """List all YARA rule files."""
    return {"rules": yara_rules_service.get_custom_rules()}


@router.post("/yara-rules/upload")
async def upload_yara_rule(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
):
    """Upload a custom YARA rule file (admin only)."""
    content = await file.read()
    return yara_rules_service.upload_rule(file.filename, content)


@router.delete("/yara-rules/{filename}")
def delete_yara_rule(
    filename: str,
    current_user: User = Depends(require_admin),
):
    """Delete a YARA rule file (admin only)."""
    return yara_rules_service.delete_rule(filename)


@router.post("/yara-rules/reload")
def reload_yara_rules(current_user: User = Depends(get_current_user)):
    """Reload all YARA rules."""
    return yara_rules_service.reload_rules()


@router.get("/yara-rules/{filename}")
def get_yara_rule_content(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """Get content of a YARA rule file."""
    return yara_rules_service.get_rule_content(filename)


@router.get("/export/scans/csv")
def export_scans_csv(
    limit: int = Query(1000, ge=1, le=10000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all scans as CSV."""
    csv_data = export_service.export_scans_csv(db, limit)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=scan_results.csv"},
    )


@router.get("/export/scans/json")
def export_scans_json(
    limit: int = Query(1000, ge=1, le=10000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all scans as JSON."""
    json_data = export_service.export_scans_json(db, limit)
    return Response(
        content=json.dumps(json_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=scan_results.json"},
    )


@router.get("/export/threats/csv")
def export_threats_csv(
    limit: int = Query(1000, ge=1, le=10000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export threats only as CSV."""
    csv_data = export_service.export_threats_csv(db, limit)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=threats.csv"},
    )
