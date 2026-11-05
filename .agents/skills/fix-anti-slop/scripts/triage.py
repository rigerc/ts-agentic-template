#!/usr/bin/env python3
"""Summarize Oxlint --format=json findings without modifying project files.

Usage:
    python3 triage.py oxlint.json [--baseline oxlint-before.json]
    python3 triage.py - --output json

The script reports diagnostics, not the lint process exit status. Verify that
Oxlint actually executed with the expected config and scope.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re
import sys
from typing import Any


_RULE = re.compile(r"^(anti-slop(?:-effect)?|oxc)[(/](.+?)\)?$")


def normalize_code(value: Any) -> str:
    """Oxlint commonly prints `plugin(rule)`; configs often say `plugin/rule`."""
    code = value if isinstance(value, str) else "<missing-rule>"
    match = _RULE.fullmatch(code)
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    return code


def relevant_rule(code: str) -> bool:
    return (
        code.startswith("anti-slop/")
        or code.startswith("anti-slop-effect/")
        or code == "oxc/no-accumulating-spread"
    )


def read_report(path: str) -> tuple[list[dict[str, Any]], int | None]:
    try:
        if path == "-":
            data = json.load(sys.stdin)
        else:
            with Path(path).open(encoding="utf-8") as handle:
                data = json.load(handle)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ValueError(f"Cannot read Oxlint JSON from {path!r}: {error}") from error

    if not isinstance(data, dict) or not isinstance(data.get("diagnostics"), list):
        raise ValueError(
            f"Invalid Oxlint JSON in {path!r}: expected an object with a diagnostics array"
        )
    files = data.get("number_of_files")
    if files is not None and (type(files) is not int or files < 0):
        raise ValueError(f"Invalid number_of_files in {path!r}")
    findings = data["diagnostics"]
    if not all(isinstance(finding, dict) for finding in findings):
        raise ValueError(f"Invalid diagnostics in {path!r}: every item must be an object")
    return findings, files


def coerce_position(finding: dict[str, Any]) -> tuple[int | None, int | None]:
    labels = finding.get("labels", [])
    if not isinstance(labels, list):
        return (None, None)
    for label in labels:
        if not isinstance(label, dict) or not isinstance(label.get("span"), dict):
            continue
        span = label["span"]
        line, col = span.get("line"), span.get("column")
        return (
            line if isinstance(line, int) and not isinstance(line, bool) else None,
            col if isinstance(col, int) and not isinstance(col, bool) else None,
        )
    return (None, None)


def clean(diagnostics: list[dict[str, Any]], include_all: bool) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for finding in diagnostics:
        code = normalize_code(finding.get("code"))
        if not include_all and not relevant_rule(code):
            continue
        line, column = coerce_position(finding)
        severity = finding.get("severity")
        records.append(
            {
                "code": code,
                "severity": str(severity).lower() if severity is not None else "unknown",
                "filename": str(finding.get("filename") or "<unknown-file>"),
                "line": line,
                "column": column,
                "message": str(finding.get("message") or ""),
                "help": str(finding.get("help") or ""),
            }
        )
    return sorted(
        records,
        key=lambda r: (
            r["code"], r["filename"], r["line"] or 0, r["column"] or 0, r["message"]
        ),
    )


def signature(record: dict[str, Any]) -> tuple[str, str, str, str]:
    # Deliberately ignore line/column; formatting can move unchanged diagnostics.
    return (record["code"], record["filename"], record["severity"], record["message"])


def count_by_rule(records: list[dict[str, Any]]) -> Counter[str]:
    return Counter(record["code"] for record in records)


def compare(
    after: list[dict[str, Any]], before: list[dict[str, Any]]
) -> dict[str, Any]:
    new, old = Counter(map(signature, after)), Counter(map(signature, before))
    introduced, resolved = new - old, old - new
    return {
        "introduced": sum(introduced.values()),
        "resolved": sum(resolved.values()),
        "by_rule": [
            {"rule": rule, "before": count_by_rule(before)[rule], "after": count_by_rule(after)[rule]}
            for rule in sorted(set(count_by_rule(before)) | set(count_by_rule(after)))
        ],
    }


def report_as_dict(
    records: list[dict[str, Any]], file_count: int | None, baseline: list[dict[str, Any]] | None
) -> dict[str, Any]:
    counts = Counter(record["severity"] for record in records)
    summary: dict[str, Any] = {
        "total": len(records),
        "errors": counts["error"],
        "warnings": counts["warning"],
        "other_severities": sum(count for sev, count in counts.items() if sev not in ("error", "warning")),
        "files_with_findings": len(set(record["filename"] for record in records)),
        "files_linted": file_count,
        "rules": dict(sorted(count_by_rule(records).items())),
        "diagnostics": records,
    }
    if baseline is not None:
        summary["comparison"] = compare(records, baseline)
    return summary


def print_text(summary: dict[str, Any], limit: int) -> None:
    num_files = summary["files_linted"]
    files_note = "unknown" if num_files is None else str(num_files)
    print(
        f"Relevant diagnostics: {summary['total']} "
        f"({summary['errors']} errors, {summary['warnings']} warnings, "
        f"{summary['other_severities']} other severities); "
        f"{summary['files_with_findings']} affected files; {files_note} files linted."
    )
    if num_files == 0:
        print("WARNING: Oxlint reports zero linted files; a clean report here is not proof of success.")
    elif num_files is None:
        print("NOTE: JSON has no number_of_files; independently verify lint scope/configuration.")
    by_rule: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in summary["diagnostics"]:
        by_rule[item["code"]].append(item)
    for rule, group in sorted(by_rule.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        print(f"\n{rule} — {len(group)}")
        for item in group[:limit]:
            pos = f"{item['filename']}:{item['line'] or '?'}:{item['column'] or '?'}"
            print(f"  {pos} [{item['severity']}]: {item['message']}")
            if item["help"]:
                print(f"    help: {item['help']}")
        if len(group) > limit:
            print(f"  ... {len(group) - limit} more (raise --limit or use --output json)")
    if "comparison" in summary:
        comp = summary["comparison"]
        print(f"\nBaseline comparison: {comp['resolved']} resolved; {comp['introduced']} introduced.")
        print("(Matching by rule, file, severity and message; line moves do not count as changes.)")
        for item in comp["by_rule"]:
            if item["before"] != item["after"]:
                print(f"  {item['rule']}: {item['before']} -> {item['after']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", help="Oxlint --format=json file, or - for stdin")
    parser.add_argument("--baseline", help="Earlier Oxlint JSON file for before/after comparison")
    parser.add_argument("--include-all", action="store_true", help="Include diagnostics from all Oxlint rules")
    parser.add_argument("--output", choices=("text", "json"), default="text")
    parser.add_argument("--limit", type=int, default=8, help="Maximum displayed findings per rule (default 8)")
    args = parser.parse_args(argv)
    if args.limit <= 0:
        parser.error("--limit must be positive")
    if args.report == "-" and args.baseline == "-":
        parser.error("cannot read both report and baseline from stdin")
    try:
        findings, file_count = read_report(args.report)
        baseline = read_report(args.baseline)[0] if args.baseline else None
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2
    records = clean(findings, include_all=args.include_all)
    before = clean(baseline, include_all=args.include_all) if baseline is not None else None
    summary = report_as_dict(records, file_count, before)
    if args.output == "json":
        print(json.dumps(summary, indent=2))
    else:
        print_text(summary, args.limit)
    return 0


if __name__ == "__main__":
    sys.exit(main())
