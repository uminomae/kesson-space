#!/usr/bin/env python3
"""generate-sessions.py — git log → sessions.json

コミットログを3時間の空白で区切り、セッション単位のJSONを生成する。
写真フォルダのように振り返るためのデータ。

Usage:
    python scripts/generate-sessions.py                    # approved repos全部
    python scripts/generate-sessions.py --repo kesson-space # 指定リポジトリのみ
    python scripts/generate-sessions.py --since 2026-02-01  # 日付指定
    python scripts/generate-sessions.py --dry-run           # 書き出さずに標準出力
"""

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
CONFIG_PATH = SCRIPT_DIR / "devlog-config.json"
PROJECT_ROOT = SCRIPT_DIR.parent

DEFAULT_CATEGORIES = {
    "shader": {"pattern": ["shaders/", ".glsl"], "color": "#1a237e"},
    "document": {"pattern": ["docs/", ".md"], "color": "#f59e0b"},
    "config": {"pattern": ["config.", ".json"], "color": "#94a3b8"},
    "code": {"pattern": ["src/", ".js"], "color": "#22c55e"},
    "asset": {"pattern": ["assets/", ".svg", ".png"], "color": "#a855f7"},
    "infra": {"pattern": ["scripts/", ".github/", ".yml"], "color": "#ef4444"},
}

PRESERVE_FIELDS = {"cover", "title_ja", "title_en", "date_range", "end"}


def load_config():
    if not CONFIG_PATH.exists():
        return {}
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def check_approval(repo_name, config, repo_def=None):
    if repo_def and repo_def.get("auto_approve"):
        print(f"  ✓ auto-approved: {repo_name}", file=sys.stderr)
        return repo_def
    for repo in config["approved_repos"]:
        if repo["name"] == repo_name:
            if config.get("auto_approve", False):
                print(f"  ✓ auto-approved: {repo_name}", file=sys.stderr)
                return repo
            else:
                print(f"  ⚠ {repo_name} は承認済みだが auto_approve=false", file=sys.stderr)
                return repo
    print(f"  ✗ {repo_name} は approved_repos に含まれない。スキップ。", file=sys.stderr)
    return None


def get_git_log(repo_path, since=None):
    repo_path = Path(repo_path).expanduser()
    if not (repo_path / ".git").exists():
        print(f"  ✗ .git not found: {repo_path}", file=sys.stderr)
        return []

    cmd = ["git", "-C", str(repo_path), "log", "--format=%H|%aI|%s|%an", "--reverse"]
    if since:
        cmd.append(f"--since={since}")

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ✗ git log failed: {result.stderr}", file=sys.stderr)
        return []

    commits = []
    for line in result.stdout.strip().split("\n"):
        if not line:
            continue
        parts = line.split("|", 3)
        if len(parts) < 4:
            continue
        commits.append({"hash": parts[0], "datetime": parts[1], "message": parts[2], "author": parts[3]})

    cmd_stat = ["git", "-C", str(repo_path), "log", "--format=%H", "--numstat", "--reverse"]
    if since:
        cmd_stat.append(f"--since={since}")

    result_stat = subprocess.run(cmd_stat, capture_output=True, text=True)
    if result_stat.returncode == 0:
        current_hash = None
        file_stats = {}
        for line in result_stat.stdout.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            if len(line) == 40 and all(c in "0123456789abcdef" for c in line):
                current_hash = line
                file_stats[current_hash] = []
            elif current_hash and "\t" in line:
                parts = line.split("\t")
                if len(parts) == 3:
                    ins = int(parts[0]) if parts[0] != "-" else 0
                    dels = int(parts[1]) if parts[1] != "-" else 0
                    file_stats[current_hash].append((ins, dels, parts[2]))

        for commit in commits:
            stats = file_stats.get(commit["hash"], [])
            commit["files"] = [s[2] for s in stats]
            commit["insertions"] = sum(s[0] for s in stats)
            commit["deletions"] = sum(s[1] for s in stats)

    return commits


