import ts from "typescript";

// 从 package.json 文件中设置的开发入口文件
// 根据入口文件创建 typescript program
// 遍历所有的 sourcefile 获取参数信息
main(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});

function main(file: string[], options?: ts.CompilerOptions) {
  const program = ts.createProgram(file, options || {});
  const sourceFiles = program.getSourceFiles();
  const checker = program.getTypeChecker();
  sourceFiles.forEach((sourceFile) => {
    if (sourceFile.isDeclarationFile) {
      return;
    }
    console.log("fileName", sourceFile.fileName);
    ts.forEachChild(sourceFile, visit);
  });

  function visit(node: ts.Node) {
    // 遍历节点
    // 找到类型 以及 node的 name
    if (ts.isInterfaceDeclaration(node) && node.name.text === "PropsType") {
      // console.log("node", node.name.text);
      const symbol = checker.getSymbolAtLocation(node.name);
      // console.log("symbol", symbol);
      const members = symbol?.members || [];
      members.forEach((member, index) => {
        const a = checker.getTypeOfSymbolAtLocation(
          member,
          member.valueDeclaration!
        );
        console.log(`member\n `, a, "result\n", checker.typeToString(a));
      });
    }
  }
}
