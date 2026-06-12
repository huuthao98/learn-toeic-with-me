const xlsx = require('xlsx');
const wb = xlsx.readFile('d:\\work\\personal-project\\learn-english\\2024_test1.xlsx');
const wsName = wb.SheetNames.find(n => n.includes('Template')) || wb.SheetNames[0];
const ws = wb.Sheets[wsName];
const data = xlsx.utils.sheet_to_json(ws);
console.log('Sheet Name:', wsName);
console.log('Keys of first row:');
if (data.length > 0) {
  console.log(Object.keys(data[0]));
} else {
  console.log("No data found");
}
