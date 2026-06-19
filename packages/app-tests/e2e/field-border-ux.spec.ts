import { seedPendingDocumentWithFullFields } from '@documenso/prisma/seed/documents';
import { seedTestEmail, seedUser } from '@documenso/prisma/seed/users';
import { expect, test } from '@playwright/test';
import { FieldType } from '@prisma/client';

import { signSignaturePad } from '../fixtures/signature';

/**
 * BORD-01: Grey border on field completion
 * BORD-02: Revert border on field clear (Remove action)
 * BORD-03: Grey border applies to all field types (SIGNATURE, DATE, TEXT, INITIALS, CHECKBOX)
 */

test.describe.configure({ mode: 'parallel', timeout: 60000 });

test('[BORD-01]: should render grey border (ring-neutral-400) on completed SIGNATURE field', async ({ page }) => {
  const { user, team } = await seedUser();

  const { recipients } = await seedPendingDocumentWithFullFields({
    owner: user,
    teamId: team.id,
    recipients: [seedTestEmail()],
  });

  const recipient = recipients[0];
  const signatureField = recipient.fields.find((f) => f.type === FieldType.SIGNATURE);

  if (!signatureField) {
    throw new Error('No SIGNATURE field found in seeded document');
  }

  const signUrl = `/sign/${recipient.token}`;

  // Before sign: border should be gray-200 (default)
  await page.goto(signUrl);
  await expect(page.getByRole('heading', { name: 'Sign Document' })).toBeVisible();

  await expect(page.locator(`#field-${signatureField.id}`)).toHaveCSS('--tw-ring-color', 'rgb(229, 231, 235)');

  // Sign the field
  await signSignaturePad(page);
  await page.locator(`#field-${signatureField.id}`).getByRole('button').click();

  // After sign: border should be neutral-400 (grey)
  await expect(page.locator(`#field-${signatureField.id}`)).toHaveAttribute('data-inserted', 'true');
  await expect(page.locator(`#field-${signatureField.id}`)).toHaveCSS('--tw-ring-color', 'rgb(163, 163, 163)');
});

test('[BORD-02]: should revert border to gray-200 after Remove action on completed field', async ({ page }) => {
  const { user, team } = await seedUser();

  const { recipients } = await seedPendingDocumentWithFullFields({
    owner: user,
    teamId: team.id,
    recipients: [seedTestEmail()],
  });

  const recipient = recipients[0];
  const signatureField = recipient.fields.find((f) => f.type === FieldType.SIGNATURE);

  if (!signatureField) {
    throw new Error('No SIGNATURE field found in seeded document');
  }

  const signUrl = `/sign/${recipient.token}`;

  await page.goto(signUrl);
  await expect(page.getByRole('heading', { name: 'Sign Document' })).toBeVisible();

  // Sign the field
  await signSignaturePad(page);
  await page.locator(`#field-${signatureField.id}`).getByRole('button').click();

  // Verify inserted state
  await expect(page.locator(`#field-${signatureField.id}`)).toHaveAttribute('data-inserted', 'true');
  await expect(page.locator(`#field-${signatureField.id}`)).toHaveCSS('--tw-ring-color', 'rgb(163, 163, 163)');

  // Click Remove button via the verified-working selector (button.z-10)
  await page.locator(`#field-${signatureField.id} button.z-10`).click({ force: true });

  // After Remove: border reverts to gray-200 and data-inserted is false
  await expect(page.locator(`#field-${signatureField.id}`)).toHaveAttribute('data-inserted', 'false');
  await expect(page.locator(`#field-${signatureField.id}`)).toHaveCSS('--tw-ring-color', 'rgb(229, 231, 235)');
});

test('[BORD-03]: should render grey border (neutral-400) on all field types after signing', async ({ page }) => {
  const { user, team } = await seedUser();

  const { recipients } = await seedPendingDocumentWithFullFields({
    owner: user,
    teamId: team.id,
    recipients: [seedTestEmail()],
    fields: [FieldType.SIGNATURE, FieldType.DATE, FieldType.TEXT, FieldType.INITIALS, FieldType.CHECKBOX],
  });

  const recipient = recipients[0];

  const signUrl = `/sign/${recipient.token}`;

  await page.goto(signUrl);
  await expect(page.getByRole('heading', { name: 'Sign Document' })).toBeVisible();

  for (const field of recipient.fields) {
    // Verify initial state: gray-200 border, not inserted
    await expect(page.locator(`#field-${field.id}`)).toHaveCSS('--tw-ring-color', 'rgb(229, 231, 235)');
    await expect(page.locator(`#field-${field.id}`)).toHaveAttribute('data-inserted', 'false');

    // Sign/fill the field based on type
    switch (field.type) {
      case FieldType.SIGNATURE:
      case FieldType.INITIALS: {
        await signSignaturePad(page);
        await page.locator(`#field-${field.id}`).getByRole('button').click();
        break;
      }
      case FieldType.DATE:
      case FieldType.CHECKBOX: {
        await page.locator(`#field-${field.id}`).getByRole('button').click();
        break;
      }
      case FieldType.TEXT: {
        await page.locator(`#field-${field.id}`).getByRole('button').click();
        await page.locator('#custom-text').fill('TEXT');
        await page.getByRole('button', { name: 'Save' }).click();
        break;
      }
      default:
        throw new Error(`Unhandled field type: ${field.type}`);
    }

    // After signing: border should be neutral-400, data-inserted should be true
    await expect(page.locator(`#field-${field.id}`)).toHaveAttribute('data-inserted', 'true');
    await expect(page.locator(`#field-${field.id}`)).toHaveCSS('--tw-ring-color', 'rgb(163, 163, 163)');
  }
});
