import ts, { forEachChild } from "typescript";
import path from "path";
import fs from "fs";

// function compile(fileNames: string[], options: ts.CompilerOptions): void {
//   let program = ts.createProgram(fileNames, options);
//   let emitResult = program.emit();

//   let allDiagnostics = ts
//     .getPreEmitDiagnostics(program)
//     .concat(emitResult.diagnostics);

//   allDiagnostics.forEach((diagnostic) => {
//     if (diagnostic.file) {
//       let { line, character } = ts.getLineAndCharacterOfPosition(
//         diagnostic.file,
//         diagnostic.start!
//       );
//       let message = ts.flattenDiagnosticMessageText(
//         diagnostic.messageText,
//         "\n"
//       );
//       console.log(
//         `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
//       );
//     } else {
//       console.log(
//         ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
//       );
//     }
//   });

//   let exitCode = emitResult.emitSkipped ? 1 : 0;
//   console.log(`Process exiting with code '${exitCode}'.`);
//   process.exit(exitCode);
// }

// compile(process.argv.slice(2), {
//   noEmitOnError: true,
//   noImplicitAny: true,
//   target: ts.ScriptTarget.ES5,
//   module: ts.ModuleKind.CommonJS,
// });

// slqcmt: 貌似在直接获取 typescript 对应的 javascript 时候不会检查类型
// const source = "const x: {a:string}  = 1";

// let result = ts.transpileModule(source, {
//   compilerOptions: { module: ts.ModuleKind.CommonJS },
// });

// console.log(JSON.stringify(result));

// get DTS
// function compile(fileNames: string[], options: ts.CompilerOptions) {
//   const createdFiles = {};
//   const host = ts.createCompilerHost(options);
//   host.writeFile = (fileName: string, content: string) =>
//     (createdFiles[fileName] = content);

//   const program = ts.createProgram(fileNames, options, host);
//   program.emit();

//   // console.log(JSON.stringify(createdFiles));
//   // 将 key 处理为绝对路径
//   const handleCreatedFiles = Object.keys(createdFiles).reduce(
//     (lastValue, key) => {
//       return {
//         ...lastValue,
//         [path.resolve(process.cwd(), key)]: createdFiles[key],
//       };
//     },
//     {}
//   );

//   fileNames.forEach((fileName) => {
//     console.log("### JavaScript\n");
//     console.log(host.readFile(fileName));
//     console.log("### Type Definition\n");
//     const dts = path.resolve(fileName.replace(".ts", ".d.ts"));
//     console.log("dts", dts);
//     console.log(handleCreatedFiles[dts]);
//   });
// }

// compile(process.argv.slice(2), {
//   allowJs: true,
//   declaration: true,
//   emitDeclarationOnly: true,
// });

/**
 * Prints out particular nodes from a source file
 *
 * @param file a path to a file
 * @param identifiers top level identifiers available
 */
// function extract(file: string, identifiers: string[]): void {
//   // Create a Program to represent the project, then pull out the
//   // source file to parse its AST.
//   let program = ts.createProgram([file], { allowJs: true });
//   const sourceFile = program.getSourceFile(file);

//   // To print the AST, we'll use TypeScript's printer
// const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

//   // To give constructive error messages, keep track of found and un-found identifiers
//   const unfoundNodes = [],
//     foundNodes = [];

//   // Loop through the root AST nodes of the file
//   ts.forEachChild(sourceFile, (node) => {
//     let name = "";

//     // This is an incomplete set of AST nodes which could have a top level identifier
//     // it's left to you to expand this list, which you can do by using
//     // https://ts-ast-viewer.com/ to see the AST of a file then use the same patterns
//     // as below
//     if (ts.isFunctionDeclaration(node)) {
//       name = node.name.text;
//       // Hide the method body when printing
//       node.body = undefined;
//     } else if (ts.isVariableStatement(node)) {
//       name = node.declarationList.declarations[0].name.getText(sourceFile);
//     } else if (ts.isInterfaceDeclaration(node)) {
//       name = node.name.text;
//     }

//     const container = identifiers.includes(name) ? foundNodes : unfoundNodes;
//     container.push([name, node]);
//   });

