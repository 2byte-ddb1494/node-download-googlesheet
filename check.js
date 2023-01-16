const axios = require('axios');
const dsv = require('dsv');
const fs = require('node:fs');
const path = require('node:path');

const urlSheet = require('./sheet-url');
const logs = [];

async function download(url) {
  let data = (await axios.get(url)).data;
  data = dsv.csv.parse(data);
  data = data.map((e) => {
    delete e[''];
    return e;
  });
  return { url, data };
}

/* 
다운로드 폴더 내 파일이 Google Sheet 웹게시 내용과 일치한 지 비교하고 log남기기.
*/
async function check(no, compareData) {
  try {
    const filename = path.resolve(__dirname, `downloads/${no}.json`);
    const json = JSON.parse(fs.readFileSync(filename));
    json.no = no;
    let compareDataKeys = Object.keys(compareData).sort();
    let jsonKeys = Object.keys(json).sort();

    if (compareDataKeys.length != jsonKeys.length) {
      logs.push(
        `Not same length - no(${no}): ${JSON.stringify(
          compareDataKeys,
        )} ${JSON.stringify(jsonKeys)}`,
      );
      return false;
    }

    if (!compareDataKeys.every((a) => jsonKeys.some((b) => a == b))) {
      logs.push(`Not same key - no(${no})`);
      return false;
    }

    if (
      !compareDataKeys.every((a) =>
        jsonKeys.some((b) => {
          const rs = json[a] == compareData[b];
          console.log({ rs, a, b });
          return rs;
        }),
      )
    ) {
      logs.push(`Not same value - no(${no})`);
      return false;
    }
  } catch (error) {
    logs.push(error.stack);
    return false;
  }
  // check entries
  return true;
}

async function start() {
  let _ok = true; // ret

  try {
    const e = await download(urlSheet);
    const { url, data } = e;
    for (const row of data) {
      let { no } = row;
      if (no) {
        // filename = path.resolve(__dirname, `downloads/${filename}.json`);
        if (await check(no, row)) {
          logs.push(`OK: ${no}`);
          console.log('OK:', no);
        } else {
          logs.push(`NG: ${no}`);
          console.log('NG:', no);
        }
      } else {
        _ok = false;
        logs.push(`NG: ${JSON.stringify(row)}`);
        console.log('NG:', no);
      }
    }
  } catch (error) {
    _ok = false;
    logs.push(error.stack);
    console.log(error.stack);
  }
  // log file
  fs.writeFileSync(path.resolve('logs', 'check.log'), logs.join('\n'), {
    flag: 'w',
  });

  return { ok: _ok }; // ret
}

start();
