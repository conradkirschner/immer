const fs = require('fs');
// here we store code examples
const codeFolder = './docs/code/';

// here we store english text raw markdown
const docsFolder = './docs/raw/';

// output path
const buildFolder = './docs-build/';

// code language support
const buildVersion = process.env.DOCS_BUILD_CODE_LANGUAGE.toString().replace(/ /g, '');

let type = 'js';
if (buildVersion === 'js') {
    type = 'js';
} else if (buildVersion === 'ts') {
    type = 'ts';
} else {
    process.exit(-1)
}

const buildDoc = () => {
    fs.readdirSync(docsFolder).forEach(file => {
        fs.readFile(docsFolder + '/' + file, 'utf8', function (err,markdownData) {
            if (err) {
                return console.log(err);
            }
            let currentMarkdown = markdownData;


            let running = analyseDocs(file,currentMarkdown);
            while(running) {
                running = analyseDocs(file,currentMarkdown);
                if (!running) {
                    break;
                }
                currentMarkdown = running;
            } // recrusive deep check
            writeDocs (currentMarkdown,file)
        });
    });
}
function analyseDocs(file, markdownData) {

    // CODE_FILE_INJECTION(introduction-example)
    const result = markdownData.indexOf("CODE_FILE_INJECTION(");
    if (result === -1) {
        return false;
    }
    const injectionText = markdownData.substring(result).split(')') [0];
    const injectionFile = injectionText.split('(')[1].split(')')[0];

    try {
        const codeData = fs.readFileSync(codeFolder + injectionFile + '.' + type, 'UTF-8');
        let markdownedInjectionText = codeData;
        switch (type) {
            case "js":
                markdownedInjectionText = '[Javascript]("'+buildFolder.replace('./', '')+type+'/'+file+'#'+injectionFile+') | [Typscript]("'+buildFolder+type+'/'+file+') \n ### <a name="'+injectionFile+'"></a>';
                markdownedInjectionText += '```javascript\n' + codeData + '\n```';
                markdownedInjectionText = '[//]: # (This was insert by build job. ' +
                    'Edit file ./docs/code/'+ injectionFile + '.js Then build:docs) \n'
                    + markdownedInjectionText;
                break;
            case "ts":
                markdownedInjectionText = '```typescript\n' + codeData + '\n```';
                markdownedInjectionText = '[//]: # (This was insert by build job. ' +
                    'Edit file ./docs/code/'+ injectionFile + '.ts Then build:docs) \n'
                    + markdownedInjectionText;
                break;
        }
        return markdownData.replace(injectionText + ')', markdownedInjectionText);
    } catch (e) {
        console.log(e);
    }
    return false;
}

function writeDocs(finalMarkdown, file) {

    if (!fs.existsSync(buildFolder + type + '/')){
        fs.mkdirSync(buildFolder + type + '/');
    }
    fs.writeFileSync(buildFolder + type + '/' + file, finalMarkdown, 'utf8');
    return finalMarkdown;
}

function cleanup(buildFolder) {
    if (!fs.existsSync(buildFolder)){
        fs.mkdirSync(buildFolder);
    }
    fs.rmdirSync(buildFolder + type + '/', { recursive: true });
    fs.mkdir(buildFolder + type + '/', 775, () => {});
}

cleanup(buildFolder);
buildDoc();
console.info("Build successful");