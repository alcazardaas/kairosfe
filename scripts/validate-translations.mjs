#!/usr/bin/env node

/**
 * Translation Validation Script
 *
 * Validates all translation files against the English source of truth.
 * Checks for:
 * - Missing keys in each language
 * - Extra keys that don't exist in English
 * - Structural consistency
 * - Coverage percentage
 *
 * Usage:
 *   node scripts/validate-translations.js
 *   node scripts/validate-translations.js --verbose
 *   node scripts/validate-translations.js --lang=es
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, '../apps/kairosfe/src/lib/i18n/locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'pt-PT', 'de'];
const SOURCE_LANGUAGE = 'en';

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const langFilter = args.find(arg => arg.startsWith('--lang='))?.split('=')[1];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Load and parse a JSON translation file
 */
function loadTranslationFile(lang) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Translation file not found: ${filePath}`);
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse ${lang}.json: ${error.message}`);
  }
}

/**
 * Recursively get all keys from a nested object
 * Returns array of dot-notation keys (e.g., "common.unit.days")
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

/**
 * Get value at a dot-notation path in an object
 */
function getValueAtPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Validate a single language against the source
 */
function validateLanguage(sourceLang, targetLang) {
  const source = loadTranslationFile(sourceLang);
  const target = loadTranslationFile(targetLang);

  const sourceKeys = getAllKeys(source);
  const targetKeys = getAllKeys(target);

  const sourceKeySet = new Set(sourceKeys);
  const targetKeySet = new Set(targetKeys);

  // Find missing keys (in source but not in target)
  const missingKeys = sourceKeys.filter(key => !targetKeySet.has(key));

  // Find extra keys (in target but not in source)
  const extraKeys = targetKeys.filter(key => !sourceKeySet.has(key));

  // Calculate coverage
  const coverage = ((targetKeys.length - extraKeys.length) / sourceKeys.length * 100).toFixed(1);

  return {
    lang: targetLang,
    totalSourceKeys: sourceKeys.length,
    totalTargetKeys: targetKeys.length,
    missingKeys,
    extraKeys,
    coverage: parseFloat(coverage),
    isComplete: missingKeys.length === 0 && extraKeys.length === 0,
  };
}

/**
 * Print validation results for a language
 */
function printLanguageReport(result) {
  const { lang, totalSourceKeys, totalTargetKeys, missingKeys, extraKeys, coverage, isComplete } = result;

  console.log(`\n${colors.bright}${colors.cyan}Language: ${lang}${colors.reset}`);
  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

  // Status
  if (isComplete) {
    console.log(`${colors.green}✓ Complete${colors.reset} - All keys are present`);
  } else {
    console.log(`${colors.yellow}⚠ Incomplete${colors.reset}`);
  }

  // Coverage
  const coverageColor = coverage >= 100 ? colors.green : coverage >= 80 ? colors.yellow : colors.red;
  console.log(`Coverage: ${coverageColor}${coverage}%${colors.reset} (${totalTargetKeys - extraKeys.length}/${totalSourceKeys} keys)`);

  // Missing keys
  if (missingKeys.length > 0) {
    console.log(`\n${colors.red}Missing Keys: ${missingKeys.length}${colors.reset}`);
    if (verbose) {
      missingKeys.forEach(key => {
        console.log(`  ${colors.gray}•${colors.reset} ${key}`);
      });
    } else {
      // Show first 5 in non-verbose mode
      missingKeys.slice(0, 5).forEach(key => {
        console.log(`  ${colors.gray}•${colors.reset} ${key}`);
      });
      if (missingKeys.length > 5) {
        console.log(`  ${colors.gray}... and ${missingKeys.length - 5} more (use --verbose to see all)${colors.reset}`);
      }
    }
  }

  // Extra keys
  if (extraKeys.length > 0) {
    console.log(`\n${colors.yellow}Extra Keys: ${extraKeys.length}${colors.reset} (not in ${SOURCE_LANGUAGE}.json)`);
    if (verbose) {
      extraKeys.forEach(key => {
        console.log(`  ${colors.gray}•${colors.reset} ${key}`);
      });
    } else {
      // Show first 3 in non-verbose mode
      extraKeys.slice(0, 3).forEach(key => {
        console.log(`  ${colors.gray}•${colors.reset} ${key}`);
      });
      if (extraKeys.length > 3) {
        console.log(`  ${colors.gray}... and ${extraKeys.length - 3} more (use --verbose to see all)${colors.reset}`);
      }
    }
  }
}

