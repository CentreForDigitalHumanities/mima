const path = require('path');
const colors = require('colors/safe');
const fs = require('fs');
// relative to /frontend
const assetsDir = 'src/assets';

const questions = JSON.parse(fs.readFileSync(`${assetsDir}/cleaned_translation_questions.json`));
// * > answers > answer
const answers = Object.values(questions).flatMap(question => question.answers).map(answers => answers.answer);
const judgments = JSON.parse(fs.readFileSync(`${assetsDir}/likert_scales_merged.json`));
// * > main_question
const judgmentQuestions = Object.values(judgments).map(judgment => judgment.main_question);

function countTokens(line) {
    if (line === 'unattested') {
        return 0;
    }

    // only count tokens with actual characters in them
    return line.split(' ').filter(t => t.replace(/[^A-Za-z]/g, '').length).length;
}

function count(items, method) {
    let result = 0;
    for (const item of items) {
        result += method(item);
    }
    return result;
}

writeCount(count(answers, countTokens) + count(judgmentQuestions, countTokens));


function writeCount(tokenCount) {
    const versionFilePath = path.join(__dirname + '/../src/environments/counts.ts');
    const src = `export const tokenCount = ${tokenCount};`;

    // ensure version module pulls value from package.json
    fs.writeFile(versionFilePath, src, { flat: 'w' }, function (err) {
        if (err) {
            return console.log(colors.red(err));
        }

        console.log(colors.green(`Token count ${colors.yellow(tokenCount)}`));
    });
}

