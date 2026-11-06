# KONE Header Logo Update

Status: Deployed

Approved by the user on 2026-11-06 for the existing target below.

## Scope

Publish the existing, locally verified KONE header logo change. No new resources,
infrastructure changes, API changes, workshop data changes, or Git commits.

## Existing Target

- Static Web App: swa-use-case-discovery-04533
- Resource group: rg-use-case-discovery
- Subscription: FO-BSDEV_DYN_AX
- Subscription ID: 853a151d-93f2-492d-aaa3-2058ce27e753
- Region: westeurope
- Public URL: https://witty-sand-08eca8703.6.azurestaticapps.net
- Deployment method: existing Static Web Apps CLI release process, not azd.

## Release Steps

1. Confirm Azure authentication and the existing deployment target.
2. Validate frontend build, logo asset, API build and API tests.
3. Package the application using the existing release process outside OneDrive.
4. Deploy to the existing production environment, preserving the managed API.
5. Verify the public page and logo asset, header placement and public API.

## Existing Verification

- Frontend production build passed after the header change.
- Browser checks at 1440px and 375px confirmed one loaded logo in the header,
  without overlap, linking to the home page.
- API was not running locally; live data was not verified in the local preview.

## Validation Checks

All validation checks pass:
- Confirm the authenticated subscription and existing production hostname.
- Build the frontend and API; run API tests.
- Verify the packaged logo and Static Web Apps configuration.
- RBAC/IaC changes: not applicable; no provisioning or role changes.

## 7: Validation Proof

Validation performed on 2026-11-06:
- `npm --prefix app run build`: passed.
- `npm --prefix api run build`: passed.
- `npm --prefix api test`: passed, 9 tests across 2 files.
- `az account show`: authenticated; default subscription is not the target.
- `az staticwebapp show --subscription FO-BSDEV_DYN_AX`: confirmed the existing
    resource, subscription ID, West Europe location and approved public hostname.
- Node assertions: packaged SVG exists, SWA config parses, and existing staged
    API production dependencies match the current API manifest.
- RBAC, Bicep, Terraform, Docker and policy changes: not applicable to this
    code-only update. No provisioning or Azure configuration changes requested.
- Target subscription will be supplied explicitly; no default context changes.
- No validation failures remain. Production verification follows deployment.

## Deployment Result

- Published to production on 2026-11-06 using Static Web Apps CLI 2.1.0.
- Public URL: https://witty-sand-08eca8703.6.azurestaticapps.net
- Live browser checks at 1440px and 375px: one loaded KONE logo in the header,
  fitting the viewport without overlapping the title and linking home.
- Live `/api/ideas`: HTTP 200 with existing workshop data.
- CLI emitted a workflow job-name warning but completed the direct deployment.
- No infrastructure, settings, workshop data, or Git history changes were made.