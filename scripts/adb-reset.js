const { execSync } = require('child_process');

function reset() {
  console.log('🔄 Resetting Android environment...');
  
  const currentPid = process.pid;
  const processes = ['adb.exe', 'java.exe', 'node.exe'];
  
  for (const proc of processes) {
    try {
      console.log(`🕵️ Checking for ${proc}...`);
      
      // Get all instances of the process with their PIDs
      let output = '';
      try {
        output = execSync(`tasklist /FI "IMAGENAME eq ${proc}" /FO CSV /NH`).toString();
      } catch (e) {
        // No processes found or tasklist error
        continue;
      }

      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (!line || !line.includes(',')) continue;
        
        const parts = line.split(',');
        const pid = parseInt(parts[1].replace(/"/g, ''), 10);
        
        if (isNaN(pid)) continue;

        // CRITICAL: Do not kill the current process!
        if (pid === currentPid) {
          console.log(`  ⏩ Skipping current reset process (PID ${pid})`);
          continue;
        }

        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`  ✅ Terminated ${proc} (PID ${pid})`);
        } catch (e) {
          // Process might have exited already
        }
      }
    } catch (e) {
      console.log(`⚠️  Skip ${proc}: ${e.message}`);
    }
  }

  console.log('⏳ Waiting for ports to clear (3s)...');
  const start = Date.now();
  while (Date.now() - start < 3000) { /* sync sleep */ }

  console.log('🌐 Starting ADB daemon...');
  try {
    execSync('adb start-server', { stdio: 'inherit' });
    console.log('✨ ADB is ready.');
  } catch (e) {
    console.log('ℹ️ ADB check complete.');
  }

  console.log('🏁 Reset complete. Building...');
}

try {
  reset();
} catch (err) {
  console.log('❌ Unexpected error:', err.message);
}
// Ensure we exit cleanly to trigger the next command in the chain
process.exit(0);
