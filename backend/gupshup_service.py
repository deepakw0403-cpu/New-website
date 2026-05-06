"""
Gupshup WhatsApp service — sends OTPs via the approved
authentication-category template.

Env keys (set in /app/backend/.env):
  GUPSHUP_API_KEY            — App API Key from Gupshup dashboard
  GUPSHUP_APP_NAME           — App name (used as src.name)
  GUPSHUP_SOURCE_PHONE       — Verified WA Business number, E.164 without '+'
                                (e.g. 918920724832)
  GUPSHUP_OTP_TEMPLATE_ID    — Approved template UUID
"""
import os
import re
import json
import logging
import httpx

logger = logging.getLogger(__name__)

GUPSHUP_TEMPLATE_URL = "https://api.gupshup.io/wa/api/v1/template/msg"


def normalize_indian_phone(raw: str) -> tuple[bool, str | None]:
    """
    Validate + normalize an Indian phone number to E.164 without '+'.

    Accepts: '9876543210', '+919876543210', '919876543210', '91 98765 43210'
    Returns (is_valid, '919876543210') or (False, None).

    Indian mobile numbers must start with 6, 7, 8, or 9 after the country code.
    """
    if not raw:
        return False, None
    digits = re.sub(r"\D", "", str(raw))

    if len(digits) == 10:
        # No country code
        if digits[0] not in "6789":
            return False, None
        return True, "91" + digits

    if len(digits) == 12 and digits.startswith("91"):
        if digits[2] not in "6789":
            return False, None
        return True, digits

    return False, None


async def send_whatsapp_otp(destination_phone_e164: str, otp_code: str) -> dict:
    """
    Send a 6-digit OTP via Gupshup WhatsApp template.

    `destination_phone_e164` must be E.164 without leading '+', e.g. 918130087033.
    Returns dict with `success: bool`, `message_id: str|None`, `error: str|None`.
    """
    api_key = os.environ.get("GUPSHUP_API_KEY", "").strip()
    src_name = os.environ.get("GUPSHUP_APP_NAME", "").strip()
    source = os.environ.get("GUPSHUP_SOURCE_PHONE", "").strip()
    template_id = os.environ.get("GUPSHUP_OTP_TEMPLATE_ID", "").strip()

    if not all([api_key, src_name, source, template_id]):
        return {"success": False, "error": "Gupshup credentials not configured"}

    payload = {
        "source": source,
        "destination": destination_phone_e164,
        "src.name": src_name,
        "template": json.dumps({"id": template_id, "params": [otp_code]}),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                GUPSHUP_TEMPLATE_URL,
                headers={
                    "apikey": api_key,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data=payload,
            )
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}

        if r.status_code in range(200, 300) and (body.get("status") == "submitted" or body.get("messageId")):
            logger.info(f"Gupshup OTP sent → {destination_phone_e164}: messageId={body.get('messageId')}")
            return {"success": True, "message_id": body.get("messageId"), "raw": body}

        logger.error(f"Gupshup send failed (status={r.status_code}): {body}")
        return {
            "success": False,
            "error": body.get("message") or f"Gupshup error (HTTP {r.status_code})",
            "raw": body,
        }
    except httpx.TimeoutException:
        return {"success": False, "error": "Gupshup request timed out"}
    except Exception as e:  # noqa: BLE001 — boundary
        logger.error(f"Gupshup send exception: {e}")
        return {"success": False, "error": str(e)}
