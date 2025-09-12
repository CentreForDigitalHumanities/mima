const fs = require('fs');
// relative to /frontend
const assetsDir = 'src/assets';
const files = fs.readdirSync(assetsDir);

let merged = {};

for (const file of files) {
    if (file.startsWith('likert_scales')) {
        Object.assign(merged, JSON.parse(fs.readFileSync(`${assetsDir}/${file}`)));
    }
}

fs.writeFileSync(`${assetsDir}/likert_scales_merged.json`, JSON.stringify(merged));
