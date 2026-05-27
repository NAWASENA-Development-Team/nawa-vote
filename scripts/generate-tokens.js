const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('\x1b[31mError: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local!\x1b[0m');
  process.exit(1);
}

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, serviceKey);

// 2. Token Generator Helper
function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, O, 0, 1
  let token = 'NW-';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// 3. Main Runner
async function main() {
  // Get count from CLI argument, default to 100
  const args = process.argv.slice(2);
  const count = args[0] ? parseInt(args[0], 10) : 100;

  if (isNaN(count) || count <= 0) {
    console.error('\x1b[31mError: Jumlah token harus berupa angka positif!\x1b[0m');
    process.exit(1);
  }

  console.log(`\n\x1b[36m====================================================\x1b[0m`);
  console.log(`\x1b[36m NAWA-VOTE TOKEN GENERATOR \x1b[0m`);
  console.log(`\x1b[36m====================================================\x1b[0m`);
  console.log(`Memulai generate \x1b[33m${count}\x1b[0m token...`);

  const tokens = [];
  const uniqueTokens = new Set();

  while (uniqueTokens.size < count) {
    uniqueTokens.add(generateToken());
  }

  const tokenArray = Array.from(uniqueTokens);
  const payload = tokenArray.map((token) => ({
    token,
    has_voted: false,
  }));

  console.log(`Mengunggah ke database public.voters...`);

  // Insert in chunks of 500 to avoid request size limits
  const chunkSize = 500;
  let successCount = 0;

  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('voters').insert(chunk);

    if (error) {
      console.error(`\x1b[31mGagal mengunggah chunk ${i / chunkSize + 1}:`, error.message, `\x1b[0m`);
    } else {
      successCount += chunk.length;
      console.log(`✓ Berhasil mengunggah chunk ${i / chunkSize + 1} (${chunk.length} token)`);
    }
  }

  if (successCount === 0) {
    console.error(`\n\x1b[31m[Gagal] Tidak ada token yang berhasil disimpan di database.\x1b[0m`);
    process.exit(1);
  }

  // 4. Save to CSV for distribution
  const csvHeaders = 'Token,Status\n';
  const csvRows = tokenArray.map(t => `${t},Belum Memilih`).join('\n');
  const csvContent = csvHeaders + csvRows;

  const exportPath = path.join(__dirname, '..', `NW_Tokens_Export_${Date.now()}.csv`);
  fs.writeFileSync(exportPath, csvContent, 'utf8');

  console.log(`\n\x1b[32m[Sukses] Berhasil membuat dan menyimpan ${successCount} token di database!\x1b[0m`);
  console.log(`File DPT Token berhasil diekspor untuk cetak ke:`);
  console.log(`\x1b[33m${exportPath}\x1b[0m\n`);
}

main().catch((err) => {
  console.error('\x1b[31mTerjadi kesalahan fatal:', err, '\x1b[0m');
});
