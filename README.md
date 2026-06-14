# TalentProATS Job Analysis

This module adds the public Job Analysis dashboard without changing the existing Login or MFA flow.

## Route

```txt
/job-analysis
```

The catch-all route is:

```txt
src/pages/[...talentproRoute].tsx
```

The TalentProATS route map is:

```txt
src/TalentProATS/routes/index.ts
```

## Main Files

```txt
src/TalentProATS/app/JobAnalysis.tsx
src/TalentProATS/api/jobAnalysis.ts
src/TalentProATS/styles/JobAnalysis.css
```

## Live API

Method:

```txt
POST
```

URL:

```txt
https://intranet.radiants.com/RadAPIs/api/OpenAI/JDAnalyseService
```

Environment variable:

```txt
NEXT_PUBLIC_JD_ANALYSE_SERVICE_URL
```

Headers:

```txt
accept: */*
Content-Type: application/json-patch+json
```

Request body:

```json
{
  "jobId": 209572,
  "jobInstance": "RADIANT",
  "clientReference": "LRLGJP00012620"
}
```

The service function is:

```ts
analyseJobDescription(payload);
```

from:

```txt
src/TalentProATS/api/jobAnalysis.ts
```

## URL Parameters

The page reads the API payload from the URL. No static request payload is kept in the UI.

Preferred compact format:

```txt
/job-analysis?request=209572~RADIANT~LRLGJP00012620
```

Standard query format:

```txt
/job-analysis?jobId=209572&jobInstance=RADIANT&clientReference=LRLGJP00012620
```

If the required values are missing, the page shows a compact empty state instead of calling the API.

## Logging

The page and API service log each important step to the browser console:

```txt
[JobAnalysis Page] URL query
[JobAnalysis Page] Parsed payload
[JobAnalysis API] POST
[JobAnalysis API] Payload
[JobAnalysis API] Response
```

API errors are logged with:

```txt
[JobAnalysis Page] API error
```

## Response Shape Notes

The real API response supports:

```txt
education.educationQualification
summary.jobDiscriptionSummary
```

The UI also safely supports the older mock names:

```txt
education.degrees
summary.jdSummary
```

`compensation` can be `null`; the UI handles missing salary values safely.

## Styling

All Job Analysis styles are scoped in:

```txt
src/TalentProATS/styles/JobAnalysis.css
```

The page uses this font stack:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Strong text is normalized with:

```css
:where(strong, b) {
  font-weight: 600;
}
```

The page is centered with:

```css
width: calc(100% - 40px);
margin: 0 auto;
```

## Auth Boundary

This page is public. It does not add login checks and does not modify the MFA flow.
