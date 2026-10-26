import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const dataDirs = [
  path.join(__dirname, '../../data'),
  path.join(__dirname, '../../data/cleaned')
];

const discover = async () => {
  for (const dir of dataDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (file.endsWith('.csv')) {
        const filePath = path.join(dir, file);
        
        let rowCount = 0;
        let headers: string[] = [];
        
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (h) => headers = h)
            .on('data', () => rowCount++)
            .on('end', resolve)
            .on('error', reject);
        });
        
        console.log(`\nDATASET: ${file}`);
        console.log(`Path: ${dir}`);
        console.log(`Rows: ${rowCount}`);
        console.log(`Columns: ${headers.length}`);
        console.log(`Headers: ${headers.join(', ')}`);
      }
    }
  }
};

discover().catch(console.error);
