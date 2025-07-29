const fs = require('fs');
const path = require('path');

// Define the build directory
const buildDir = path.join(__dirname, '../build');

// Function to break cache by appending a timestamp
function breakCache() {
  const indexPath = path.join(buildDir, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf-8');

  // Append a timestamp query parameter to JS file URLs
  const timestamp = Date.now();
  indexContent = indexContent.replace(
    /<script defer="defer" src="([^"]+\.js)"><\/script>/g,
    `<script defer="defer" src="$1?cache=${timestamp}"></script>`
  );

  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`Cache broken with timestamp: ${timestamp}`);
}

breakCache();