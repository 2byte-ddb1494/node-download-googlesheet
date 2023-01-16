const axios = require('axios');
const dsv = require('dsv');
const fs = require('node:fs');
const path = require('node:path');

const urlSheet = require('./sheet-url');

async function download(url) {
  let data = (await axios.get(url)).data;
  data = dsv.csv.parse(data);
  data = data.map((e) => {
    delete e[''];
    return e;
  });
  return { url, data };
}

async function start() {
  let _ok = true; // ret
  let _data = null; // ret

  const logs = [];

  try {
    const e = await download(urlSheet);
    const { url, data } = e;
    _data = data;
    for (const row of data) {
      let filename = row.no;
      if (filename) {
        filename = path.resolve(__dirname, `downloads/${filename}.json`);
        let json = { ...row };
        delete json.no;
        fs.writeFileSync(filename, JSON.stringify(json, null, 4));
        logs.push(`OK: ${JSON.stringify(row)}`);
        console.log('OK:', row.no);
      } else {
        _ok = false;
        logs.push(`NG: ${JSON.stringify(row)}`);
        console.log('NG:', row.no);
      }
    }
  } catch (error) {
    _ok = false;
    logs.push(error.stack);
    console.log(error.stack);
  }
  // log file
  fs.writeFileSync(path.resolve('logs', 'downloads.log'), logs.join('\n'));

  return { ok: _ok, data: _data }; // ret
}

start();