/**
 * Print summary table
 */
function printSummaryTable(results) {
  console.log(`\n${colors.bright}${colors.blue}Summary${colors.reset}`);
  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}\n`);

  // Header
  console.log(
    `${colors.bright}` +
    `Language`.padEnd(12) +
    `Coverage`.padEnd(12) +
    `Missing`.padEnd(12) +
    `Extra`.padEnd(12) +
    `Status` +
    `${colors.reset}`
  );
  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

  // Rows
  results.forEach(result => {
    const statusIcon = result.isComplete ? `${colors.green}✓${colors.reset}` : `${colors.yellow}⚠${colors.reset}`;
    const coverageColor = result.coverage >= 100 ? colors.green : result.coverage >= 80 ? colors.yellow : colors.red;

    console.log(
      `${result.lang}`.padEnd(12) +
      `${coverageColor}${result.coverage}%${colors.reset}`.padEnd(22) +  // Extra padding for color codes
      `${result.missingKeys.length}`.padEnd(12) +
      `${result.extraKeys.length}`.padEnd(12) +
      statusIcon
    );
  });

  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}\n`);
}

/**
 * Export missing keys to JSON files for easy translation
 */
function exportMissingKeys(results) {
  const exportDir = path.join(__dirname, '../apps/kairosfe/src/lib/i18n/missing-keys');

  // Create export directory if it doesn't exist
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const source = loadTranslationFile(SOURCE_LANGUAGE);

  results.forEach(result => {
    if (result.missingKeys.length > 0) {
      // Build object with missing keys and their English values
      const missingKeysObj = {};

      result.missingKeys.forEach(key => {
        const value = getValueAtPath(source, key);
        if (value !== undefined) {
          // Create nested structure
          const parts = key.split('.');
          let current = missingKeysObj;

          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }

          current[parts[parts.length - 1]] = value;
        }
      });

      // Write to file
      const outputPath = path.join(exportDir, `${result.lang}-missing.json`);
      fs.writeFileSync(
        outputPath,
        JSON.stringify(missingKeysObj, null, 2),
        'utf-8'
      );

      console.log(`${colors.gray}Exported missing keys for ${result.lang} to: ${outputPath}${colors.reset}`);
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bright}${colors.blue}Translation Validation Tool${colors.reset}`);
  console.log(`${colors.gray}Source language: ${SOURCE_LANGUAGE}${colors.reset}`);
  console.log(`${colors.gray}Locales directory: ${LOCALES_DIR}${colors.reset}\n`);

  try {
    // Determine which languages to validate
    const languagesToValidate = langFilter
      ? [langFilter]
      : SUPPORTED_LANGUAGES.filter(lang => lang !== SOURCE_LANGUAGE);

    // Validate each language
    const results = languagesToValidate.map(lang =>
      validateLanguage(SOURCE_LANGUAGE, lang)
    );

    // Print individual reports
    results.forEach(printLanguageReport);

    // Print summary table
    if (results.length > 1) {
      printSummaryTable(results);
    }

    // Export missing keys
    console.log();
    exportMissingKeys(results);

    // Exit code
    const allComplete = results.every(r => r.isComplete);
    if (!allComplete) {
      console.log(`\n${colors.yellow}⚠ Some translations are incomplete${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}✓ All translations are complete!${colors.reset}`);
      process.exit(0);
    }

  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