def split_sessions(commits, gap_hours=3):
    if not commits:
        return []
    sessions = []
    current_session = [commits[0]]
    gap = timedelta(hours=gap_hours)
    for i in range(1, len(commits)):
        prev_dt = datetime.fromisoformat(commits[i - 1]["datetime"])
        curr_dt = datetime.fromisoformat(commits[i]["datetime"])
        if curr_dt - prev_dt > gap:
            sessions.append(current_session)
            current_session = [commits[i]]
        else:
            current_session.append(commits[i])
    if current_session:
        sessions.append(current_session)
    return sessions


def classify_file(filepath, categories):
    for cat_name, cat_def in categories.items():
        for pattern in cat_def["pattern"]:
            if pattern in filepath:
                return cat_name
    return "code"


def dominant_category(files, categories):
    if not files:
        return "code"
    cats = [classify_file(f, categories) for f in files]
    counter = Counter(cats)
    return counter.most_common(1)[0][0]


def calc_intensity(commit_count, insertions, deletions, file_count):
    i1 = min(1.0, commit_count / 30) * 0.5
    i2 = min(1.0, (insertions + deletions) / 500) * 0.3
    i3 = min(1.0, file_count / 15) * 0.2
    return round(i1 + i2 + i3, 3)


def build_session_json(sessions, repo_name, categories):
    result = []
    for idx, session_commits in enumerate(sessions):
        start_dt = session_commits[0]["datetime"]
        end_dt = session_commits[-1]["datetime"]
        t0 = datetime.fromisoformat(start_dt)
        t1 = datetime.fromisoformat(end_dt)
        duration_min = max(1, int((t1 - t0).total_seconds() / 60))
        all_files = []
        total_ins = 0
        total_dels = 0
        for c in session_commits:
            all_files.extend(c.get("files", []))
            total_ins += c.get("insertions", 0)
            total_dels += c.get("deletions", 0)
        unique_files = sorted(set(all_files))
        messages = [c["message"] for c in session_commits]
        dom_cat = dominant_category(unique_files, categories)
        intensity = calc_intensity(len(session_commits), total_ins, total_dels, len(unique_files))
        session_id = f"{repo_name[:2]}{idx + 1:03d}"
        result.append({
            "id": session_id,
            "repo": repo_name,
            "start": start_dt,
            "end": end_dt,
            "duration_min": duration_min,
            "commit_count": len(session_commits),
            "files_changed": unique_files,
            "insertions": total_ins,
            "deletions": total_dels,
            "dominant_category": dom_cat,
            "color": categories.get(dom_cat, {}).get("color", "#94a3b8"),
            "messages": messages,
            "intensity": intensity,
            "texture_url": None,
        })
    return result


def load_existing_sessions(path):
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"⚠ sessions.json read failed: {exc}", file=sys.stderr)
        return []
    if isinstance(data, list):
        return data
    print("⚠ sessions.json is not a list; ignoring.", file=sys.stderr)
    return []


def merge_sessions(existing, generated, preserve_fields):
    existing_map = {
        s.get("id"): s for s in existing if isinstance(s, dict) and s.get("id")
    }
    generated_map = {
        s.get("id"): s for s in generated if isinstance(s, dict) and s.get("id")
    }

    merged = []
    for session_id, gen in generated_map.items():
        if session_id in existing_map:
            cur = existing_map[session_id]
            merged_entry = dict(cur)
            for key, val in gen.items():
                if key not in merged_entry or merged_entry[key] in (None, ""):
                    merged_entry[key] = val
            for key in preserve_fields:
                if key in cur and cur[key] not in (None, ""):
                    merged_entry[key] = cur[key]
            merged.append(merged_entry)
        else:
            merged.append(gen)

    for session_id, cur in existing_map.items():
        if session_id not in generated_map:
            merged.append(cur)

    return merged, existing_map, generated_map


