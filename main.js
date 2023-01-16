const axios = require('axios');
const dsv = require('dsv');
const fs = require('node:fs').promises;
const path = require('node:path');

// console.log(dsv.csv)

const list = [
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS2geaFhTyEXiuqSdKl5DJBoq64vYp0ScGZLQb8GXdu1s6CxStTWt1We0VxcFmvJzyflr-2Brxp9LX1/pub?gid=0&single=true&output=csv',
];

async function* download(list) {
  for (const url of list) {
    let data = (await axios.get(url)).data;
    data = dsv.csv.parse(data);
    data = data.map((e) => {
      delete e[''];
      return e;
    });
    yield { url, data };
  }
}

async function start() {
  const logs = [];

  try {
    for await (let e of download(list)) {
      const { url, data } = e;

      for (const row of data) {
        let filename = row.no;
        if (filename) {
          filename = path.resolve(__dirname, `downloads/${filename}.json`);
          let json = { ...row };
          delete json.no;
          fs.writeFile(filename, JSON.stringify(json, null, 4));

          logs.push(`OK: ${JSON.stringify(row)}`);
        } else {
          logs.push(`NG: ${JSON.stringify(row)}`);
        }
      }
    }
  } catch (error) {
    logs.push(error.stack);
  }
  fs.writeFile('main.log', logs.join('\n'));
}

start();
