import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL!;
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

const sql = postgres(DATABASE_URL);

async function main() {
  // Immutability trigger — prevents mutating finalized receipts at the DB level
  await sql`
    CREATE OR REPLACE FUNCTION prevent_finalized_receipt_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.state = 'finalized' AND NEW.state = 'finalized' THEN
        IF OLD.verdict_text IS DISTINCT FROM NEW.verdict_text OR
           OLD.finalized_at IS DISTINCT FROM NEW.finalized_at OR
           OLD.finalize_mode IS DISTINCT FROM NEW.finalize_mode THEN
          RAISE EXCEPTION 'Cannot mutate a finalized receipt';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`DROP TRIGGER IF EXISTS receipts_immutability_guard ON receipts`;

  await sql`
    CREATE TRIGGER receipts_immutability_guard
    BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION prevent_finalized_receipt_mutation();
  `;

  // Seed the hardcoded dev user
  await sql`
    INSERT INTO users (id, timezone, locale, paper_aesthetic, subscription_tier)
    VALUES (
      ${DEV_USER_ID},
      'Asia/Taipei',
      'en-TW',
      'classic_thermal',
      'free'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  console.log('✓ Immutability trigger created');
  console.log(`✓ Dev user seeded: ${DEV_USER_ID}`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
