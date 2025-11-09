# Internationalization (i18n)

This directory contains the internationalization configuration and translation files for the Kairos application.

## Supported Languages

- **English (en)** - Source language (complete)
- **Spanish (es)** - Complete ✓
- **Portuguese (pt-PT)** - In progress (42% complete)
- **German (de)** - In progress (42% complete)

## Directory Structure

```
i18n/
├── locales/          # Translation JSON files
│   ├── en.json       # English (source of truth)
│   ├── es.json       # Spanish
│   ├── pt-PT.json    # Portuguese (Portugal)
│   └── de.json       # German
├── missing-keys/     # Auto-generated files for incomplete translations
│   ├── pt-PT-missing.json
│   └── de-missing.json
├── index.ts          # i18n configuration
└── README.md         # This file
```

## Translation Files

All translation files follow a nested JSON structure organized by domain:

- `common` - Shared translations (buttons, labels, units, etc.)
- `auth` - Authentication and login
- `dashboard` - Dashboard overview
- `profile` - User profile
- `settings` - Application settings
- `leaveRequest` - Leave requests and approvals
- `timesheet` - Timesheet management
- `employees` - Employee directory
- `teamCalendar` - Team calendar
- `teamReports` - Team reports
- `apiErrors` - API error messages

### Key Structure Example

```json
{
  "common": {
    "all": "All",
    "save": "Save",
    "cancel": "Cancel",
    "unit": {
      "days": "days",
      "hours": "hours"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {{name}}"
  }
}
```

## Using Translations

Import and use the `useTranslation` hook from `react-i18next`:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome', { name: 'John' })}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Dynamic Keys

For dynamic unit translations:

```typescript
// For units (days/hours)
const unit = 'days'; // or 'hours'
const label = t(`common.unit.${unit}`);

// For icons
const icon = t(`common.icon.${unit}`);
```

### Pluralization

Use i18next's count feature for pluralization:

```typescript
t('common.unit.day', { count: 1 }); // "day"
t('common.unit.day', { count: 5 }); // "days"
```

## Translation Validation

The project includes a validation script to ensure translation completeness.

### Run Validation

```bash
# Validate all languages
pnpm i18n:validate

# Verbose output (shows all missing/extra keys)
pnpm i18n:validate:verbose

# Validate specific language
node scripts/validate-translations.mjs --lang=es
```

### Validation Output

The script will:
1. Compare each language against English (source)
2. Report missing keys
3. Report extra keys (not in English)
4. Calculate coverage percentage
5. Export missing keys to `missing-keys/` directory

Example output:
```
Language: es
────────────────────────────────────────────────────────────
✓ Complete - All keys are present
Coverage: 100% (538/538 keys)

Language: pt-PT
────────────────────────────────────────────────────────────
⚠ Incomplete
Coverage: 42.4% (228/538 keys)

Missing Keys: 310
  • apiErrors.alreadyExists
  • apiErrors.approvalRequired
  ...
```

## Adding New Translations

### 1. Add to English First (Source of Truth)

Always add new keys to `en.json` first:

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}
```

### 2. Run Validation

```bash
pnpm i18n:validate
```

This will identify the new keys as "missing" in other languages and export them to `missing-keys/`.

### 3. Translate to Other Languages

Option A: Manually add to each language file

```json
// es.json
{
  "myFeature": {
    "title": "Mi Función",
    "description": "Descripción de la función"
  }
}
```

Option B: Use the exported missing keys files as a template

1. Open `missing-keys/es-missing.json`
2. Translate each value
3. Merge into `es.json`

### 4. Verify Completeness

```bash
pnpm i18n:validate
```

All languages should show 100% coverage.

## Best Practices

### 1. Reuse Common Translations

Before adding a new key, check if a similar translation exists in `common`:

```typescript
// ❌ Bad - creating duplicate translations
t('myFeature.save')
t('myOtherFeature.save')

// ✓ Good - reusing common translation
t('common.save')
```

### 2. Use Namespacing

Organize translations by feature/domain:

```json
{
  "leaveRequest": {
    "form": { ... },
    "table": { ... },
    "status": { ... }
  }
}
```

### 3. Use Interpolation

Use placeholders for dynamic content:

```json
{
  "greeting": "Hello, {{name}}!",
  "itemsSelected": "{{count}} items selected"
}
```

```typescript
t('greeting', { name: 'John' }); // "Hello, John!"
t('itemsSelected', { count: 5 }); // "5 items selected"
```

### 4. Avoid Hardcoded Strings

Always use translation keys instead of hardcoded text:

```typescript
// ❌ Bad
<button>Save Changes</button>
const unit = leave.unit === 'days' ? 'Days' : 'Hours';

// ✓ Good
<button>{t('common.save')}</button>
const unit = t(`common.unit.${leave.unit}`);
```

### 5. Keep Keys Flat When Possible

Prefer flat structures over deeply nested ones:

```json
// ✓ Good
{
  "form.title": "Title",
  "form.description": "Description"
}

// ❌ Avoid excessive nesting
{
  "deeply": {
    "nested": {
      "structure": {
        "title": "Title"
      }
    }
  }
}
```

## Changing Language

Users can change language via:
1. **Settings page** (`/settings`) - Display tab
2. **Profile page** - Language selector (if implemented)

Language preference is:
- Stored in Zustand store (`useUIStore`)
- Persisted to localStorage (`kairos-ui`)
- Applied to `document.documentElement.lang` attribute
- Synced with i18next via `ThemeSync` component

## Troubleshooting

### Translations not updating

1. Clear browser cache and localStorage
2. Restart dev server
3. Check browser console for i18n errors

### Missing translation shows key instead of text

1. Verify key exists in all language files
2. Run `pnpm i18n:validate` to check for missing keys
3. Check console for i18n warnings

### Language not persisting

1. Check that `ThemeSync` component is mounted in `BaseLayout`
2. Verify localStorage has `kairos-ui` entry
3. Check that inline script in `BaseLayout.astro` runs before first render

## CI/CD Integration

Consider adding translation validation to CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate Translations
  run: pnpm i18n:validate
```

This ensures all translations remain complete before merging changes.
