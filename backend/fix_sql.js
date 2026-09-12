const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/core').types;

function processFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    
    if (!code.includes('db.query')) {
        return;
    }
    
    console.log(`Processing ${filePath}`);
    
    const ast = parser.parse(code, {
        sourceType: 'unambiguous',
        plugins: ['jsx', 'typescript']
    });

    traverse(ast, {
        CallExpression(path) {
            if (t.isMemberExpression(path.node.callee) &&
                path.node.callee.object.name === 'db' &&
                path.node.callee.property.name === 'query') {
                
                const sqlNode = path.node.arguments[0];
                if (!sqlNode) return;

                if (t.isStringLiteral(sqlNode)) {
                    let count = 1;
                    sqlNode.value = sqlNode.value.replace(/\$\d+/g, () => `$${count++}`);
                    sqlNode.value = sqlNode.value.replace(/datetime\('now'\)/g, "CURRENT_TIMESTAMP");
                    sqlNode.value = sqlNode.value.replace(/\"OPEN\"/g, "'OPEN'");
                } else if (t.isTemplateLiteral(sqlNode)) {
                    let count = 1;
                    sqlNode.quasis.forEach(q => {
                        q.value.raw = q.value.raw.replace(/\$\d+/g, () => `$${count++}`);
                        q.value.raw = q.value.raw.replace(/datetime\('now'\)/g, "CURRENT_TIMESTAMP");
                        q.value.raw = q.value.raw.replace(/\"OPEN\"/g, "'OPEN'");
                        
                        if (q.value.cooked) {
                            q.value.cooked = q.value.raw;
                        }
                    });
                }
            }
        }
    });
    
    const output = generate(ast, {}, code);
    fs.writeFileSync(filePath, output.code, 'utf8');
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else {
      if (file.endsWith('.js') && !file.includes('database.js')) processFile(file);
    }
  });
}

walk(path.join(__dirname, 'src/controllers'));
