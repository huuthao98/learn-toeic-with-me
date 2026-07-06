const fs = require('fs');

const path = 'src/components/feature/AdminTestDetail/AdminTestDetail.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /acceptTypes="\.pdf"\n\s+placeholder="Tải lên hoặc dán link PDF\.\.\."/g,
  'acceptTypes=".pdf"\n                                      allowPdfCompression={true}\n                                      placeholder="Tải lên hoặc dán link PDF..."'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacing in AdminTestDetail');
