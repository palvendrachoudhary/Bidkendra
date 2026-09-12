const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/core').types;

function replaceSqlParams(sql) {
    let count = 1;
    return sql.replace(/\?/g, () => `$${count++}`);
}

function processFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    
    if (!code.includes('db.prepare') && !code.includes('db.exec')) {
        return;
    }
    
    console.log(`Processing ${filePath}`);
    
    const ast = parser.parse(code, {
        sourceType: 'unambiguous',
        plugins: ['jsx', 'typescript']
    });

    traverse(ast, {
        CallExpression(path) {
            if (!t.isMemberExpression(path.node.callee)) return;
            
            const propName = path.node.callee.property.name;
            if (!['get', 'all', 'run'].includes(propName)) return;
            
            const object = path.node.callee.object;
            if (!t.isCallExpression(object)) return;
            if (!t.isMemberExpression(object.callee)) return;
            if (object.callee.object.name !== 'db' || object.callee.property.name !== 'prepare') return;
            
            const prepareArgs = object.arguments;
            const queryArgs = path.node.arguments;
            
            let sqlNode = prepareArgs[0];
            if (t.isStringLiteral(sqlNode)) {
                sqlNode = t.stringLiteral(replaceSqlParams(sqlNode.value));
            } else if (t.isTemplateLiteral(sqlNode)) {
                let currentCount = 1;
                sqlNode.quasis.forEach(q => {
                    q.value.raw = q.value.raw.replace(/\?/g, () => `$${currentCount}`);
                    q.value.cooked = q.value.cooked ? q.value.cooked.replace(/\?/g, () => `$${currentCount}`) : q.value.raw;
                    // Count was advanced in raw replacement, need to fix this
                    // Better approach:
                });
                
                // Let's do a simpler replacement for template literals
                let count = 1;
                sqlNode.quasis.forEach(q => {
                    let replacedRaw = q.value.raw;
                    let replacedCooked = q.value.cooked;
                    let idx = replacedRaw.indexOf('?');
                    while (idx !== -1) {
                        replacedRaw = replacedRaw.substring(0, idx) + `$${count}` + replacedRaw.substring(idx + 1);
                        if (replacedCooked) {
                           let idxC = replacedCooked.indexOf('?');
                           replacedCooked = replacedCooked.substring(0, idxC) + `$${count}` + replacedCooked.substring(idxC + 1);
                        }
                        count++;
                        idx = replacedRaw.indexOf('?', idx + 1);
                    }
                    q.value.raw = replacedRaw;
                    q.value.cooked = replacedCooked;
                });
            }
            
            const dbQueryCall = t.callExpression(
                t.memberExpression(t.identifier('db'), t.identifier('query')),
                queryArgs.length > 0 ? [sqlNode, t.arrayExpression(queryArgs)] : [sqlNode]
            );
            
            let replacement;
            if (propName === 'get') {
                replacement = t.memberExpression(
                    t.memberExpression(
                        t.awaitExpression(dbQueryCall),
                        t.identifier('rows')
                    ),
                    t.numericLiteral(0),
                    true
                );
            } else if (propName === 'all') {
                replacement = t.memberExpression(
                    t.awaitExpression(dbQueryCall),
                    t.identifier('rows')
                );
            } else if (propName === 'run') {
                replacement = t.awaitExpression(dbQueryCall);
            }
            
            let parentFunc = path.getFunctionParent();
            if (parentFunc) {
                parentFunc.node.async = true;
            }
            
            path.replaceWith(replacement);
        }
    });

    traverse(ast, {
        CallExpression(path) {
            if (t.isMemberExpression(path.node.callee) &&
                path.node.callee.object.name === 'db' &&
                path.node.callee.property.name === 'exec') {
                
                path.node.callee.property.name = 'query';
                let replacement = t.awaitExpression(path.node);
                
                let parentFunc = path.getFunctionParent();
                if (parentFunc) {
                    parentFunc.node.async = true;
                }
                
                path.replaceWith(replacement);
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

walk(path.join(__dirname, 'src'));