def parse_iso(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def parse_date_range(range_str):
    if not range_str:
        return None
    parts = [p.strip() for p in re.split(r"[〜~]", range_str) if p.strip()]
    if not parts:
        return None
    start_part = parts[0]
    end_part = parts[-1]
    year_match = re.search(r"(\d{4})", start_part)
    year = year_match.group(1) if year_match else None
    if year and not re.search(r"\d{4}", end_part):
        end_part = f"{year}-{end_part}"
    normalized = end_part.replace("/", "-").replace(".", "-").replace(" ", "")
    return parse_iso(normalized)


def session_end_ts(session):
    if not isinstance(session, dict):
        return 0
    dt = parse_iso(session.get("end"))
    if not dt:
        dt = parse_date_range(session.get("date_range", ""))
    if not dt:
        dt = parse_iso(session.get("start"))
    if not dt:
        return 0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp()


def main():
    parser = argparse.ArgumentParser(description="git log → sessions.json")
    parser.add_argument("--repo", help="対象リポジトリ名")
    parser.add_argument("--path", help="リポジトリのローカルパス（CI用。configのlocal_pathを上書き）")
    parser.add_argument("--since", help="開始日 (YYYY-MM-DD)")
    parser.add_argument("--dry-run", action="store_true", help="標準出力のみ")
    parser.add_argument("--output", help="出力先パス")
    parser.add_argument("--merge", action="store_true", default=True, help="既存sessions.jsonとマージ（デフォルト）")
    args = parser.parse_args()

    config = load_config()
    categories = config.get("categories", DEFAULT_CATEGORIES) or DEFAULT_CATEGORIES
    gap_hours = config.get("session_gap_hours", 3)

    ci_workspace = os.getenv("GITHUB_WORKSPACE") if os.getenv("GITHUB_ACTIONS") == "true" else None
    if ci_workspace and not args.repo and not args.path:
        repo_name = os.getenv("GITHUB_REPOSITORY", Path(ci_workspace).name).split("/")[-1]
        targets = [
            {
                "name": repo_name,
                "local_path": ci_workspace,
                "permissions": ["read_log"],
                "auto_approve": True,
            }
        ]
    elif args.repo:
        targets = [r for r in config.get("approved_repos", []) if r["name"] == args.repo]
        if not targets:
            print(f"✗ '{args.repo}' は approved_repos に含まれない", file=sys.stderr)
            sys.exit(1)
    else:
        targets = config.get("approved_repos", [])

    if not targets:
        print("✗ approved_repos が空です。--path か --repo を指定してください。", file=sys.stderr)
        sys.exit(1)

    all_sessions = []
    for repo_def in targets:
        repo_name = repo_def["name"]
        print(f"\n--- {repo_name} ---", file=sys.stderr)
        approved = check_approval(repo_name, config, repo_def)
        if not approved:
            continue
        if "read_log" not in approved.get("permissions", []):
            print("  ✗ read_log 権限なし", file=sys.stderr)
            continue
        repo_path = args.path if args.path else repo_def["local_path"]
        commits = get_git_log(repo_path, since=args.since)
        print(f"  コミット数: {len(commits)}", file=sys.stderr)
        if not commits:
            continue
        sessions = split_sessions(commits, gap_hours)
        print(f"  セッション数: {len(sessions)}", file=sys.stderr)
        session_jsons = build_session_json(sessions, repo_name, categories)
        all_sessions.extend(session_jsons)

    output_path = Path(
        args.output or str(PROJECT_ROOT / config.get("output_path", "assets/devlog/sessions.json"))
    )

    existing_sessions = []
    existing_map = {}
    generated_map = {s.get("id"): s for s in all_sessions if isinstance(s, dict) and s.get("id")}

    if args.merge:
        existing_sessions = load_existing_sessions(output_path)
        merged_sessions, existing_map, generated_map = merge_sessions(
            existing_sessions,
            all_sessions,
            PRESERVE_FIELDS,
        )
    else:
        merged_sessions = all_sessions

    merged_sessions.sort(key=session_end_ts, reverse=True)
    output_json = json.dumps(merged_sessions, indent=2, ensure_ascii=False)

    if args.merge:
        existing_ids = set(existing_map.keys())
        generated_ids = set(generated_map.keys())
        added = sorted(generated_ids - existing_ids)
        updated = sorted(generated_ids & existing_ids)
        kept = sorted(existing_ids - generated_ids)
        print(
            f"\nmerge: existing={len(existing_ids)} added={len(added)} updated={len(updated)} kept={len(kept)}",
            file=sys.stderr,
        )

    if args.dry_run:
        print(output_json)
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output_json, encoding="utf-8")
        print(f"\n✓ {len(merged_sessions)} sessions → {output_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
