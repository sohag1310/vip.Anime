const fs = require('fs');
function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/vip-gold/g, 'primary');
  content = content.replace(/vip-dark/g, 'dark-base');
  content = content.replace(/vip-black/g, 'dark-bg');
  content = content.replace(/rgba\(212,175,55,/g, 'rgba(6,193,73,');
  content = content.replace(/#D4AF37/g, '#06c149'); // Just in case
  fs.writeFileSync(filePath, content);
}

replaceInFile('src/index.css');
replaceInFile('src/App.tsx');
replaceInFile('src/views/PlayerView.tsx');
replaceInFile('src/views/AnimeDetails.tsx');
