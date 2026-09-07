import io
import json
import datetime
from typing import Any, Dict, List, Optional
import pandas as pd


def build_executive_html_report(
    session_data: Dict[str, Any],
    history: List[Dict[str, Any]],
    df: Optional[pd.DataFrame] = None,
) -> str:
    """
    Generates a standalone, beautifully styled Executive Data Science HTML report
    with embedded CSS and print-ready formatting.
    """
    filename = session_data.get("original_filename", "Dataset")
    metadata = session_data.get("metadata")
    profile = session_data.get("profile") or {}
    health = session_data.get("health_score") or {}

    row_count = metadata.row_count if metadata else profile.get("row_count", 0)
    col_count = metadata.col_count if metadata else profile.get("col_count", 0)
    overall_score = health.get("overall_score", 100)
    grade = health.get("grade", "A")
    issues = profile.get("quality_issues", [])
    recommendations = session_data.get("recommendations") or []
    columns = profile.get("columns", [])

    generated_date = datetime.datetime.now().strftime("%B %d, %Y at %H:%M:%S")

    # Health score color helper
    if overall_score >= 85:
        score_color = "#10b981"
    elif overall_score >= 70:
        score_color = "#3b82f6"
    elif overall_score >= 50:
        score_color = "#f59e0b"
    else:
        score_color = "#ef4444"

    # Build issues rows
    issues_rows_html = ""
    if issues:
        for issue in issues:
            severity = issue.get("severity", "medium").lower()
            badge_color = (
                "#ef4444" if severity == "critical" or severity == "high"
                else "#f59e0b" if severity == "medium"
                else "#3b82f6"
            )
            issues_rows_html += f"""
            <tr>
                <td><span style="background:{badge_color}20; color:{badge_color}; padding: 3px 8px; border-radius: 6px; font-weight: bold; text-transform: uppercase; font-size: 11px;">{severity}</span></td>
                <td><strong>{issue.get('issue_type', 'Quality Issue')}</strong></td>
                <td><code>{issue.get('column', 'Dataset-level')}</code></td>
                <td>{issue.get('description', '')}</td>
                <td><em>{issue.get('suggested_fix', 'Review in cleaning step')}</em></td>
            </tr>
            """
    else:
        issues_rows_html = "<tr><td colspan='5' style='text-align:center; color:#10b981; padding: 16px;'>✓ No critical data quality issues identified.</td></tr>"

    # Build columns rows
    cols_rows_html = ""
    for col in columns[:30]:
        null_pct = col.get("null_percentage", 0)
        null_color = "#ef4444" if null_pct > 20 else "#94a3b8"
        cols_rows_html += f"""
        <tr>
            <td><strong>{col.get('name')}</strong></td>
            <td><code>{col.get('dtype')}</code></td>
            <td style="color:{null_color}; font-weight:600;">{null_pct}% ({col.get('null_count', 0)})</td>
            <td>{col.get('unique_count', 'N/A')}</td>
            <td>{col.get('cardinality_ratio', 0):.3f}</td>
        </tr>
        """

    # Build history rows
    history_rows_html = ""
    if history:
        for h in history[:10]:
            status_badge = (
                "<span style='color:#10b981; font-weight:bold;'>SUCCESS</span>"
                if h.get("success")
                else "<span style='color:#ef4444; font-weight:bold;'>FAILED</span>"
            )
            history_rows_html += f"""
            <tr>
                <td><code>{h.get('action', 'N/A')}</code></td>
                <td>{status_badge}</td>
                <td>{h.get('target_column') or '—'}</td>
                <td>{h.get('execution_time_seconds', 0):.2f}s</td>
                <td>{h.get('created_at', '')[:19].replace('T', ' ')}</td>
            </tr>
            """
    else:
        history_rows_html = "<tr><td colspan='5' style='text-align:center; color:#94a3b8; padding: 16px;'>Initial upload session.</td></tr>"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Data Science Report — {filename}</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #090d16;
            color: #e2e8f0;
            padding: 40px 20px;
            line-height: 1.6;
        }}
        .container {{
            max-width: 1100px;
            margin: 0 auto;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 24px;
            padding: 48px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #334155;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }}
        .header-title h1 {{
            font-size: 26px;
            font-weight: 800;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 6px;
        }}
        .header-title p {{
            font-size: 13px;
            color: #94a3b8;
        }}
        .badge {{
            display: inline-block;
            background: rgba(99, 102, 241, 0.15);
            border: 1px solid rgba(99, 102, 241, 0.3);
            color: #818cf8;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }}
        .stat-card {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
        }}
        .stat-label {{
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            font-weight: 600;
            margin-bottom: 4px;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: 800;
            color: #f8fafc;
            font-family: monospace;
        }}
        .section {{
            margin-bottom: 36px;
        }}
        .section-title {{
            font-size: 16px;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .health-hero {{
            display: flex;
            align-items: center;
            gap: 32px;
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
            border: 1px solid #334155;
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
        }}
        .score-circle {{
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 6px solid {score_color};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }}
        .score-num {{
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            line-height: 1;
        }}
        .score-grade {{
            font-size: 11px;
            font-weight: 700;
            color: {score_color};
            margin-top: 2px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        }}
        th {{
            background: #1e293b;
            color: #94a3b8;
            padding: 12px 16px;
            font-weight: 600;
            border-bottom: 1px solid #334155;
        }}
        td {{
            padding: 12px 16px;
            border-bottom: 1px solid #1e293b;
            color: #cbd5e1;
        }}
        tr:hover td {{
            background: rgba(255, 255, 255, 0.02);
        }}
        code {{
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background: #1e293b;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            color: #cbd5e1;
        }}
        .footer {{
            border-top: 1px solid #334155;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }}
        @media print {{
            body {{ background: #fff; color: #000; padding: 0; }}
            .container {{ border: none; box-shadow: none; padding: 0; background: #fff; color: #000; }}
            .stat-card, th {{ background: #f1f5f9; border-color: #cbd5e1; color: #000; }}
            td {{ border-color: #e2e8f0; color: #334155; }}
            .header-title h1 {{ color: #000; -webkit-text-fill-color: #000; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-title">
                <span class="badge">Executive Intelligence Summary</span>
                <h1 style="margin-top: 8px;">AI Data Science Report</h1>
                <p>Dataset: <strong>{filename}</strong> | Generated on {generated_date}</p>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 11px; color: #64748b;">Powered by</span><br>
                <strong style="color: #818cf8; font-size: 14px;">DataMorph AI Engine</strong>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Rows</div>
                <div class="stat-value">{row_count:,}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Columns</div>
                <div class="stat-value">{col_count}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Health Score</div>
                <div class="stat-value" style="color: {score_color};">{overall_score:.1f}/100</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Quality Issues</div>
                <div class="stat-value" style="color: {'#ef4444' if len(issues) > 0 else '#10b981'};">{len(issues)}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📊 Dataset Health & Reliability Audit</div>
            <div class="health-hero">
                <div class="score-circle">
                    <div class="score-num">{int(overall_score)}</div>
                    <div class="score-grade">GRADE {grade}</div>
                </div>
                <div style="flex: 1;">
                    <h3 style="color: #f8fafc; font-size: 16px; margin-bottom: 6px;">Audit Summary</h3>
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                        This dataset achieved an overall health rating of <strong>{overall_score:.1f}% (Grade {grade})</strong>.
                        The score reflects composite evaluation of completeness, schema consistency, uniqueness of identifiers, and numerical validity.
                    </p>
                    <div style="margin-top: 12px; display: flex; gap: 16px; font-size: 12px; font-family: monospace;">
                        <span>Completeness: <strong>{health.get('completeness', 100):.1f}%</strong></span>
                        <span>Consistency: <strong>{health.get('consistency', 100):.1f}%</strong></span>
                        <span>Validity: <strong>{health.get('validity', 100):.1f}%</strong></span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">⚠️ Detected Data Quality Findings</div>
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; overflow: hidden;">
                <table>
                    <thead>
                        <tr>
                            <th>Severity</th>
                            <th>Issue Type</th>
                            <th>Column</th>
                            <th>Details</th>
                            <th>Remediation Suggestion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues_rows_html}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📋 Schema & Column Distribution Profile</div>
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; overflow: hidden;">
                <table>
                    <thead>
                        <tr>
                            <th>Column Name</th>
                            <th>Data Type</th>
                            <th>Null Percentage</th>
                            <th>Unique Values</th>
                            <th>Cardinality Ratio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cols_rows_html}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-title">⚡ Multi-Agent Analysis History</div>
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; overflow: hidden;">
                <table>
                    <thead>
                        <tr>
                            <th>Pipeline Action</th>
                            <th>Status</th>
                            <th>Target Column</th>
                            <th>Execution Duration</th>
                            <th>Executed At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history_rows_html}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer">
            Generated autonomously by AI Data Scientist Platform • Confidential Analytical Summary
        </div>
    </div>
</body>
</html>
"""
    return html_content


def build_multisheet_excel_report(
    session_data: Dict[str, Any],
    history: List[Dict[str, Any]],
    df: Optional[pd.DataFrame] = None,
) -> bytes:
    """
    Builds a structured, multi-sheet Excel workbook containing:
    1. Executive Summary
    2. Quality Issues
    3. Columns Profile
    4. Dataset Sample (first 100 rows)
    5. Analysis History
    """
    output = io.BytesIO()
    filename = session_data.get("original_filename", "Dataset")
    profile = session_data.get("profile") or {}
    health = session_data.get("health_score") or {}
    columns = profile.get("columns", [])
    issues = profile.get("quality_issues", [])

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        # Sheet 1: Executive Summary
        summary_rows = [
            {"Metric": "Dataset Filename", "Value": filename},
            {"Metric": "Total Rows", "Value": profile.get("row_count", len(df) if df is not None else 0)},
            {"Metric": "Total Columns", "Value": profile.get("col_count", len(df.columns) if df is not None else 0)},
            {"Metric": "Overall Health Score", "Value": f"{health.get('overall_score', 100):.1f} / 100"},
            {"Metric": "Health Grade", "Value": health.get("grade", "A")},
            {"Metric": "Completeness Score", "Value": f"{health.get('completeness', 100):.1f}%"},
            {"Metric": "Consistency Score", "Value": f"{health.get('consistency', 100):.1f}%"},
            {"Metric": "Uniqueness Score", "Value": f"{health.get('uniqueness', 100):.1f}%"},
            {"Metric": "Validity Score", "Value": f"{health.get('validity', 100):.1f}%"},
            {"Metric": "Total Quality Issues Detected", "Value": len(issues)},
            {"Metric": "Generated Timestamp", "Value": datetime.datetime.now().isoformat()},
        ]
        pd.DataFrame(summary_rows).to_excel(writer, sheet_name="Executive_Summary", index=False)

        # Sheet 2: Quality Issues
        if issues:
            pd.DataFrame(issues).to_excel(writer, sheet_name="Quality_Issues", index=False)
        else:
            pd.DataFrame([{"Status": "No issues detected"}]).to_excel(writer, sheet_name="Quality_Issues", index=False)

        # Sheet 3: Columns Profile
        if columns:
            pd.DataFrame(columns).to_excel(writer, sheet_name="Columns_Profile", index=False)

        # Sheet 4: Data Sample (First 100 rows)
        if df is not None:
            df.head(100).to_excel(writer, sheet_name="Data_Sample", index=False)

        # Sheet 5: Analysis History
        if history:
            pd.DataFrame(history).to_excel(writer, sheet_name="Analysis_History", index=False)

    return output.getvalue()
