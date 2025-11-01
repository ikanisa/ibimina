"""Secrets Manager rotation handler for Ibimina application secrets.

This function rotates the composite secret stored in AWS Secrets Manager by
refreshing the crypto material (FIELD_ENCRYPTION_KEY) while preserving the
static configuration values that are managed elsewhere. The handler implements
all required rotation steps so AWS can orchestrate the workflow automatically.
"""
from __future__ import annotations

import base64
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

secretsmanager = boto3.client("secretsmanager")

AUTO_ROTATED_KEYS = {"FIELD_ENCRYPTION_KEY"}
ROTATION_METADATA_KEY = "LAST_ROTATED_AT"


class RotationError(Exception):
    """Raised when the rotation workflow encounters a fatal error."""


def handler(event: Dict[str, Any], _context: Any) -> None:
    """Dispatch the Secrets Manager rotation step.

    Parameters
    ----------
    event: Dict[str, Any]
        AWS rotation event payload describing the secret and current step.
    _context: Any
        Lambda context (unused).
    """

    secret_id = event["SecretId"]
    token = event["ClientRequestToken"]
    step = event["Step"]

    logger.info("Handling rotation step", extra={"step": step})

    metadata = secretsmanager.describe_secret(SecretId=secret_id)
    versions = metadata.get("VersionIdsToStages", {})

    if token not in versions:
        raise RotationError("Secret version token not set on metadata")

    version_stages = versions[token]
    if "AWSCURRENT" in version_stages:
        logger.info("Secret version already marked as current; no action needed")
        return
    if "AWSPENDING" not in version_stages:
        raise RotationError("Secret version not marked as AWSPENDING")

    if step == "createSecret":
        _create_secret(secret_id, token)
    elif step == "setSecret":
        _set_secret(secret_id, token)
    elif step == "testSecret":
        _test_secret(secret_id, token)
    elif step == "finishSecret":
        _finish_secret(secret_id, token, versions)
    else:
        raise RotationError(f"Unknown rotation step '{step}'")


def _create_secret(secret_id: str, token: str) -> None:
    try:
        secretsmanager.get_secret_value(
            SecretId=secret_id,
            VersionId=token,
            VersionStage="AWSPENDING",
        )
        logger.info("Pending secret version already created; skipping regeneration")
        return
    except ClientError as exc:  # pragma: no cover - handled by AWS at runtime
        if exc.response["Error"]["Code"] != "ResourceNotFoundException":
            raise

    current_secret = _load_secret(secret_id, "AWSCURRENT")
    pending_secret = _generate_rotated_secret(current_secret)

    secretsmanager.put_secret_value(
        SecretId=secret_id,
        ClientRequestToken=token,
        SecretString=json.dumps(pending_secret),
        VersionStages=["AWSPENDING"],
    )
    logger.info("Stored rotated secret candidate")


def _set_secret(secret_id: str, token: str) -> None:
    # All values are stored directly in Secrets Manager, so no downstream action
    # is required to materialise the pending secret.
    logger.debug(
        "SetSecret step is a no-op for application configuration secrets",
        extra={"secret_id": secret_id, "token": token},
    )


def _test_secret(secret_id: str, token: str) -> None:
    candidate = _load_secret(secret_id, "AWSPENDING", token)

    missing = [key for key in AUTO_ROTATED_KEYS if key not in candidate]
    if missing:
        raise RotationError(f"Pending secret missing rotated keys: {missing}")

    field_key = candidate["FIELD_ENCRYPTION_KEY"]
    try:
        raw = base64.b64decode(field_key, validate=True)
    except (ValueError, TypeError) as exc:  # pragma: no cover
        raise RotationError("FIELD_ENCRYPTION_KEY is not valid base64") from exc

    if len(raw) != 32:
        raise RotationError("FIELD_ENCRYPTION_KEY must decode to 32 bytes")

    logger.info("Validated rotated secret candidate")


def _finish_secret(secret_id: str, token: str, versions: Dict[str, Any]) -> None:
    current_version = next(
        (version for version, stages in versions.items() if "AWSCURRENT" in stages),
        None,
    )

    if current_version == token:
        logger.info("Pending version already current; skipping finish")
        return

    if current_version:
        secretsmanager.update_secret_version_stage(
            SecretId=secret_id,
            VersionStage="AWSCURRENT",
            MoveToVersionId=token,
            RemoveFromVersionId=current_version,
        )
    else:  # pragma: no cover - defensive branch
        secretsmanager.update_secret_version_stage(
            SecretId=secret_id,
            VersionStage="AWSCURRENT",
            MoveToVersionId=token,
        )

    logger.info("Promoted rotated secret to AWSCURRENT")


def _load_secret(secret_id: str, stage: str, version_id: str | None = None) -> Dict[str, Any]:
    params: Dict[str, Any] = {"SecretId": secret_id, "VersionStage": stage}
    if version_id:
        params["VersionId"] = version_id

    response = secretsmanager.get_secret_value(**params)
    if "SecretString" not in response:
        raise RotationError("Secret value does not contain a SecretString")

    try:
        return json.loads(response["SecretString"])
    except json.JSONDecodeError as exc:  # pragma: no cover
        raise RotationError("Secret string is not valid JSON") from exc


def _generate_rotated_secret(current_secret: Dict[str, Any]) -> Dict[str, Any]:
    updated = dict(current_secret)
    updated["FIELD_ENCRYPTION_KEY"] = base64.b64encode(os.urandom(32)).decode()
    updated[ROTATION_METADATA_KEY] = datetime.now(timezone.utc).isoformat()
    return updated


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit("This module is intended to be invoked by AWS Lambda only.")
