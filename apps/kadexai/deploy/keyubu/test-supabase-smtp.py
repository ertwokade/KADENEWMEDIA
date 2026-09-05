#!/usr/bin/env python3
"""Validate the configured SMTP transport without sending an email."""

from __future__ import annotations

import smtplib
import ssl
from pathlib import Path


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        if not raw_line or raw_line.startswith("#") or "=" not in raw_line:
            continue
        key, value = raw_line.split("=", 1)
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


config = read_env(Path("/srv/kade/secrets/supabase.env"))
host = config["SMTP_HOST"]
port = int(config["SMTP_PORT"])
user = config["SMTP_USER"]
password = config["SMTP_PASS"]

with smtplib.SMTP(host, port, timeout=15) as client:
    client.ehlo()
    client.starttls(context=ssl.create_default_context())
    client.ehlo()
    client.login(user, password)

print(f"SMTP_LOGIN=ok HOST={host} PORT={port}")
