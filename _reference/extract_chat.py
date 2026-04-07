#!/usr/bin/env python3
"""Extract chat history from VS Code Copilot session JSON."""
import json, os, textwrap

SESSION_FILE = os.path.expanduser(
    "~/Library/Application Support/Code/User/workspaceStorage/"
    "74e18f50f13deb98ad4c173fb89b37ea/chatSessions/"
    "2bddfb3c-7b02-4e3a-8d95-acdf7f1a7555.json"
)
OUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chat_history.txt")

with open(SESSION_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

lines = []
lines.append(f"Session: {data.get('customTitle', 'no title')}")
lines.append(f"Created: {data.get('creationDate', '?')}")
lines.append(f"Last message: {data.get('lastMessageDate', '?')}")
lines.append(f"Total exchanges: {len(data['requests'])}")
lines.append("=" * 80)

for i, req in enumerate(data["requests"]):
    lines.append(f"\n{'='*80}")
    lines.append(f"  MESSAGE {i+1} / {len(data['requests'])}")
    lines.append(f"{'='*80}")

    # User message
    msg = req.get("message", {})
    if isinstance(msg, dict):
        user_text = msg.get("text", "")
    else:
        user_text = str(msg)
    lines.append(f"\n>>> USER:\n{user_text}\n")

    # Response parts
    resp = req.get("response", [])
    if isinstance(resp, list):
        for r in resp:
            if not isinstance(r, dict):
                continue
            kind = r.get("kind", "?")
            val = r.get("value", "")
            if kind == "markdownContent":
                # This is the main text response
                if isinstance(val, dict):
                    val = val.get("value", str(val))
                lines.append(f"<<< COPILOT:\n{val}\n")
            elif kind == "textEditGroup":
                # Code edits
                uri = ""
                edits_info = []
                if isinstance(val, dict):
                    uri = val.get("uri", {})
                    if isinstance(uri, dict):
                        uri = uri.get("path", str(uri))
                    edits = val.get("edits", [])
                    for ed in edits[:3]:
                        if isinstance(ed, list):
                            for e in ed[:2]:
                                if isinstance(e, dict):
                                    txt = e.get("text", "")[:300]
                                    edits_info.append(txt)
                lines.append(f"<<< EDIT: {uri}")
                for ei in edits_info:
                    lines.append(f"    {ei[:200]}")
                lines.append("")
            elif kind == "codeblockUri":
                lines.append(f"<<< CODEBLOCK: {val}\n")
            elif kind == "command":
                lines.append(f"<<< COMMAND: {val}\n")
            elif kind == "progressMessage":
                pass  # skip progress messages
            else:
                preview = str(val)[:300]
                lines.append(f"<<< [{kind}]: {preview}\n")

output = "\n".join(lines)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(output)

print(f"Extracted {len(data['requests'])} exchanges to: {OUT_FILE}")
print(f"File size: {os.path.getsize(OUT_FILE) / 1024:.0f} KB")
