# Remove User Profile Report Variants Design

## Goal

Remove app-level report profile and variant selection so the product exposes only two report surfaces: the daily dashboard and the full report.

## Scope

MiniKit and Farcaster integration stays in place. The removal is limited to app report/profile selection surfaces, variant-oriented API behavior, and related UI props.

## Report Products

- Dashboard page `/` loads the upstream daily dashboard report from `GET /api/v1/public/reports/macro/report/daily`.
- Full report page `/full-report` loads the upstream full report from `GET /api/v1/public/reports/macro/report/default`.

## Architecture

The upstream API client will use a fixed report kind union instead of arbitrary variant strings. The local Next API proxy will accept only `report=daily` or `report=default`, defaulting to `daily` for existing dashboard callers. The cache key will use report kind, not variant.

Client pages will pass report kind and local storage cache keys through `useMacroReport`. Report rendering will no longer accept or forward profile labels or cadence selection props. The header card will show report data only, without profile or daily/weekly controls.

## Error Handling

The local proxy returns HTTP 400 for unsupported report values. Upstream failures continue returning HTTP 502 with debug detail outside production.

## Testing

Tests will cover upstream client URL mapping and local proxy rejection of unsupported report values. Existing cache and download tests will be updated from variant language to report kind language where the touched code requires it.
