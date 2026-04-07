#!/usr/bin/env python3
"""Find messages specifically about the 6.2 plan discussion."""
import json, os

SESSION = os.path.expanduser(
    "~/Library/Application Support/Code/User/workspaceStorage/"
    "74e18f50f13deb98ad4c173fb89b37ea/chatSessions/"
    "2bddfb3c-7b02-4e3a-8d95-acdf7f1a7555.json"
)
OUT = "/Users/david/Library/CloudStorage/OneDrive-Persönlich/2privat/coden/website6/_reference/chat_6_2_plan.txt"

KEYWORDS_USER = ["website_assets", "Website struktur", "vertikal_quad", "vertikal_grid",
                 "loading-screen", "loading1", "loading2"]

with open(SESSION, "r", encoding="utf-8") as f:
    data = json.load(f)

lines = []
lines.append("EXTRACTED: Messages about Website struktur / assets / 6.2 plan")
lines.append("Total session messages: %d" % len(data["requests"]))
lines.append("=" * 80)

found = 0
for i, req in enumerate(data["requests"]):
    msg = req.get("message", {})
    user_text = msg.get("text", "") if isinstance(msg, dict) else str(msg)

    resp_texts = []
    resp = req.get("response", [])
    if isinstance(resp, list):
        for r in resp:
            if isinstance(r, dict):
                val = r.get("value", "")
                if isinstance(val, dict):
                    val = val.get("value", str(val))
                if isinstance(val, str):
                    resp_texts.append(val)
    all_resp = " ".join(resp_texts)

    parts = msg.get("parts", []) if isinstance(msg, dict) else []
    attachment_strs = []
    for p in parts:
        if isinstance(p, dict):
            uri = p.get("uri", p.get("value", ""))
            if isinstance(uri, dict):
                uri = uri.get("path", uri.get("fsPath", str(uri)))
            if isinstance(uri, str):
                attachment_strs.append(uri)
    all_attach = " ".join(attachment_strs)

    searchable = user_text + " " + all_resp + " " + all_attach
    matched = [kw for kw in KEYWORDS_USER if kw.lower() in searchable.lower()]

    if not matched:
        continue
    found += 1

    lines.append("")
    lines.append("=" * 80)
    lines.append("  MESSAGE %d / %d -- matched: %s" % (i + 1, len(data["requests"]), matched))
    lines.append("=" * 80)
    lines.append("")
    lines.append(">>> USER:")
    lines.append(user_text)
    lines.append("")

    for att in attachment_strs:
        if any(kw.lower() in att.lower() for kw in KEYWORDS_USER):
            lines.append("  [ATTACHMENT]: %s" % att)

    if isinstance(resp, list):
        for r in resp:
            if not isinstance(r, dict):
                continue
            kind = r.get("kind", "")
            val = r.get("value", "")
            if kind == "markdownContent":
                if isinstance(val, dict):
                    val = val.get("value", str(val))
                if isinstance(val, str) and len(val) > 20:
                    lines.append("")
                    lines.append("<<< COPILOT:")
                    lines.append(val)
                    lines.append("")
            elif isinstance(val, str) and len(val) > 100 and kind not in (
                "progressMessage", "prepareToolInvocation", "toolInvocationSerialized",
                "inlineReference", "mcpServersStarting"
            ):
                lines.append("")
                lines.append("<<< [%s]:" % kind)
                lines.append(val[:2000])
                lines.append("")

output = "\n".join(lines)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(output)

print("Found %d messages with direct references" % found)
print("Written to: %s" % OUT)
print("File size: %d KB" % (os.path.getsize(OUT) / 1024))
