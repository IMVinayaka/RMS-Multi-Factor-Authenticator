# TalentProATS Job Analysis

This module adds the public TalentProATS Job Analysis page without changing the existing Login or MFA flow.

## Route

The page is available at:

```txt
/job-analysis
```

Routing is handled by the catch-all Next.js pages route:

```txt
src/pages/[...talentproRoute].tsx
```

The route map lives here:

```txt
src/TalentProATS/routes/index.ts
```

To add another TalentProATS page later, create a component inside `src/TalentProATS/app` and add it to the route map.

## Main Files

```txt
src/TalentProATS/app/JobAnalysis.tsx
src/TalentProATS/styles/JobAnalysis.css
src/TalentProATS/data/JDanalysis.json
```

`JobAnalysis.tsx` renders the dashboard UI.

`JobAnalysis.css` contains all Job Analysis layout, spacing, card, chip, loader, and font styles.

`JDanalysis.json` is the current mock data source.

## Data Source

The page currently imports data from:

```ts
import jdAnalysis from "@/TalentProATS/data/JDanalysis.json";
```

All visible job values should come from this object shape so it can later be replaced by an API response with the same fields.

Important fields currently used:

```txt
jobId
jobInfo.jobTitle
jobInfo.primaryTitle
jobInfo.relatedTitles
jobInfo.department
jobInfo.seniorityLevel
jobInfo.employmentType
location
compensation
experience
skills
skillExperienceRequirements
education.educationQualification
education.certifications
industryDomains
technologies
searchOptimization
summary
```

The education field supports both the new and old names:

```txt
education.educationQualification
education.degrees
```

## Loader

The page shows a short AI loader before rendering the dashboard.

The loader uses the same MUI `AutoAwesomeIcon` visual language as the `AI Powered` chip and displays:

```txt
Job Analysis ID: <jobId>
```

## Styling Rules

The Job Analysis page uses this exact font stack:

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

Bold text is normalized with:

```css
:where(strong, b) {
  font-weight: 600;
}
```

The page is centered with a 20px side gutter:

```css
width: calc(100% - 40px);
margin: 0 auto;
```

## API Migration

When replacing JSON with an API, keep the response shape the same and replace the local import with fetched data.

Example target flow:

```ts
const data = apiResponse;
```

Avoid hardcoding display values in the component. Keep derived values, such as formatted salary and remote yes/no text, inside the component helpers.

## Notes

- This page is public and does not check authentication.
- Login and MFA files should not be modified for this feature.
- MUI components and MUI icons are used for UI consistency.
- `lucide-react` is not used in this page.