//   // Either print the found nodes, or offer a list of what identifiers were found
//   if (!foundNodes.length) {
//     console.log(
//       `Could not find any of ${identifiers.join(
//         ", "
//       )} in ${file}, found: ${unfoundNodes
//         .filter((f) => f[0])
//         .map((f) => f[0])
//         .join(", ")}.`
//     );
//     process.exitCode = 1;
//   } else {
//     foundNodes.map((f) => {
//       const [name, node] = f;
//       console.log("### " + name + "\n");
//       console.log(
//         printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
//       ) + "\n";
//     });
//   }
// }

// // Run the extract function with the script's arguments
// extract(process.argv[2], process.argv.slice(3));

// function delint(sourceFile: ts.SourceFile) {
//   function delintNode(node: ts.Node) {
//     switch (node.kind) {
//       case ts.SyntaxKind.ForStatement:
//       case ts.SyntaxKind.ForInStatement:
//       case ts.SyntaxKind.WhileKeyword:
//       case ts.SyntaxKind.DoStatement:
//         if (
//           (node as ts.IterationStatement).statement.kind !== ts.SyntaxKind.Block
//         ) {
//           report(
//             node,
//             "A looping statement's contents should be wrapped in a block body."
//           );
//         }
//         break;
//       case ts.SyntaxKind.IfStatement:
//         const ifStatement = node as ts.IfStatement;
//         if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
//           report(
//             ifStatement.thenStatement,
//             "An if statement's contents should be wrapped in a block body."
//           );
//         }
//         if (
//           ifStatement.elseStatement &&
//           ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
//           ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement
//         ) {
//           report(
//             ifStatement.elseStatement,
//             "An else statement's contents should be wrapped in a block body."
//           );
//         }
//         break;
//       case ts.SyntaxKind.BinaryExpression:
//         const op = (node as ts.BinaryExpression).operatorToken.kind;
//         if (
//           op === ts.SyntaxKind.EqualsEqualsToken ||
//           op === ts.SyntaxKind.ExclamationEqualsToken
//         ) {
//           report(node, "User '===' and '!=='");
//         }
//         break;
//     }
//     ts.forEachChild(node, delintNode);
//   }

//   function report(node: ts.Node, message: string) {
//     const { line, character } = sourceFile.getLineAndCharacterOfPosition(
//       node.getStart()
//     );
//     console.log(
//       `${sourceFile.fileName} (${line + 1},${character + 1}):  ${message}`
//     );
//   }

//   delintNode(sourceFile);
// }

// const fileNames = process.argv.slice(2);
// fileNames.forEach((fileName) => {
//   const sourceFile = ts.createSourceFile(
//     fileName,
//     fs.readFileSync(fileName).toString(),
//     ts.ScriptTarget.ES2015,
//     true
//   );
//   delint(sourceFile);
// });

// generate documentation

interface DocEntry {
  name?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  parameters?: DocEntry[];
  returnType?: string;
}

function generateDocumentation(
  fileNames: string[],
  options: ts.CompilerOptions
) {
  const program = ts.createProgram(fileNames, options);

  const checker = program.getTypeChecker();
  const output: DocEntry[] = [];

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, visit);
    }
  }

  fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));
  return;

  function visit(node: ts.Node) {
    if (!isNodeExported(node)) {
      return;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        output.push(serializeClass(symbol));
      }
    } else if (ts.isModuleDeclaration(node)) {
      ts.forEachChild(node, visit);
    }
  }

  function serializeSymbol(symbol: ts.Symbol): DocEntry {
    return {
      name: symbol.getName(),
      documentation: ts.displayPartsToString(
        symbol.getDocumentationComment(checker)
      ),
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
      ),
    };
  }

  function serializeClass(symbol: ts.Symbol) {
    const details = serializeSymbol(symbol);

    const constructorType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );

    details.constructors = constructorType
      .getConstructSignatures()
      .map(serializeSignature);
    return details;
  }

  function serializeSignature(signature: ts.Signature) {
    return {
      parameters: signature.parameters.map(serializeSymbol),
      returnType: checker.typeToString(signature.getReturnType()),
      documentation: ts.displayPartsToString(
        signature.getDocumentationComment(checker)
      ),
    };
  }

  function isNodeExported(node: ts.Node) {
    return (
      (ts.getCombinedModifierFlags(node as ts.Declaration) &
        ts.ModifierFlags.Export) !==
        0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }
}

generateDocumentation(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});
