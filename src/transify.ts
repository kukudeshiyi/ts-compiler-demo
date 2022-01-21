import ts from "typescript";

main(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});

function main(file: string[], options?: ts.CompilerOptions) {
  const program = ts.createProgram(file, options || {});
  const sourceFiles = program.getSourceFiles();
  // const checker = program.getTypeChecker();
  const result: string[] = [];
  let currentSourceFile: ts.SourceFile | null = null;
  sourceFiles.forEach((sourceFile) => {
    if (sourceFile.isDeclarationFile) {
      return;
    }
    currentSourceFile = sourceFile;
    ts.forEachChild(sourceFile, visit);
  });

  function visit(node: ts.Node) {
    // 遍历节点
    // 找到类型 以及 node的 name
    if (
      ts.isCallExpression(node)
      // /^(i18n|i)\.t\((.{1,})\)$/.test(node.getFullText())
    ) {
      // const expressionFullText = node.getFullText(currentSourceFile!);
      // if (!/^(i18n|i)\.t\((.{1,})\)$/.test(expressionFullText)) {
      //   return;
      // }
      // 校验调用
      const expression = node.expression;
      console.log(expression);
      if (!ts.isPropertyAccessExpression(expression)) {
        return;
      }
      const paramsNode = node.arguments[0] as ts.StringLiteral;
      // console.log("paramsNode", paramsNode);
      result.push(paramsNode.text);
    }
    ts.forEachChild(node, visit);
  }

  console.log("result", result);
}
